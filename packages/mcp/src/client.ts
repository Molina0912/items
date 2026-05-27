import { MCPError, ErrorCode } from '@expo/core';
import type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPClientState,
  MCPMessage,
  MCPTransportInterface,
} from './types.js';
import { StdioTransport } from './transport/stdio.js';
import { HttpTransport } from './transport/http.js';
import { SSETransport } from './transport/sse.js';

export interface MCPClientOptions {
  transport?: MCPTransportInterface;
  requestTimeout?: number;
}

export class MCPClient {
  private config: MCPServerConfig;
  private transport: MCPTransportInterface | null = null;
  private state: MCPClientState = 'disconnected';
  private stateListeners: Array<(state: MCPClientState) => void> = [];
  private requestId = 0;
  private pendingRequests: Map<number | string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private customTransport?: MCPTransportInterface;
  private requestTimeout: number;

  constructor(config: MCPServerConfig, options?: MCPClientOptions) {
    this.config = config;
    this.customTransport = options?.transport;
    this.requestTimeout = options?.requestTimeout ?? 30000;
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    try {
      this.transport = this.customTransport ?? this.createTransport();
      this.transport.onMessage((message) => this.handleMessage(message));
      if (this.transport.start) {
        await this.transport.start();
      }
      await this.initialize();
      this.setState('ready');
    } catch (error) {
      this.setState('error');
      throw new MCPError(
        `Failed to connect to MCP server "${this.config.name}": ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.MCP_CONNECTION_FAILED,
        { serverName: this.config.name }
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new MCPError('Client disconnected', ErrorCode.MCP_CONNECTION_FAILED));
    }
    this.pendingRequests.clear();
    this.setState('disconnected');
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'expo-cli', version: '0.1.0' },
    });
    await this.sendNotification('notifications/initialized', {});
  }

  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest('tools/list', {});
    const response = result as { tools?: MCPTool[] };
    return response.tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const result = await this.sendRequest('tools/call', { name, arguments: args });
    return result;
  }

  async listResources(): Promise<MCPResource[]> {
    const result = await this.sendRequest('resources/list', {});
    const response = result as { resources?: MCPResource[] };
    return response.resources ?? [];
  }

  async readResource(uri: string): Promise<{ content: string; mimeType?: string }> {
    const result = await this.sendRequest('resources/read', { uri });
    const response = result as { contents?: Array<{ text?: string; mimeType?: string }> };
    const first = response.contents?.[0];
    return { content: first?.text ?? '', mimeType: first?.mimeType };
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    const result = await this.sendRequest('prompts/list', {});
    const response = result as { prompts?: MCPPrompt[] };
    return response.prompts ?? [];
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<{ messages: unknown[] }> {
    const result = await this.sendRequest('prompts/get', { name, arguments: args });
    const response = result as { messages?: unknown[] };
    return { messages: response.messages ?? [] };
  }

  getState(): MCPClientState {
    return this.state;
  }

  onStateChange(cb: (state: MCPClientState) => void): void {
    this.stateListeners.push(cb);
  }

  private setState(state: MCPClientState): void {
    this.state = state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private createTransport(): MCPTransportInterface {
    switch (this.config.transport) {
      case 'stdio':
        return new StdioTransport({
          command: this.config.command ?? '',
          args: this.config.args ?? [],
          env: this.config.env,
        });
      case 'http':
        return new HttpTransport({
          url: this.config.url ?? '',
          headers: this.config.headers,
        });
      case 'sse':
        return new SSETransport({
          url: this.config.url ?? '',
          headers: this.config.headers,
        });
      default:
        throw new MCPError(
          `Unsupported transport: ${this.config.transport}`,
          ErrorCode.MCP_PROTOCOL_ERROR
        );
    }
  }

  private async sendRequest(method: string, params: unknown): Promise<unknown> {
    if (!this.transport) {
      throw new MCPError(
        'Not connected to MCP server',
        ErrorCode.MCP_CONNECTION_FAILED
      );
    }

    const id = ++this.requestId;
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new MCPError(
          `Request "${method}" timed out after ${this.requestTimeout}ms`,
          ErrorCode.MCP_CONNECTION_FAILED,
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
      throw new MCPError(
        'Not connected to MCP server',
        ErrorCode.MCP_CONNECTION_FAILED
      );
    }

    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };

    await this.transport.send(message);
  }

  private handleMessage(message: MCPMessage): void {
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(
            new MCPError(
              message.error.message,
              ErrorCode.MCP_PROTOCOL_ERROR,
              { code: message.error.code, data: message.error.data }
            )
          );
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }
}
