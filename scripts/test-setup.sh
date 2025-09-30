#!/bin/bash

# Test script to verify Breez SDK MCP Server setup

set -e

echo "🧪 Testing Breez SDK MCP Server setup..."

# Check if required files exist
echo "📁 Checking project structure..."

REQUIRED_FILES=(
    "package.json"
    "tsconfig.json"
    ".env.example"
    "Dockerfile"
    "docker-compose.yml"
    "src/index.ts"
    "src/server.ts"
    "src/config/ConfigManager.ts"
    "src/services/BreezService.ts"
    "src/types/index.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Check if .env file exists or can be created
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, this is expected for fresh setup"
else
    echo "✅ .env file exists"
    
    # Check if encryption key is set
    if grep -q "your_64_character_hex_key_here" .env; then
        echo "⚠️  Please update ENCRYPTION_KEY in .env file"
    else
        echo "✅ ENCRYPTION_KEY appears to be configured"
    fi
fi

# Test TypeScript compilation
echo "🏗️  Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test Docker build
echo "🐳 Testing Docker build..."
if docker build -t breez-mcp-server-test . > /dev/null 2>&1; then
    echo "✅ Docker build successful"
    
    # Clean up test image
    docker rmi breez-mcp-server-test > /dev/null 2>&1
else
    echo "❌ Docker build failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "✅ Project structure is correct"
echo "✅ TypeScript compilation works"
echo "✅ Docker build works"
echo ""
echo "Next steps:"
echo "1. Run './scripts/setup.sh' to complete setup"
echo "2. Edit .env file with your configuration"
echo "3. Start the server with 'npm run dev' or 'docker-compose up -d'"