import { describe, test, expect, beforeEach } from 'bun:test';
import { LSPClientPool } from '@expo/lsp';
import type { LSPMessage, LSPTransportInterface, LSPServerConfig } from '@expo/lsp';

function createMockLSPTransport(): LSPTransportInterface {
  let messageHandler: ((message: LSPMessage) => void) | null = null;

  return {
    async start() {},
    async send(message: LSPMessage) {
      if (message.id !== undefined) {
        let result: unknown;
        switch (message.method) {
          case 'initialize':
            result = { capabilities: { textDocumentSync: 1 }, serverInfo: { name: 'mock-lsp' } };
            break;
          case 'shutdown':
            result = null;
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

describe('LSPClientPool', () => {
  let pool: LSPClientPool;

  beforeEach(() => {
    pool = new LSPClientPool();
  });

  test('addServer creates and starts a client', async () => {
    const config: LSPServerConfig = { name: 'ts-lsp', language: 'typescript', command: 'tsc' };
    const transport = createMockLSPTransport();

    await pool.addServer(config, { transport });
    const client = pool.getClient('ts-lsp');
    expect(client).toBeDefined();
    expect(client!.getState()).toBe('ready');
  });

  test('getClientForLanguage returns correct client', async () => {
    const tsConfig: LSPServerConfig = { name: 'ts-lsp', language: 'typescript', command: 'tsc' };
    const pyConfig: LSPServerConfig = { name: 'py-lsp', language: 'python', command: 'pylsp' };

    await pool.addServer(tsConfig, { transport: createMockLSPTransport() });
    await pool.addServer(pyConfig, { transport: createMockLSPTransport() });

    const tsClient = pool.getClientForLanguage('typescript');
    expect(tsClient).toBeDefined();
    expect(tsClient!.getLanguage()).toBe('typescript');

    const pyClient = pool.getClientForLanguage('python');
    expect(pyClient).toBeDefined();
    expect(pyClient!.getLanguage()).toBe('python');
  });

  test('getClientForLanguage returns undefined for unknown language', () => {
    const client = pool.getClientForLanguage('unknown');
    expect(client).toBeUndefined();
  });

  test('removeServer stops and removes a client', async () => {
    const config: LSPServerConfig = { name: 'ts-lsp', language: 'typescript', command: 'tsc' };
    await pool.addServer(config, { transport: createMockLSPTransport() });

    await pool.removeServer('ts-lsp');
    expect(pool.getClient('ts-lsp')).toBeUndefined();
    expect(pool.getClientForLanguage('typescript')).toBeUndefined();
  });

  test('getAllDiagnostics aggregates from all clients', async () => {
    const config: LSPServerConfig = { name: 'ts-lsp', language: 'typescript', command: 'tsc' };
    await pool.addServer(config, { transport: createMockLSPTransport() });

    // Diagnostics are empty by default
    const diagnostics = pool.getAllDiagnostics();
    expect(diagnostics.size).toBe(0);
  });

  test('stopAll stops all clients and clears pool', async () => {
    await pool.addServer(
      { name: 'ts-lsp', language: 'typescript', command: 'tsc' },
      { transport: createMockLSPTransport() }
    );
    await pool.addServer(
      { name: 'py-lsp', language: 'python', command: 'pylsp' },
      { transport: createMockLSPTransport() }
    );

    await pool.stopAll();
    expect(pool.getClient('ts-lsp')).toBeUndefined();
    expect(pool.getClient('py-lsp')).toBeUndefined();
  });

  test('getClients returns all active clients', async () => {
    await pool.addServer(
      { name: 'ts-lsp', language: 'typescript', command: 'tsc' },
      { transport: createMockLSPTransport() }
    );
    await pool.addServer(
      { name: 'py-lsp', language: 'python', command: 'pylsp' },
      { transport: createMockLSPTransport() }
    );

    expect(pool.getClients()).toHaveLength(2);
  });
});
