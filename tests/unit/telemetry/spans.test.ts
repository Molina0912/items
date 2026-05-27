import { describe, test, expect } from 'bun:test';
import { Tracer, generateTraceId, generateSpanId } from '@expo/telemetry';

describe('Tracer', () => {
  test('creates a span with name and attributes', () => {
    const tracer = new Tracer('test-tracer');
    const span = tracer.startSpan('test-operation', { key: 'value' });
    expect(span.name).toBe('test-operation');
    expect(span.attributes).toEqual({ key: 'value' });
    expect(span.traceId).toBeDefined();
    expect(span.spanId).toBeDefined();
    expect(span.startTime).toBeGreaterThan(0);
    expect(span.endTime).toBeUndefined();
    expect(span.status).toBe('unset');
  });

  test('ends a span with timestamp and ok status', () => {
    const tracer = new Tracer('test-tracer');
    const span = tracer.startSpan('test-operation');
    const ended = tracer.endSpan(span);
    expect(ended.endTime).toBeGreaterThan(0);
    expect(ended.status).toBe('ok');
  });

  test('withSpan wraps async work', async () => {
    const tracer = new Tracer('test-tracer');
    const result = await tracer.withSpan('async-op', async () => {
      return 42;
    });
    expect(result).toBe(42);
  });

  test('withSpan sets error status on failure', async () => {
    const tracer = new Tracer('test-tracer');
    await expect(
      tracer.withSpan('failing-op', async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });

  test('addEvent adds event to span', () => {
    const tracer = new Tracer('test-tracer');
    const span = tracer.startSpan('test-operation');
    tracer.addEvent(span, 'checkpoint', { step: 1 });
    expect(span.events).toHaveLength(1);
    expect(span.events[0].name).toBe('checkpoint');
    expect(span.events[0].attributes).toEqual({ step: 1 });
    expect(span.events[0].timestamp).toBeGreaterThan(0);
  });

  test('setAttribute sets attribute on span', () => {
    const tracer = new Tracer('test-tracer');
    const span = tracer.startSpan('test-operation');
    tracer.setAttribute(span, 'http.method', 'GET');
    expect(span.attributes['http.method']).toBe('GET');
  });
});

describe('ID generation', () => {
  test('generateTraceId produces 32 hex chars', () => {
    const id = generateTraceId();
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  test('generateSpanId produces 16 hex chars', () => {
    const id = generateSpanId();
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
    expect(ids.size).toBe(100);
  });
});
