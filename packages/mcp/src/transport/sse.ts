import type { MCPMessage, MCPTransportInterface } from '../types.js';

export interface SSETransportOptions {
  url: string;
  headers?: Record<string, string>;
  createEventSource?: (url: string, options: { headers: Record<string, string> }) => EventSourceLike;
  fetchFn?: typeof fetch;
}

export interface EventSourceLike {
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((error: unknown) => void) | null;
  close(): void;
}

export class SSETransport implements MCPTransportInterface {
  private eventSource: EventSourceLike | null = null;
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly createEventSourceFn?: SSETransportOptions['createEventSource'];
  private readonly fetchFn: typeof fetch;
  private postEndpoint: string;

  constructor(options: SSETransportOptions) {
    this.url = options.url;
    this.headers = options.headers ?? {};
    this.createEventSourceFn = options.createEventSource;
    this.fetchFn = options.fetchFn ?? fetch;
    // Default POST endpoint is the same URL base with /message suffix
    const urlObj = new URL(options.url);
    urlObj.pathname = urlObj.pathname.replace(/\/sse\/?$/, '/message');
    this.postEndpoint = urlObj.toString();
  }

  async start(): Promise<void> {
    if (this.createEventSourceFn) {
      this.eventSource = this.createEventSourceFn(this.url, { headers: this.headers });
    } else {
      throw new Error('SSE transport requires createEventSource function (EventSource not available in all runtimes)');
    }

    this.eventSource.onmessage = (event: { data: string }) => {
      try {
        const message = JSON.parse(event.data) as MCPMessage;
        this.messageHandler?.(message);
      } catch {
        // Ignore non-JSON messages
      }
    };
  }

  async send(message: MCPMessage): Promise<void> {
    const response = await this.fetchFn(this.postEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`SSE transport POST error: ${response.status} ${response.statusText}`);
    }
  }

  onMessage(cb: (message: MCPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
