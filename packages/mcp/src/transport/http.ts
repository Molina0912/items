import type { MCPMessage, MCPTransportInterface } from '../types.js';

export interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
}

export class HttpTransport implements MCPTransportInterface {
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpTransportOptions) {
    this.url = options.url;
    this.headers = options.headers ?? {};
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async send(message: MCPMessage): Promise<void> {
    const response = await this.fetchFn(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP transport error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as MCPMessage;
    this.messageHandler?.(result);
  }

  onMessage(cb: (message: MCPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    // HTTP is stateless, no cleanup needed
  }
}
