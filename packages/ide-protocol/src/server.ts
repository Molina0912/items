import type { JsonRpcMessage, IDEMethod, IDEResponse, IDENotification } from './types.js';
import { JsonRpcMessageSchema } from './types.js';

export type MethodHandler = (params: unknown) => Promise<unknown>;

export class IDEServer {
  private handlers: Map<string, MethodHandler> = new Map();
  private running = false;

  constructor(_options?: { port?: number }) {
    // Options reserved for future transport configuration
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  onRequest(method: IDEMethod | string, handler: MethodHandler): void {
    this.handlers.set(method, handler);
  }

  sendNotification(method: string, params?: unknown): IDENotification {
    return {
      jsonrpc: '2.0',
      method,
      params,
    };
  }

  async handleMessage(raw: string): Promise<IDEResponse | null> {
    let message: JsonRpcMessage;
    try {
      const parsed = JSON.parse(raw);
      message = JsonRpcMessageSchema.parse(parsed);
    } catch {
      return {
        jsonrpc: '2.0',
        id: 0,
        error: { code: -32700, message: 'Parse error' },
      };
    }

    if (!message.method) {
      return null;
    }

    if (!message.id) {
      // Notification - no response needed
      return null;
    }

    const handler = this.handlers.get(message.method);
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32601, message: `Method not found: ${message.method}` },
      };
    }

    try {
      const result = await handler(message.params);
      return {
        jsonrpc: '2.0',
        id: message.id,
        result,
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : 'Internal error',
        },
      };
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getRegisteredMethods(): string[] {
    return Array.from(this.handlers.keys());
  }
}
