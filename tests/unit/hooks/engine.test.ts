import { describe, test, expect } from 'bun:test';
import { HookEngine } from '@expo/hooks';
import type { HookHandler, HookContext } from '@expo/hooks';

function makeContext(event: string = 'session:start', payload: Record<string, unknown> = {}): HookContext {
  return {
    event: event as HookContext['event'],
    payload,
    sessionId: 'test-session',
    timestamp: Date.now(),
  };
}

function makeHandler(name: string, event: string | string[], overrides: Partial<HookHandler> = {}): HookHandler {
  return {
    name,
    event: event as HookHandler['event'],
    handler: async () => ({ modified: false, data: { handler: name } }),
    ...overrides,
  };
}

describe('HookEngine', () => {
  test('register adds a handler', () => {
    const engine = new HookEngine();
    engine.register(makeHandler('test', 'session:start'));
    expect(engine.listHandlers()).toHaveLength(1);
  });

  test('unregister removes a handler by name', () => {
    const engine = new HookEngine();
    engine.register(makeHandler('test', 'session:start'));
    engine.unregister('test');
    expect(engine.listHandlers()).toHaveLength(0);
  });

  test('dispatch calls matching handlers', async () => {
    const engine = new HookEngine();
    const calls: string[] = [];

    engine.register({
      name: 'handler1',
      event: 'session:start',
      handler: async () => {
        calls.push('handler1');
        return { modified: false };
      },
    });

    engine.register({
      name: 'handler2',
      event: 'session:end',
      handler: async () => {
        calls.push('handler2');
        return { modified: false };
      },
    });

    await engine.dispatch('session:start', makeContext('session:start'));
    expect(calls).toEqual(['handler1']);
  });

  test('dispatch returns results from all matching handlers', async () => {
    const engine = new HookEngine();
    engine.register(makeHandler('h1', 'turn:start'));
    engine.register(makeHandler('h2', 'turn:start'));

    const results = await engine.dispatch('turn:start', makeContext('turn:start'));
    expect(results).toHaveLength(2);
  });

  test('listHandlers filters by event', () => {
    const engine = new HookEngine();
    engine.register(makeHandler('h1', 'session:start'));
    engine.register(makeHandler('h2', 'session:end'));
    engine.register(makeHandler('h3', ['session:start', 'session:end']));

    expect(engine.listHandlers('session:start')).toHaveLength(2);
    expect(engine.listHandlers('session:end')).toHaveLength(2);
    expect(engine.listHandlers('turn:start')).toHaveLength(0);
  });

  test('clear removes all handlers', () => {
    const engine = new HookEngine();
    engine.register(makeHandler('h1', 'session:start'));
    engine.register(makeHandler('h2', 'session:end'));
    engine.clear();
    expect(engine.listHandlers()).toHaveLength(0);
  });

  test('dispatch removes once handlers after firing', async () => {
    const engine = new HookEngine();
    engine.register(makeHandler('once-handler', 'session:start', { once: true }));

    await engine.dispatch('session:start', makeContext('session:start'));
    expect(engine.listHandlers()).toHaveLength(0);
  });
});
