# Breez SDK MCP Server

A Model Context Protocol (MCP) server implementation for the Breez SDK with Liquid Network support. This server provides a secure, encrypted configuration system and implements all primary Breez SDK functions through MCP tools.

## Features

- **Secure Configuration**: Encrypted file-based configuration with in-memory encryption keys
- **Auto-Generated Wallets**: Automatically generates 12-word mnemonic if not provided
- **Complete Breez SDK Integration**: All primary functions available as MCP tools
- **Docker Support**: Full containerization with security best practices
- **TypeScript**: Type-safe implementation with proper error handling

## 🔧 Available MCP Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `get_balance` | Get wallet balance and receive address | None |
| `create_invoice` | Create payment invoices | `amount`, `description?` |
| `pay_invoice` | Pay Lightning invoices | `invoice` |
| `pay_lnurl_pay_address` | Pay LNURL address | `LNURL address` |
| `list_payments` | List payment history | None |
| `sign_message` | Sign messages with wallet key | `message` |
| `verify_message` | Verify signed messages | `message`, `signature`, `publicKey` |

## Prerequisites

- Node.js 22+ 
- npm
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
   
   # Breez SDK API key
   BREEZ_API_KEY=your_breez_api_key_here

   # Network 
   NETWORK= mainnet | testnet

   # MNEMONIC
   MNEMONIC= your_mnemonic
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
#### Build a image
```bash
docker build -t breez-sdk-mcp:latest .
```

#### Run it via docker
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i --rm --env-file .env breez-sdk-mcp:latest

echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_payments","arguments":{}}}' | docker run -i --rm --env-file .env breez-sdk-mcp:latest
```

## Configuration
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
- Add comprehensive logging and monitoring
- Implement proper backup and recovery procedures
- Follow your organization's security policies