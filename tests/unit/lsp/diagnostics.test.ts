import { describe, test, expect, beforeEach } from 'bun:test';
import { DiagnosticCollector, DiagnosticSeverity, LSPClientPool } from '@expo/lsp';
import type { Diagnostic, LSPMessage, LSPTransportInterface, LSPServerConfig } from '@expo/lsp';

function createMockLSPTransport(): { transport: LSPTransportInterface; simulateMessage: (msg: LSPMessage) => void } {
  let messageHandler: ((message: LSPMessage) => void) | null = null;

  const transport: LSPTransportInterface = {
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

  return {
    transport,
    simulateMessage: (msg) => messageHandler?.(msg),
  };
}

describe('DiagnosticCollector', () => {
  let collector: DiagnosticCollector;

  beforeEach(() => {
    collector = new DiagnosticCollector();
  });

  test('formatForAgent returns "No diagnostics found." for empty array', () => {
    const result = collector.formatForAgent([]);
    expect(result).toBe('No diagnostics found.');
  });

  test('formatForAgent formats diagnostics as human-readable text', () => {
    const diagnostics: Diagnostic[] = [
      {
        range: { start: { line: 4, character: 10 }, end: { line: 4, character: 15 } },
        severity: DiagnosticSeverity.Error,
        message: 'Cannot find name "foo"',
        source: 'typescript',
        code: 2304,
      },
      {
        range: { start: { line: 10, character: 0 }, end: { line: 10, character: 20 } },
        severity: DiagnosticSeverity.Warning,
        message: 'Unused variable',
        source: 'eslint',
      },
    ];

    const result = collector.formatForAgent(diagnostics);
    expect(result).toContain('ERROR at 5:11 [typescript] (2304): Cannot find name "foo"');
    expect(result).toContain('WARNING at 11:1 [eslint]: Unused variable');
  });

  test('filterBySeverity filters by minimum severity level', () => {
    const diagnostics: Diagnostic[] = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        severity: DiagnosticSeverity.Error,
        message: 'Error',
      },
      {
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
        severity: DiagnosticSeverity.Warning,
        message: 'Warning',
      },
      {
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } },
        severity: DiagnosticSeverity.Information,
        message: 'Info',
      },
      {
        range: { start: { line: 3, character: 0 }, end: { line: 3, character: 5 } },
        severity: DiagnosticSeverity.Hint,
        message: 'Hint',
      },
    ];

    const errorsOnly = collector.filterBySeverity(diagnostics, DiagnosticSeverity.Error);
    expect(errorsOnly).toHaveLength(1);
    expect(errorsOnly[0].message).toBe('Error');

    const warningsAndAbove = collector.filterBySeverity(diagnostics, DiagnosticSeverity.Warning);
    expect(warningsAndAbove).toHaveLength(2);

    const all = collector.filterBySeverity(diagnostics, DiagnosticSeverity.Hint);
    expect(all).toHaveLength(4);
  });

  test('collectForFile collects diagnostics from pool clients', async () => {
    const pool = new LSPClientPool();
    const { transport, simulateMessage } = createMockLSPTransport();

    await pool.addServer(
      { name: 'ts-lsp', language: 'typescript', command: 'tsc' },
      { transport }
    );

    // Simulate diagnostics arriving
    simulateMessage({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: {
        uri: 'file:///test.ts',
        diagnostics: [
          {
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            severity: DiagnosticSeverity.Error,
            message: 'Test error',
          },
        ],
      },
    });

    const diagnostics = await collector.collectForFile('file:///test.ts', pool);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toBe('Test error');
  });

  test('collectAll returns all diagnostics from pool', async () => {
    const pool = new LSPClientPool();
    const { transport, simulateMessage } = createMockLSPTransport();

    await pool.addServer(
      { name: 'ts-lsp', language: 'typescript', command: 'tsc' },
      { transport }
    );

    simulateMessage({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: {
        uri: 'file:///a.ts',
        diagnostics: [
          {
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
            severity: DiagnosticSeverity.Warning,
            message: 'Warning A',
          },
        ],
      },
    });

    simulateMessage({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: {
        uri: 'file:///b.ts',
        diagnostics: [
          {
            range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
            severity: DiagnosticSeverity.Error,
            message: 'Error B',
          },
        ],
      },
    });

    const all = await collector.collectAll(pool);
    expect(all.size).toBe(2);
    expect(all.get('file:///a.ts')).toHaveLength(1);
    expect(all.get('file:///b.ts')).toHaveLength(1);
  });
});
