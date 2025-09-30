#!/bin/bash

# Breez SDK MCP Server Setup Script

set -e

echo "🚀 Setting up Breez SDK MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    
    # Generate encryption key
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env file with generated key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_64_character_hex_key_here/$ENCRYPTION_KEY/g" .env
    else
        # Linux
        sed -i "s/your_64_character_hex_key_here/$ENCRYPTION_KEY/g" .env
    fi
    
    echo "✅ Generated encryption key and updated .env file"
    echo "⚠️  Please edit .env and add your BREEZ_API_KEY if you have one"
else
    echo "✅ .env file already exists"
fi

# Create data directory for Docker
mkdir -p data

# Build the project
echo "🏗️  Building project..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your BREEZ_API_KEY (if available)"
echo "2. Run the server:"
echo "   - Development: npm run dev"
echo "   - Production: npm start"
echo "   - Docker: docker-compose up -d"
echo ""
echo "3. The server will auto-generate a wallet mnemonic on first run"
echo "   Check the encrypted config.enc file will be created"
echo ""