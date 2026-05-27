import { describe, test, expect, beforeEach } from 'bun:test';
import { MCPClient } from '@expo/mcp';
import type { MCPMessage, MCPTransportInterface } from '@expo/mcp';

class MockTransport implements MCPTransportInterface {
  public sentMessages: MCPMessage[] = [];
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  public started = false;
  public closed = false;

  async start(): Promise<void> {
    this.started = true;
  }

  async send(message: MCPMessage): Promise<void> {
    this.sentMessages.push(message);
    // Auto-respond to requests
    if (message.id !== undefined) {
      const response = this.createResponse(message);
      if (response) {
        setTimeout(() => this.messageHandler?.(response), 0);
      }
    }
  }

  onMessage(cb: (message: MCPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  simulateMessage(message: MCPMessage): void {
    this.messageHandler?.(message);
  }

  private createResponse(request: MCPMessage): MCPMessage | null {
    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, resources: {}, prompts: {} },
            serverInfo: { name: 'test-server', version: '1.0.0' },
          },
        };
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              { name: 'read_file', description: 'Read a file', inputSchema: { type: 'object' } },
              { name: 'write_file', description: 'Write a file', inputSchema: { type: 'object' } },
            ],
          },
        };
      case 'tools/call':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { content: [{ type: 'text', text: 'tool result' }] },
        };
      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            resources: [
              { uri: 'file:///test.txt', name: 'test.txt', mimeType: 'text/plain' },
            ],
          },
        };
      case 'resources/read':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            contents: [{ text: 'file content', mimeType: 'text/plain' }],
          },
        };
      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            prompts: [
              { name: 'summarize', description: 'Summarize text', arguments: [{ name: 'text', required: true }] },
            ],
          },
        };
      case 'prompts/get':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            messages: [{ role: 'user', content: { type: 'text', text: 'Summary prompt' } }],
          },
        };
      default:
        return null;
    }
  }
}

describe('MCPClient', () => {
  let transport: MockTransport;
  let client: MCPClient;

  beforeEach(() => {
    transport = new MockTransport();
    client = new MCPClient(
      { name: 'test-server', transport: 'stdio' },
      { transport }
    );
  });

  test('starts in disconnected state', () => {
    expect(client.getState()).toBe('disconnected');
  });

  test('connects and transitions to ready state', async () => {
    const states: string[] = [];
    client.onStateChange((state) => states.push(state));
    await client.connect();
    expect(client.getState()).toBe('ready');
    expect(states).toContain('connecting');
    expect(states).toContain('ready');
  });

  test('sends initialize message on connect', async () => {
    await client.connect();
    const initMsg = transport.sentMessages.find((m) => m.method === 'initialize');
    expect(initMsg).toBeDefined();
    expect((initMsg!.params as Record<string, unknown>).protocolVersion).toBe('2024-11-05');
  });

  test('sends initialized notification after initialize', async () => {
    await client.connect();
    const notifMsg = transport.sentMessages.find((m) => m.method === 'notifications/initialized');
    expect(notifMsg).toBeDefined();
    expect(notifMsg!.id).toBeUndefined();
  });

  test('listTools returns tools from server', async () => {
    await client.connect();
    const tools = await client.listTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('read_file');
    expect(tools[1].name).toBe('write_file');
  });

  test('callTool sends correct request', async () => {
    await client.connect();
    const result = await client.callTool('read_file', { path: '/test.txt' });
    const callMsg = transport.sentMessages.find((m) => m.method === 'tools/call');
    expect(callMsg).toBeDefined();
    expect((callMsg!.params as Record<string, unknown>).name).toBe('read_file');
    expect(result).toBeDefined();
  });

  test('listResources returns resources from server', async () => {
    await client.connect();
    const resources = await client.listResources();
    expect(resources).toHaveLength(1);
    expect(resources[0].uri).toBe('file:///test.txt');
    expect(resources[0].name).toBe('test.txt');
  });

  test('readResource returns content', async () => {
    await client.connect();
    const result = await client.readResource('file:///test.txt');
    expect(result.content).toBe('file content');
    expect(result.mimeType).toBe('text/plain');
  });

  test('listPrompts returns prompts from server', async () => {
    await client.connect();
    const prompts = await client.listPrompts();
    expect(prompts).toHaveLength(1);
    expect(prompts[0].name).toBe('summarize');
  });

  test('getPrompt returns prompt messages', async () => {
    await client.connect();
    const result = await client.getPrompt('summarize', { text: 'hello' });
    expect(result.messages).toHaveLength(1);
  });

  test('disconnect transitions to disconnected state', async () => {
    await client.connect();
    await client.disconnect();
    expect(client.getState()).toBe('disconnected');
    expect(transport.closed).toBe(true);
  });

  test('handles error responses from server', async () => {
    const errorTransport: MCPTransportInterface = {
      async start() {},
      async send(message: MCPMessage) {
        if (message.method === 'initialize') {
          setTimeout(() => {
            messageHandler?.({
              jsonrpc: '2.0',
              id: message.id,
              result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'test' } },
            });
          }, 0);
        } else if (message.method !== 'notifications/initialized') {
          setTimeout(() => {
            messageHandler?.({
              jsonrpc: '2.0',
              id: message.id,
              error: { code: -32601, message: 'Method not found' },
            });
          }, 0);
        }
      },
      onMessage(cb) {
        messageHandler = cb;
      },
      async close() {},
    };
    let messageHandler: ((msg: MCPMessage) => void) | null = null;

    const errorClient = new MCPClient(
      { name: 'error-server', transport: 'stdio' },
      { transport: errorTransport }
    );
    await errorClient.connect();
    await expect(errorClient.listTools()).rejects.toThrow('Method not found');
  });
});
