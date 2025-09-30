export interface BreezConfig {
  sdkKey: string;
  mnemonic?: string;
  network?: 'mainnet' | 'testnet';
}

export interface WalletInfo {
  balance: number;
  address?: string;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  description?: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'completed' | 'failed';
}

export interface SignatureResult {
  signature: string;
  message: string;
  publicKey: string;
}