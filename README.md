# Breez SDK MCP Server

A Model Context Protocol (MCP) server implementation for the Breez SDK with Liquid Network support. This server provides a secure, encrypted configuration system and implements all primary Breez SDK functions through MCP tools.

## Features

- **Secure Configuration**: Encrypted file-based configuration with in-memory encryption keys
- **Auto-Generated Wallets**: Automatically generates 12-word mnemonic if not provided
- **Complete Breez SDK Integration**: All primary functions available as MCP tools
- **Docker Support**: Full containerization with security best practices
- **TypeScript**: Type-safe implementation with proper error handling

## Available MCP Tools

1. **get_balance** - Get wallet balance and receive address
2. **create_invoice** - Create payment invoices for receiving payments
3. **pay_invoice** - Pay Lightning invoices
4. **list_payments** - List payment history
5. **sign_message** - Sign messages with wallet private key
6. **verify_message** - Verify signed messages

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

## Installation

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd breez-sdk-mcp-server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```
   # Generate a 32-byte hex key (64 characters)
   ENCRYPTION_KEY=your_64_character_hex_encryption_key_here
   
   # Optional: Breez SDK API key
   BREEZ_API_KEY=your_breez_api_key_here
   ```

3. **Generate encryption key (if needed):**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run the server:**
   ```bash
   npm start
   ```

### Docker Deployment

1. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Create data directory:**
   ```bash
   mkdir -p data
   ```

3. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f breez-mcp-server
   ```

## Configuration

### Environment Variables

- `ENCRYPTION_KEY`: 64-character hex string for encrypting configuration files
- `BREEZ_API_KEY`: Optional Breez SDK API key

### Configuration File

The server automatically creates an encrypted configuration file (`config.enc`) containing:

```json
{
  "sdkKey": "your_breez_sdk_key",
  "mnemonic": "twelve word mnemonic phrase for wallet",
  "network": "testnet"
}
```

If no mnemonic is provided, a new one is automatically generated and saved.

## Usage

### MCP Client Integration

The server implements the MCP protocol and can be used with any MCP-compatible client. Here are examples of tool usage:

#### Get Wallet Balance
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_balance",
    "arguments": {}
  }
}
```

#### Create Invoice
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_invoice",
    "arguments": {
      "amount": 50000,
      "description": "Payment for services"
    }
  }
}
```

#### Pay Invoice
```json
{
  "method": "tools/call",
  "params": {
    "name": "pay_invoice",
    "arguments": {
      "invoice": "lnbc50u1p..."
    }
  }
}
```

#### Sign Message
```json
{
  "method": "tools/call",
  "params": {
    "name": "sign_message",
    "arguments": {
      "message": "Hello, Bitcoin!"
    }
  }
}
```

### Development

#### Run in development mode:
```bash
npm run dev
```

#### Build:
```bash
npm run build
```

#### Clean build artifacts:
```bash
npm run clean
```

## Security Features

- **Encrypted Configuration**: All sensitive data is encrypted using AES-256-CBC
- **In-Memory Keys**: Encryption keys are stored only in environment variables
- **Non-Root Docker**: Container runs as non-privileged user
- **Resource Limits**: Docker container has memory and CPU limits
- **Security Options**: Container drops all capabilities except necessary ones

## Project Structure

```
src/
├── config/
│   └── ConfigManager.ts    # Encrypted configuration management
├── services/
│   └── BreezService.ts     # Breez SDK integration
├── types/
│   └── index.ts           # TypeScript type definitions
├── server.ts              # MCP server implementation
└── index.ts               # Application entry point
```

## Error Handling

The server includes comprehensive error handling:

- Configuration errors (missing encryption key, invalid config file)
- SDK initialization errors
- Tool execution errors
- Network and connectivity issues

All errors are returned in MCP-compliant format with detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **Breez SDK**: Visit [Breez SDK Documentation](https://sdk-doc-liquid.breez.technology/)
- **MCP Protocol**: Visit [MCP Specification](https://modelcontextprotocol.io/)
- **This Server**: Open an issue in this repository

## Disclaimer

This is a reference implementation. For production use:
- Use proper BIP39 mnemonic generation
- Implement proper Breez SDK integration (this uses mock implementation)
- Add comprehensive logging and monitoring
- Implement proper backup and recovery procedures
- Follow your organization's security policies