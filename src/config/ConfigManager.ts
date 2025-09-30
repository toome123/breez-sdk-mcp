import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { BreezConfig } from '../types';

dotenv.config();

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configPath: string;
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;
  private config: BreezConfig | null = null;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config.enc');
    
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    if (keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes) hex string');
    }
    
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async loadConfig(): Promise<BreezConfig> {
    if (this.config) {
      return this.config;
    }

    if (fs.existsSync(this.configPath)) {
      this.config = await this.decryptConfig();
    } else {
      // Generate new config with mnemonic if not exists
      this.config = await this.generateNewConfig();
      await this.saveConfig(this.config);
    }

    return this.config;
  }

  public async saveConfig(config: BreezConfig): Promise<void> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(config, null, 2));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const encryptedData = iv.toString('hex') + ':' + encrypted.toString('hex');
    fs.writeFileSync(this.configPath, encryptedData, 'utf8');
    
    this.config = config;
  }

  private async decryptConfig(): Promise<BreezConfig> {
    const data = fs.readFileSync(this.configPath, 'utf8');
    const [ivHex, encryptedData] = data.split(':');
    
    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted config file format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedData, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString());
  }

  private async generateNewConfig(): Promise<BreezConfig> {
    // Generate a 12-word mnemonic
    const mnemonic = this.generateMnemonic();
    
    return {
      sdkKey: process.env.BREEZ_API_KEY || '',
      mnemonic,
      network: 'testnet'
    };
  }

  private generateMnemonic(): string {
    // Use proper BIP39 mnemonic generation
    const bip39 = require('bip39');
    return bip39.generateMnemonic();
  }

  public getConfig(): BreezConfig | null {
    return this.config;
  }

  public async updateConfig(updates: Partial<BreezConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    
    this.config = { ...this.config, ...updates };
    await this.saveConfig(this.config);
  }
}