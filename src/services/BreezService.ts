import { BreezConfig, WalletInfo, PaymentInfo, SignatureResult } from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
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
  Payment,
  PayAmount,
  SdkEvent
} from '@breeztech/breez-sdk-liquid/node';

export class BreezService {
  private static instance: BreezService;
  private sdk: BindingLiquidSdk | null = null;
  private isInitialized = false;
  private synced = false;
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

      // Resolve and ensure working directory for the SDK
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const defaultWorkingDir = path.resolve(__dirname, '../../breez-data');
      const workingDir = process.env.BREEZ_WORKDIR ? process.env.BREEZ_WORKDIR : defaultWorkingDir;
      if (!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir, { recursive: true });
      }
      breezConfig.workingDir = workingDir;
      // Connect to the Breez SDK
      const connectRequest: ConnectRequest = {
        config: breezConfig,
        mnemonic: config.mnemonic
      };

      this.sdk = await connect(connectRequest);
      this.sdk.addEventListener({
        onEvent: (e: SdkEvent) => {
          if (e.type === 'synced') {
            this.synced = true;
          }
        }
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Breez SDK:', error);
    }
  }

  public async getBalance(): Promise<WalletInfo> {
    await this.ensureIsReady();

    const info: GetInfoResponse = await this.sdk!.getInfo();

    return {
      balance: info.walletInfo.balanceSat,
      address: info.walletInfo.pubkey // Using pubkey as address for now
    };
  }

  public async createInvoice(amount: number, description?: string): Promise<string> {
    await this.ensureIsReady();

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
    await this.ensureIsReady();

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

  public async payLnurlPayAddress(lnurlPayUrl: string, amount: number, comment: string = ''): Promise<'payment_sent' | 'payment_failed'> {
    await this.ensureIsReady();

    const input = await this.sdk!.parse(lnurlPayUrl)
    if (input.type === 'lnUrlPay') {
      const payAmount: PayAmount = {
        type: 'bitcoin',
        receiverAmountSat: amount
      }
      const optionalComment = comment
      const optionalValidateSuccessActionUrl = true

      const prepareResponse = await this.sdk!.prepareLnurlPay({
        data: input.data,
        amount: payAmount,
        bip353Address: input.bip353Address,
        comment: optionalComment,
        validateSuccessActionUrl: optionalValidateSuccessActionUrl
      })

      const sendResponse = await this.sdk!.lnurlPay({
        prepareResponse
      });

      return sendResponse.type === 'endpointSuccess' ? 'payment_sent' : 'payment_failed';
    }
    return 'payment_sent';
  }

  public async listPayments(): Promise<PaymentInfo[]> {
    await this.ensureIsReady();

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
    await this.ensureIsReady();

    const signRequest: SignMessageRequest = {
      message
    };

    const result = await this.sdk!.signMessage(signRequest);

    // Get wallet info to obtain the public key
    const info = await this.sdk!.getInfo();

    return {
      signature: result.signature,
      message,
      publicKey: info.walletInfo.pubkey
    };
  }

  public async verifyMessage(message: string, signature: string, publicKey: string): Promise<boolean> {
    await this.ensureIsReady();

    const checkRequest: CheckMessageRequest = {
      message,
      signature,
      pubkey: publicKey
    };

    const result = await this.sdk!.checkMessage(checkRequest);
    return result.isValid;
  }

  private async ensureIsReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.synced) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.ensureIsReady();
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