#!/bin/bash

# Docker setup script for Breez SDK MCP Server

set -e

echo "🐳 Setting up Breez SDK MCP Server with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker detected"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    
    # Generate encryption key
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    
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

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data
chmod 755 data

# Build and start the container
echo "🏗️  Building and starting Docker container..."
docker-compose up -d --build

# Wait a moment for the container to start
sleep 3

# Check container status
if docker-compose ps | grep -q "Up"; then
    echo "✅ Container started successfully!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "📝 View logs:"
    echo "docker-compose logs -f breez-mcp-server"
    echo ""
    echo "🛑 Stop the server:"
    echo "docker-compose down"
else
    echo "❌ Container failed to start. Check logs:"
    docker-compose logs breez-mcp-server
    exit 1
fi

echo ""
echo "🎉 Docker setup complete!"
echo "The MCP server is now running in a Docker container."