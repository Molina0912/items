import { describe, test, expect, beforeEach } from 'bun:test';
import { MCPClient } from '@expo/mcp';
import type { MCPMessage, MCPTransportInterface } from '@expo/mcp';

class SlowTransport implements MCPTransportInterface {
  public sentMessages: MCPMessage[] = [];
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  public closed = false;

  async start(): Promise<void> {}

  async send(message: MCPMessage): Promise<void> {
    this.sentMessages.push(message);
    // Auto-respond to initialize only (other requests hang)
    if (message.id !== undefined && message.method === 'initialize') {
      setTimeout(() => {
        this.messageHandler?.({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            serverInfo: { name: 'slow-server', version: '1.0.0' },
          },
        });
      }, 0);
    }
    // All other requests never get a response (simulate hang)
  }

  onMessage(cb: (message: MCPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  simulateResponse(message: MCPMessage): void {
    this.messageHandler?.(message);
  }
}

describe('MCPClient request timeout', () => {
  let transport: SlowTransport;

  beforeEach(() => {
    transport = new SlowTransport();
  });

  test('rejects request after timeout expires', async () => {
    const client = new MCPClient(
      { name: 'slow-server', transport: 'stdio' },
      { transport, requestTimeout: 50 }
    );
    await client.connect();

    // listTools will never get a response from this transport
    await expect(client.listTools()).rejects.toThrow('timed out');
  });

  test('uses default timeout of 30000ms', async () => {
    const client = new MCPClient(
      { name: 'slow-server', transport: 'stdio' },
      { transport, requestTimeout: 30 }
    );
    await client.connect();

    const start = Date.now();
    await expect(client.listTools()).rejects.toThrow('timed out');
    const elapsed = Date.now() - start;
    // Should timeout around 30ms (with some tolerance)
    expect(elapsed).toBeLessThan(200);
  });

  test('disconnect rejects all pending requests', async () => {
    const client = new MCPClient(
      { name: 'slow-server', transport: 'stdio' },
      { transport, requestTimeout: 5000 }
    );
    await client.connect();

    // Start a request that will never complete
    const promise = client.listTools();

    // Disconnect while request is pending
    await client.disconnect();

    await expect(promise).rejects.toThrow('disconnected');
  });

  test('successful response within timeout resolves normally', async () => {
    const respondingTransport: MCPTransportInterface = {
      sentMessages: [] as MCPMessage[],
      async start() {},
      async send(message: MCPMessage) {
        (this as { sentMessages: MCPMessage[] }).sentMessages.push(message);
        if (message.id !== undefined) {
          const response = createResponse(message);
          if (response) {
            setTimeout(() => handler?.(response), 5);
          }
        }
      },
      onMessage(cb) {
        handler = cb;
      },
      async close() {},
    } as MCPTransportInterface & { sentMessages: MCPMessage[] };

    let handler: ((msg: MCPMessage) => void) | null = null;

    function createResponse(req: MCPMessage): MCPMessage | null {
      if (req.method === 'initialize') {
        return { jsonrpc: '2.0', id: req.id, result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'test' } } };
      }
      if (req.method === 'tools/list') {
        return { jsonrpc: '2.0', id: req.id, result: { tools: [{ name: 'test-tool', description: 'A tool', inputSchema: {} }] } };
      }
      return null;
    }

    const client = new MCPClient(
      { name: 'fast-server', transport: 'stdio' },
      { transport: respondingTransport, requestTimeout: 1000 }
    );
    await client.connect();

    const tools = await client.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('test-tool');
  });
});
