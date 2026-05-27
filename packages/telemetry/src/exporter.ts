import type { SpanData } from './types.js';

export class OTLPExporter {
  private endpoint: string;
  private headers: Record<string, string>;
  private batch: SpanData[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private active = true;

  constructor(endpoint: string, headers?: Record<string, string>, options?: { batchSize?: number; flushInterval?: number }) {
    this.endpoint = endpoint;
    this.headers = headers ?? {};
    this.batchSize = options?.batchSize ?? 100;
    this.flushInterval = options?.flushInterval ?? 5000;
  }

  export(spans: SpanData[]): void {
    if (!this.active) {
      return;
    }
    this.batch.push(...spans);
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush(): SpanData[] {
    const flushed = [...this.batch];
    this.batch = [];
    return flushed;
  }

  shutdown(): void {
    this.flush();
    this.active = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getBatchSize(): number {
    return this.batch.length;
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}
