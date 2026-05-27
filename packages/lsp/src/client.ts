import { LSPError, ErrorCode } from '@expo/core';
import type {
  LSPServerConfig,
  LSPClientState,
  LSPMessage,
  LSPTransportInterface,
  Diagnostic,
  DiagnosticSeverity,
} from './types.js';

export interface LSPClientOptions {
  transport?: LSPTransportInterface;
  requestTimeout?: number;
}

export class LSPClient {
  private config: LSPServerConfig;
  private transport: LSPTransportInterface | null = null;
  private state: LSPClientState = 'disconnected';
  private stateListeners: Array<(state: LSPClientState) => void> = [];
  private requestId = 0;
  private pendingRequests: Map<number | string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private customTransport?: LSPTransportInterface;
  private requestTimeout: number;

  constructor(config: LSPServerConfig, options?: LSPClientOptions) {
    this.config = config;
    this.customTransport = options?.transport;
    this.requestTimeout = options?.requestTimeout ?? 30000;
  }

  async start(): Promise<void> {
    this.setState('starting');
    try {
      this.transport = this.customTransport ?? this.createTransport();
      this.transport.onMessage((message) => this.handleMessage(message));
      await this.transport.start();
      await this.initialize();
      this.setState('ready');
    } catch (error) {
      this.setState('error');
      throw new LSPError(
        `Failed to start LSP server "${this.config.name}": ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.LSP_CONNECTION_FAILED,
        { serverName: this.config.name }
      );
    }
  }

  async stop(): Promise<void> {
    if (this.transport && this.state === 'ready') {
      try {
        await this.sendRequest('shutdown', null);
        await this.sendNotification('exit', null);
      } catch {
        // Ignore errors during shutdown
      }
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new LSPError('Client disconnected', ErrorCode.LSP_CONNECTION_FAILED));
    }
    this.pendingRequests.clear();
    this.diagnostics.clear();
    this.setState('disconnected');
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      processId: null,
      capabilities: {
        textDocument: {
          synchronization: {
            didOpen: true,
            didChange: true,
            didClose: true,
          },
          publishDiagnostics: {
            relatedInformation: true,
          },
        },
      },
      rootUri: this.config.rootUri ?? null,
      initializationOptions: this.config.initializationOptions ?? {},
    });
    await this.sendNotification('initialized', {});
  }

  async textDocumentDidOpen(uri: string, languageId: string, version: number, text: string): Promise<void> {
    await this.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId, version, text },
    });
  }

  async textDocumentDidChange(uri: string, version: number, changes: Array<{ text: string }>): Promise<void> {
    await this.sendNotification('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: changes,
    });
  }

  async textDocumentDidClose(uri: string): Promise<void> {
    await this.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  getDiagnostics(uri: string): Diagnostic[] {
    return this.diagnostics.get(uri) ?? [];
  }

  getAllDiagnostics(): Map<string, Diagnostic[]> {
    return new Map(this.diagnostics);
  }

  getState(): LSPClientState {
    return this.state;
  }

  getLanguage(): string {
    return this.config.language;
  }

  getName(): string {
    return this.config.name;
  }

  onStateChange(cb: (state: LSPClientState) => void): void {
    this.stateListeners.push(cb);
  }

  private setState(state: LSPClientState): void {
    this.state = state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private createTransport(): LSPTransportInterface {
    // Default LSP transport uses Content-Length framed JSON-RPC over stdin/stdout
    return new LSPStdioTransport(this.config.command, this.config.args ?? []);
  }

  private async sendRequest(method: string, params: unknown): Promise<unknown> {
    if (!this.transport) {
      throw new LSPError(
        'LSP server not started',
        ErrorCode.LSP_CONNECTION_FAILED
      );
    }

    const id = ++this.requestId;
    const message: LSPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new LSPError(
          `Request "${method}" timed out after ${this.requestTimeout}ms`,
          ErrorCode.LSP_CONNECTION_FAILED,
          { method, timeout: this.requestTimeout }
        ));
      }, this.requestTimeout);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.transport!.send(message).catch((err) => {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      });
    });
  }

  private async sendNotification(method: string, params: unknown): Promise<void> {
    if (!this.transport) {
      throw new LSPError(
        'LSP server not started',
        ErrorCode.LSP_CONNECTION_FAILED
      );
    }

    const message: LSPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };

    await this.transport.send(message);
  }

  private handleMessage(message: LSPMessage): void {
    // Handle responses to our requests
    if (message.id !== undefined && !message.method) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(
            new LSPError(
              message.error.message,
              ErrorCode.LSP_PROTOCOL_ERROR,
              { code: message.error.code, data: message.error.data }
            )
          );
        } else {
          pending.resolve(message.result);
        }
      }
    }

    // Handle notifications from the server
    if (message.method === 'textDocument/publishDiagnostics') {
      const params = message.params as { uri: string; diagnostics: Diagnostic[] };
      this.diagnostics.set(params.uri, params.diagnostics);
    }
  }
}

class LSPStdioTransport implements LSPTransportInterface {
  private process: import('./types.js').SpawnedProcess | null = null;
  private messageHandler: ((message: LSPMessage) => void) | null = null;
  private buffer = '';
  private contentLength: number | null = null;
  private readonly command: string;
  private readonly args: string[];

  constructor(command: string, args: string[]) {
    this.command = command;
    this.args = args;
  }

  async start(): Promise<void> {
    const { spawn } = await import('node:child_process');
    this.process = spawn(this.command, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as unknown as import('./types.js').SpawnedProcess;

    this.process.stdout.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });
  }

  async send(message: LSPMessage): Promise<void> {
    if (!this.process) {
      throw new Error('Transport not started');
    }
    const json = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
    this.process.stdin.write(header + json);
  }

  onMessage(cb: (message: LSPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private processBuffer(): void {
    while (true) {
      if (this.contentLength === null) {
        const headerEnd = this.buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) break;

        const header = this.buffer.substring(0, headerEnd);
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (match) {
          this.contentLength = parseInt(match[1], 10);
          this.buffer = this.buffer.substring(headerEnd + 4);
        } else {
          break;
        }
      }

      if (this.contentLength !== null) {
        if (this.buffer.length >= this.contentLength) {
          const content = this.buffer.substring(0, this.contentLength);
          this.buffer = this.buffer.substring(this.contentLength);
          this.contentLength = null;

          try {
            const message = JSON.parse(content) as LSPMessage;
            this.messageHandler?.(message);
          } catch {
            // Ignore parse errors
          }
        } else {
          break;
        }
      }
    }
  }
}
