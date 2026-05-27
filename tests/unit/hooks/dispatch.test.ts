import { describe, test, expect } from 'bun:test';
import { dispatchToHandlers } from '@expo/hooks';
import type { HookHandler, HookContext } from '@expo/hooks';

function makeContext(event: string = 'tool:pre'): HookContext {
  return {
    event: event as HookContext['event'],
    payload: {},
    sessionId: 'test-session',
    timestamp: Date.now(),
  };
}

function makeHandler(name: string, handlerFn?: HookHandler['handler'], overrides: Partial<HookHandler> = {}): HookHandler {
  return {
    name,
    event: 'tool:pre',
    handler: handlerFn ?? (async () => ({ modified: false, data: { name } })),
    ...overrides,
  };
}

describe('dispatchToHandlers', () => {
  test('executes handlers sequentially', async () => {
    const order: string[] = [];
    const handlers = [
      makeHandler('first', async () => {
        order.push('first');
        return { modified: false };
      }),
      makeHandler('second', async () => {
        order.push('second');
        return { modified: false };
      }),
    ];

    await dispatchToHandlers(handlers, makeContext());
    expect(order).toEqual(['first', 'second']);
  });

  test('returns results from all handlers', async () => {
    const handlers = [
      makeHandler('h1', async () => ({ data: 'one' })),
      makeHandler('h2', async () => ({ data: 'two' })),
    ];

    const results = await dispatchToHandlers(handlers, makeContext());
    expect(results).toHaveLength(2);
    expect(results[0].data).toBe('one');
    expect(results[1].data).toBe('two');
  });

  test('error isolation: one handler failure does not stop others', async () => {
    const handlers = [
      makeHandler('failing', async () => {
        throw new Error('handler error');
      }),
      makeHandler('success', async () => ({ data: 'ok' })),
    ];

    const results = await dispatchToHandlers(handlers, makeContext());
    expect(results).toHaveLength(2);
    expect(results[0].error).toBeInstanceOf(Error);
    expect(results[0].error?.message).toBe('handler error');
    expect(results[1].data).toBe('ok');
  });

  test('timeout causes handler to fail', async () => {
    const handlers = [
      makeHandler('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return { data: 'done' };
      }, { timeout: 50 }),
    ];

    const results = await dispatchToHandlers(handlers, makeContext());
    expect(results).toHaveLength(1);
    expect(results[0].error).toBeInstanceOf(Error);
    expect(results[0].error?.message).toContain('timed out');
  });

  test('abort signal stops dispatch', async () => {
    const controller = new AbortController();
    const calls: string[] = [];

    const handlers = [
      makeHandler('h1', async () => {
        calls.push('h1');
        controller.abort();
        return { modified: false };
      }),
      makeHandler('h2', async () => {
        calls.push('h2');
        return { modified: false };
      }),
    ];

    const results = await dispatchToHandlers(handlers, makeContext(), { signal: controller.signal });
    // h1 runs and aborts, h2 should not run because signal is checked before each handler
    expect(calls).toEqual(['h1']);
    expect(results).toHaveLength(1);
  });
});
