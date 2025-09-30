import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BreezService } from './services/BreezService.js';

export class BreezMCPServer {
  private server: Server;
  private breezService: BreezService;

  constructor() {
    this.server = new Server(
      {
        name: 'breez-sdk-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.breezService = BreezService.getInstance();
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_balance',
            description: 'Get wallet balance and receive address',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'create_invoice',
            description: 'Create a payment invoice for receiving payments',
            inputSchema: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                  description: 'Amount in satoshis',
                },
                description: {
                  type: 'string',
                  description: 'Optional description for the invoice',
                },
              },
              required: ['amount'],
            },
          },
          {
            name: 'pay_invoice',
            description: 'Pay a Lightning invoice',
            inputSchema: {
              type: 'object',
              properties: {
                invoice: {
                  type: 'string',
                  description: 'Lightning invoice to pay',
                },
              },
              required: ['invoice'],
            },
          },
          {
            name: 'list_payments',
            description: 'List payment history',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'sign_message',
            description: 'Sign a message with the wallet private key',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Message to sign',
                },
              },
              required: ['message'],
            },
          },
          {
            name: 'verify_message',
            description: 'Verify a signed message',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Original message',
                },
                signature: {
                  type: 'string',
                  description: 'Message signature',
                },
                publicKey: {
                  type: 'string',
                  description: 'Public key used for signing',
                },
              },
              required: ['message', 'signature', 'publicKey'],
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get_balance': {
            const walletInfo = await this.breezService.getBalance();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    balance: walletInfo.balance,
                    address: walletInfo.address,
                    balanceBTC: (walletInfo.balance / 100000000).toFixed(8),
                  }, null, 2),
                },
              ],
            };
          }

          case 'create_invoice': {
            const { amount, description } = request.params.arguments as {
              amount: number;
              description?: string;
            };
            
            const invoice = await this.breezService.createInvoice(amount, description);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    invoice,
                    amount,
                    description,
                  }, null, 2),
                },
              ],
            };
          }

          case 'pay_invoice': {
            const { invoice } = request.params.arguments as { invoice: string };
            
            const paymentId = await this.breezService.payInvoice(invoice);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    paymentId,
                    invoice,
                    status: 'completed',
                  }, null, 2),
                },
              ],
            };
          }

          case 'list_payments': {
            const payments = await this.breezService.listPayments();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(payments, null, 2),
                },
              ],
            };
          }

          case 'sign_message': {
            const { message } = request.params.arguments as { message: string };
            
            const signature = await this.breezService.signMessage(message);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(signature, null, 2),
                },
              ],
            };
          }

          case 'verify_message': {
            const { message, signature, publicKey } = request.params.arguments as {
              message: string;
              signature: string;
              publicKey: string;
            };
            
            const isValid = await this.breezService.verifyMessage(message, signature, publicKey);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message,
                    signature,
                    publicKey,
                    isValid,
                  }, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                tool: request.params.name,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  public async start(): Promise<void> {
    // Initialize Breez service
    await this.breezService.initialize();

    // Start the server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Breez SDK MCP Server started');
  }
}