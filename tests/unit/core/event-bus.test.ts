import { describe, test, expect } from 'bun:test';
import { EventBus } from '@expo/core';

interface TestEvents {
  message: { text: string };
  count: number;
  empty: undefined;
}

describe('EventBus', () => {
  test('emit triggers registered handler', () => {
    const bus = new EventBus<TestEvents>();
    const received: string[] = [];

    bus.on('message', (event) => {
      received.push(event.text);
    });

    bus.emit('message', { text: 'hello' });

    expect(received).toEqual(['hello']);
  });

  test('on registers multiple handlers', () => {
    const bus = new EventBus<TestEvents>();
    const results: number[] = [];

    bus.on('count', (n) => results.push(n * 2));
    bus.on('count', (n) => results.push(n * 3));

    bus.emit('count', 5);

    expect(results).toEqual([10, 15]);
  });

  test('off removes a handler', () => {
    const bus = new EventBus<TestEvents>();
    const results: number[] = [];

    const handler = (n: number) => results.push(n);
    bus.on('count', handler);
    bus.emit('count', 1);
    bus.off('count', handler);
    bus.emit('count', 2);

    expect(results).toEqual([1]);
  });

  test('once fires handler only once', () => {
    const bus = new EventBus<TestEvents>();
    const results: number[] = [];

    bus.once('count', (n) => results.push(n));
    bus.emit('count', 1);
    bus.emit('count', 2);
    bus.emit('count', 3);

    expect(results).toEqual([1]);
  });

  test('emit with no handlers does not throw', () => {
    const bus = new EventBus<TestEvents>();
    expect(() => bus.emit('count', 42)).not.toThrow();
  });

  test('typed events preserve type safety', () => {
    const bus = new EventBus<TestEvents>();
    let received: { text: string } | null = null;

    bus.on('message', (event) => {
      received = event;
    });

    bus.emit('message', { text: 'typed' });

    expect(received).toEqual({ text: 'typed' });
  });
});
