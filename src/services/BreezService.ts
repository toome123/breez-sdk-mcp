import { BreezConfig, WalletInfo, PaymentInfo, SignatureResult } from '../types';
import { ConfigManager } from '../config/ConfigManager';
import { 
  connect, 
  defaultConfig, 
  BindingLiquidSdk, 
  LiquidNetwork,
  Config,
  ConnectRequest,
  PrepareReceiveRequest,
  ReceivePaymentRequest,
  PaymentMethod,
  PrepareSendRequest,
  SendPaymentRequest,
  ListPaymentsRequest,
  SignMessageRequest,
  CheckMessageRequest,
  GetInfoResponse,
  Payment
} from '@breeztech/breez-sdk-liquid/node';

export class BreezService {
  private static instance: BreezService;
  private sdk: BindingLiquidSdk | null = null;
  private isInitialized = false;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  public static getInstance(): BreezService {
    if (!BreezService.instance) {
      BreezService.instance = new BreezService();
    }
    return BreezService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const config = await this.configManager.loadConfig();
      
      // Create Breez SDK configuration
      const network = this.mapNetworkToLiquidNetwork(config.network || 'testnet');
      const breezConfig: Config = defaultConfig(network, config.sdkKey);
      
      // Set working directory for the SDK
      breezConfig.workingDir = './breez-data';
      
      // Connect to the Breez SDK
      const connectRequest: ConnectRequest = {
        config: breezConfig,
        mnemonic: config.mnemonic
      };
      
      this.sdk = await connect(connectRequest);
      this.isInitialized = true;
      console.log('Breez SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Breez SDK:', error);
      throw error;
    }
  }

  public async getBalance(): Promise<WalletInfo> {
    await this.ensureInitialized();
    
    const info: GetInfoResponse = await this.sdk!.getInfo();
    
    return {
      balance: info.walletInfo.balanceSat,
      address: info.walletInfo.pubkey // Using pubkey as address for now
    };
  }

  public async createInvoice(amount: number, description?: string): Promise<string> {
    await this.ensureInitialized();
    
    // Prepare receive payment request
    const prepareRequest: PrepareReceiveRequest = {
      paymentMethod: 'lightning' as PaymentMethod,
      amount: {
        type: 'bitcoin',
        payerAmountSat: amount
      }
    };
    
    const prepareResponse = await this.sdk!.prepareReceivePayment(prepareRequest);
    
    // Create the actual invoice
    const receiveRequest: ReceivePaymentRequest = {
      prepareResponse,
      description
    };
    
    const receiveResponse = await this.sdk!.receivePayment(receiveRequest);
    return receiveResponse.destination;
  }

  public async payInvoice(invoice: string): Promise<string> {
    await this.ensureInitialized();
    
    // Prepare send payment request
    const prepareRequest: PrepareSendRequest = {
      destination: invoice
    };
    
    const prepareResponse = await this.sdk!.prepareSendPayment(prepareRequest);
    
    // Send the payment
    const sendRequest: SendPaymentRequest = {
      prepareResponse
    };
    
    const sendResponse = await this.sdk!.sendPayment(sendRequest);
    return sendResponse.payment.txId || 'payment_sent';
  }

  public async listPayments(): Promise<PaymentInfo[]> {
    await this.ensureInitialized();
    
    const listRequest: ListPaymentsRequest = {
      limit: 100 // Limit to 100 recent payments
    };
    
    const payments = await this.sdk!.listPayments(listRequest);
    
    // Transform SDK response to our PaymentInfo format
    return payments.map((payment: Payment) => ({
      id: payment.txId || crypto.randomUUID(),
      amount: payment.amountSat,
      description: this.extractDescription(payment),
      timestamp: payment.timestamp,
      type: payment.paymentType === 'receive' ? 'incoming' : 'outgoing',
      status: this.mapPaymentState(payment.status)
    }));
  }

  public async signMessage(message: string): Promise<SignatureResult> {
    await this.ensureInitialized();
    
    const signRequest: SignMessageRequest = {
      message
    };
    
    const result = this.sdk!.signMessage(signRequest);
    
    // Get wallet info to obtain the public key
    const info = await this.sdk!.getInfo();
    
    return {
      signature: result.signature,
      message,
      publicKey: info.walletInfo.pubkey
    };
  }

  public async verifyMessage(message: string, signature: string, publicKey: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const checkRequest: CheckMessageRequest = {
      message,
      signature,
      pubkey: publicKey
    };
    
    const result = this.sdk!.checkMessage(checkRequest);
    return result.isValid;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Helper methods for the real Breez SDK
  private mapNetworkToLiquidNetwork(network: string): LiquidNetwork {
    switch (network.toLowerCase()) {
      case 'mainnet':
        return 'mainnet';
      case 'testnet':
        return 'testnet';
      case 'regtest':
        return 'regtest';
      default:
        return 'testnet';
    }
  }

  private extractDescription(payment: Payment): string {
    if (payment.details?.description) {
      return payment.details.description;
    }
    return 'Lightning payment';
  }

  private mapPaymentState(state: string): 'pending' | 'completed' | 'failed' {
    switch (state) {
      case 'complete':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }
}