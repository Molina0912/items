import { describe, test, expect, beforeEach } from 'bun:test';
import { LSPClient } from '@expo/lsp';
import type { LSPMessage, LSPTransportInterface, Diagnostic } from '@expo/lsp';
import { DiagnosticSeverity } from '@expo/lsp';

class MockLSPTransport implements LSPTransportInterface {
  public sentMessages: LSPMessage[] = [];
  private messageHandler: ((message: LSPMessage) => void) | null = null;
  public started = false;
  public closed = false;

  async start(): Promise<void> {
    this.started = true;
  }

  async send(message: LSPMessage): Promise<void> {
    this.sentMessages.push(message);
    // Auto-respond to requests
    if (message.id !== undefined) {
      const response = this.createResponse(message);
      if (response) {
        setTimeout(() => this.messageHandler?.(response), 0);
      }
    }
  }

  onMessage(cb: (message: LSPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  simulateMessage(message: LSPMessage): void {
    this.messageHandler?.(message);
  }

  private createResponse(request: LSPMessage): LSPMessage | null {
    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            capabilities: {
              textDocumentSync: 1,
              diagnosticProvider: {},
            },
            serverInfo: { name: 'test-lsp', version: '1.0.0' },
          },
        };
      case 'shutdown':
        return { jsonrpc: '2.0', id: request.id, result: null };
      default:
        return null;
    }
  }
}

describe('LSPClient', () => {
  let transport: MockLSPTransport;
  let client: LSPClient;

  beforeEach(() => {
    transport = new MockLSPTransport();
    client = new LSPClient(
      { name: 'test-lsp', language: 'typescript', command: 'test' },
      { transport }
    );
  });

  test('starts in disconnected state', () => {
    expect(client.getState()).toBe('disconnected');
  });

  test('start transitions to ready state', async () => {
    const states: string[] = [];
    client.onStateChange((state) => states.push(state));
    await client.start();
    expect(client.getState()).toBe('ready');
    expect(states).toContain('starting');
    expect(states).toContain('ready');
  });

  test('sends initialize request on start', async () => {
    await client.start();
    const initMsg = transport.sentMessages.find((m) => m.method === 'initialize');
    expect(initMsg).toBeDefined();
    expect((initMsg!.params as Record<string, unknown>).processId).toBeNull();
    expect((initMsg!.params as Record<string, unknown>).capabilities).toBeDefined();
  });

  test('sends initialized notification after initialize', async () => {
    await client.start();
    const initedMsg = transport.sentMessages.find((m) => m.method === 'initialized');
    expect(initedMsg).toBeDefined();
    expect(initedMsg!.id).toBeUndefined();
  });

  test('textDocumentDidOpen sends notification', async () => {
    await client.start();
    await client.textDocumentDidOpen('file:///test.ts', 'typescript', 1, 'const x = 1;');
    const msg = transport.sentMessages.find((m) => m.method === 'textDocument/didOpen');
    expect(msg).toBeDefined();
    const params = msg!.params as { textDocument: { uri: string; languageId: string; version: number; text: string } };
    expect(params.textDocument.uri).toBe('file:///test.ts');
    expect(params.textDocument.languageId).toBe('typescript');
    expect(params.textDocument.version).toBe(1);
    expect(params.textDocument.text).toBe('const x = 1;');
  });

  test('textDocumentDidChange sends notification', async () => {
    await client.start();
    await client.textDocumentDidChange('file:///test.ts', 2, [{ text: 'const x = 2;' }]);
    const msg = transport.sentMessages.find((m) => m.method === 'textDocument/didChange');
    expect(msg).toBeDefined();
    const params = msg!.params as { textDocument: { uri: string; version: number }; contentChanges: Array<{ text: string }> };
    expect(params.textDocument.uri).toBe('file:///test.ts');
    expect(params.textDocument.version).toBe(2);
    expect(params.contentChanges[0].text).toBe('const x = 2;');
  });

  test('textDocumentDidClose sends notification', async () => {
    await client.start();
    await client.textDocumentDidClose('file:///test.ts');
    const msg = transport.sentMessages.find((m) => m.method === 'textDocument/didClose');
    expect(msg).toBeDefined();
  });

  test('getDiagnostics returns empty array for unknown uri', () => {
    expect(client.getDiagnostics('file:///unknown.ts')).toEqual([]);
  });

  test('receives and stores diagnostics from server', async () => {
    await client.start();
    const diagnostics: Diagnostic[] = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        severity: DiagnosticSeverity.Error,
        message: 'Unexpected token',
        source: 'typescript',
      },
    ];

    transport.simulateMessage({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri: 'file:///test.ts', diagnostics },
    });

    const result = client.getDiagnostics('file:///test.ts');
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Unexpected token');
    expect(result[0].severity).toBe(DiagnosticSeverity.Error);
  });

  test('stop sends shutdown and exit', async () => {
    await client.start();
    await client.stop();
    expect(client.getState()).toBe('disconnected');
    const shutdownMsg = transport.sentMessages.find((m) => m.method === 'shutdown');
    expect(shutdownMsg).toBeDefined();
    const exitMsg = transport.sentMessages.find((m) => m.method === 'exit');
    expect(exitMsg).toBeDefined();
    expect(transport.closed).toBe(true);
  });

  test('getLanguage returns configured language', () => {
    expect(client.getLanguage()).toBe('typescript');
  });

  test('getName returns configured name', () => {
    expect(client.getName()).toBe('test-lsp');
  });
});
