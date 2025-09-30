#!/usr/bin/env node

import { BreezMCPServer } from './server.js';

async function main() {
  try {
    const server = new BreezMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start Breez SDK MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});