import type { SpanData, SpanEvent, SpanStatus, SpanAttributeValue } from './types.js';
import { randomBytes } from 'node:crypto';

export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

export class Tracer {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  startSpan(name: string, attributes?: Record<string, SpanAttributeValue>): SpanData {
    return {
      name,
      traceId: generateTraceId(),
      spanId: generateSpanId(),
      startTime: Date.now(),
      attributes: attributes ?? {},
      events: [],
      status: 'unset',
    };
  }

  endSpan(span: SpanData): SpanData {
    return {
      ...span,
      endTime: Date.now(),
      status: span.status === 'unset' ? 'ok' : span.status,
    };
  }

  async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      const result = await fn();
      this.endSpan(span);
      return result;
    } catch (error) {
      span.status = 'error';
      this.addEvent(span, 'exception', {
        message: error instanceof Error ? error.message : String(error),
      });
      this.endSpan(span);
      throw error;
    }
  }

  addEvent(span: SpanData, name: string, attributes?: Record<string, SpanAttributeValue>): void {
    const event: SpanEvent = {
      name,
      timestamp: Date.now(),
      attributes,
    };
    span.events.push(event);
  }

  setAttribute(span: SpanData, key: string, value: SpanAttributeValue): void {
    span.attributes[key] = value;
  }

  getName(): string {
    return this.name;
  }
}
