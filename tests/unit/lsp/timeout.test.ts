import { describe, test, expect, beforeEach } from 'bun:test';
import { LSPClient } from '@expo/lsp';
import type { LSPMessage, LSPTransportInterface } from '@expo/lsp';

class SlowLSPTransport implements LSPTransportInterface {
  public sentMessages: LSPMessage[] = [];
  private messageHandler: ((message: LSPMessage) => void) | null = null;
  public closed = false;
  private respondToInit: boolean;

  constructor(respondToInit = true) {
    this.respondToInit = respondToInit;
  }

  async start(): Promise<void> {}

  async send(message: LSPMessage): Promise<void> {
    this.sentMessages.push(message);
    // Only respond to initialize and shutdown (other requests hang)
    if (message.id !== undefined && this.respondToInit) {
      if (message.method === 'initialize') {
        setTimeout(() => {
          this.messageHandler?.({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              capabilities: { textDocumentSync: 1 },
              serverInfo: { name: 'slow-lsp', version: '1.0.0' },
            },
          });
        }, 0);
      } else if (message.method === 'shutdown') {
        setTimeout(() => {
          this.messageHandler?.({
            jsonrpc: '2.0',
            id: message.id,
            result: null,
          });
        }, 0);
      }
      // All other requests never get a response
    }
  }

  onMessage(cb: (message: LSPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

describe('LSPClient request timeout', () => {
  let transport: SlowLSPTransport;

  beforeEach(() => {
    transport = new SlowLSPTransport();
  });

  test('rejects request after timeout expires', async () => {
    const client = new LSPClient(
      { name: 'slow-lsp', language: 'typescript', command: 'test' },
      { transport, requestTimeout: 50 }
    );
    await client.start();

    // Manually send a request that will never get a response
    // We test by stopping with a custom flow: start client then make a custom request via textDocumentDidOpen
    // Actually the LSP client sendRequest is private, so we test timeout via a scenario where
    // stop() itself has to do shutdown which won't hang (since we handle it).
    // Instead, let's use a transport that doesn't respond to initialize:
    const hangTransport = new SlowLSPTransport(false);
    const hangClient = new LSPClient(
      { name: 'hang-lsp', language: 'typescript', command: 'test' },
      { transport: hangTransport, requestTimeout: 50 }
    );

    // initialize will time out since transport doesn't respond
    await expect(hangClient.start()).rejects.toThrow();
  });

  test('uses configured timeout value', async () => {
    const hangTransport = new SlowLSPTransport(false);
    const client = new LSPClient(
      { name: 'hang-lsp', language: 'typescript', command: 'test' },
      { transport: hangTransport, requestTimeout: 30 }
    );

    const start = Date.now();
    await expect(client.start()).rejects.toThrow();
    const elapsed = Date.now() - start;
    // Should timeout around 30ms
    expect(elapsed).toBeLessThan(200);
    expect(elapsed).toBeGreaterThanOrEqual(25);
  });

  test('stop rejects pending requests on disconnect', async () => {
    // Create a transport that responds to init but not shutdown
    const partialTransport: LSPTransportInterface = {
      async start() {},
      async send(message: LSPMessage) {
        if (message.id !== undefined && message.method === 'initialize') {
          setTimeout(() => handler?.({
            jsonrpc: '2.0',
            id: message.id,
            result: { capabilities: {}, serverInfo: { name: 'test' } },
          }), 0);
        }
        // shutdown request will hang
      },
      onMessage(cb) { handler = cb; },
      async close() {},
    };
    let handler: ((msg: LSPMessage) => void) | null = null;

    const client = new LSPClient(
      { name: 'partial-lsp', language: 'typescript', command: 'test' },
      { transport: partialTransport, requestTimeout: 50 }
    );
    await client.start();

    // stop() will try shutdown which will timeout, then disconnect
    await client.stop();
    expect(client.getState()).toBe('disconnected');
  });

  test('successful response within timeout resolves normally', async () => {
    const fastTransport: LSPTransportInterface = {
      async start() {},
      async send(message: LSPMessage) {
        if (message.id !== undefined) {
          if (message.method === 'initialize') {
            setTimeout(() => handler?.({
              jsonrpc: '2.0',
              id: message.id,
              result: { capabilities: { textDocumentSync: 1 }, serverInfo: { name: 'fast-lsp' } },
            }), 5);
          } else if (message.method === 'shutdown') {
            setTimeout(() => handler?.({
              jsonrpc: '2.0',
              id: message.id,
              result: null,
            }), 5);
          }
        }
      },
      onMessage(cb) { handler = cb; },
      async close() {},
    };
    let handler: ((msg: LSPMessage) => void) | null = null;

    const client = new LSPClient(
      { name: 'fast-lsp', language: 'typescript', command: 'test' },
      { transport: fastTransport, requestTimeout: 1000 }
    );
    await client.start();
    expect(client.getState()).toBe('ready');

    await client.stop();
    expect(client.getState()).toBe('disconnected');
  });
});
