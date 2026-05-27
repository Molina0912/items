import { describe, test, expect, beforeEach } from 'bun:test';
import { MCPClientPool } from '@expo/mcp';
import type { MCPMessage, MCPTransportInterface, MCPServerConfig } from '@expo/mcp';

function createMockTransport(tools: Array<{ name: string; description: string }>): MCPTransportInterface {
  let messageHandler: ((message: MCPMessage) => void) | null = null;

  return {
    async start() {},
    async send(message: MCPMessage) {
      if (message.id !== undefined) {
        let result: unknown;
        switch (message.method) {
          case 'initialize':
            result = { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'mock' } };
            break;
          case 'tools/list':
            result = { tools: tools.map((t) => ({ ...t, inputSchema: { type: 'object' } })) };
            break;
          case 'tools/call':
            result = { content: [{ type: 'text', text: `called ${(message.params as Record<string, unknown>).name}` }] };
            break;
          case 'resources/list':
            result = { resources: [] };
            break;
          case 'prompts/list':
            result = { prompts: [] };
            break;
          default:
            result = {};
        }
        setTimeout(() => messageHandler?.({ jsonrpc: '2.0', id: message.id, result }), 0);
      }
    },
    onMessage(cb) {
      messageHandler = cb;
    },
    async close() {},
  };
}

describe('MCPClientPool', () => {
  let pool: MCPClientPool;

  beforeEach(() => {
    pool = new MCPClientPool();
  });

  test('addServer creates and connects a client', async () => {
    const config: MCPServerConfig = { name: 'server1', transport: 'stdio' };
    const transport = createMockTransport([{ name: 'tool1', description: 'Test tool 1' }]);

    await pool.addServer(config, { clientOptions: { transport } });
    const client = pool.getClient('server1');
    expect(client).toBeDefined();
    expect(client!.getState()).toBe('ready');
  });

  test('removeServer disconnects and removes a client', async () => {
    const config: MCPServerConfig = { name: 'server1', transport: 'stdio' };
    const transport = createMockTransport([]);

    await pool.addServer(config, { clientOptions: { transport } });
    await pool.removeServer('server1');
    const client = pool.getClient('server1');
    expect(client).toBeUndefined();
  });

  test('getAllTools aggregates tools from all servers with server name prefix', async () => {
    const transport1 = createMockTransport([
      { name: 'read', description: 'Read' },
      { name: 'write', description: 'Write' },
    ]);
    const transport2 = createMockTransport([
      { name: 'search', description: 'Search' },
    ]);

    await pool.addServer({ name: 'fs', transport: 'stdio' }, { clientOptions: { transport: transport1 } });
    await pool.addServer({ name: 'search', transport: 'stdio' }, { clientOptions: { transport: transport2 } });

    const tools = await pool.getAllTools();
    expect(tools).toHaveLength(3);
    expect(tools.find((t) => t.serverName === 'fs' && t.name === 'read')).toBeDefined();
    expect(tools.find((t) => t.serverName === 'fs' && t.name === 'write')).toBeDefined();
    expect(tools.find((t) => t.serverName === 'search' && t.name === 'search')).toBeDefined();
  });

  test('callTool routes to correct server', async () => {
    const transport = createMockTransport([{ name: 'mytool', description: 'My tool' }]);
    await pool.addServer({ name: 'srv', transport: 'stdio' }, { clientOptions: { transport } });

    const result = await pool.callTool('srv', 'mytool', { arg: 'value' });
    expect(result).toBeDefined();
  });

  test('callTool throws for unknown server', async () => {
    await expect(pool.callTool('nonexistent', 'tool', {})).rejects.toThrow('MCP server not found');
  });

  test('healthCheck returns status for all servers', async () => {
    const transport1 = createMockTransport([]);
    const transport2 = createMockTransport([]);

    await pool.addServer({ name: 's1', transport: 'stdio' }, { clientOptions: { transport: transport1 } });
    await pool.addServer({ name: 's2', transport: 'stdio' }, { clientOptions: { transport: transport2 } });

    const health = await pool.healthCheck();
    expect(health.get('s1')).toBe(true);
    expect(health.get('s2')).toBe(true);
  });

  test('disconnectAll disconnects all servers', async () => {
    const transport1 = createMockTransport([]);
    const transport2 = createMockTransport([]);

    await pool.addServer({ name: 's1', transport: 'stdio' }, { clientOptions: { transport: transport1 } });
    await pool.addServer({ name: 's2', transport: 'stdio' }, { clientOptions: { transport: transport2 } });

    await pool.disconnectAll();
    expect(pool.getClient('s1')).toBeUndefined();
    expect(pool.getClient('s2')).toBeUndefined();
  });
});
