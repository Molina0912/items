import { describe, test, expect } from 'bun:test';
import { matchHandlers } from '@expo/hooks';
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
    handler: async () => ({ modified: false }),
    ...overrides,
  };
}

describe('matchHandlers', () => {
  test('matches exact event', () => {
    const handlers = [
      makeHandler('h1', 'session:start'),
      makeHandler('h2', 'session:end'),
    ];
    const matched = matchHandlers(handlers, 'session:start', makeContext('session:start'));
    expect(matched).toHaveLength(1);
    expect(matched[0].name).toBe('h1');
  });

  test('matches event from array', () => {
    const handlers = [
      makeHandler('h1', ['session:start', 'session:end']),
    ];
    const matched = matchHandlers(handlers, 'session:end', makeContext('session:end'));
    expect(matched).toHaveLength(1);
    expect(matched[0].name).toBe('h1');
  });

  test('does not match different event', () => {
    const handlers = [
      makeHandler('h1', 'session:start'),
    ];
    const matched = matchHandlers(handlers, 'session:end', makeContext('session:end'));
    expect(matched).toHaveLength(0);
  });

  test('sorts by priority (higher first)', () => {
    const handlers = [
      makeHandler('low', 'tool:pre', { priority: 1 }),
      makeHandler('high', 'tool:pre', { priority: 10 }),
      makeHandler('medium', 'tool:pre', { priority: 5 }),
    ];
    const matched = matchHandlers(handlers, 'tool:pre', makeContext('tool:pre'));
    expect(matched[0].name).toBe('high');
    expect(matched[1].name).toBe('medium');
    expect(matched[2].name).toBe('low');
  });

  test('default priority is 0', () => {
    const handlers = [
      makeHandler('default', 'tool:pre'),
      makeHandler('explicit', 'tool:pre', { priority: 1 }),
    ];
    const matched = matchHandlers(handlers, 'tool:pre', makeContext('tool:pre'));
    expect(matched[0].name).toBe('explicit');
    expect(matched[1].name).toBe('default');
  });

  test('condition evaluation filters handlers', () => {
    const handlers = [
      makeHandler('matching', 'tool:pre', { condition: 'tool:bash' }),
      makeHandler('non-matching', 'tool:pre', { condition: 'tool:other' }),
    ];
    const context = makeContext('tool:pre', { tool: 'bash' });
    const matched = matchHandlers(handlers, 'tool:pre', context);
    expect(matched).toHaveLength(1);
    expect(matched[0].name).toBe('matching');
  });

  test('handler with invalid condition is excluded', () => {
    const handlers = [
      makeHandler('bad-condition', 'tool:pre', { condition: '(((' }),
    ];
    const matched = matchHandlers(handlers, 'tool:pre', makeContext('tool:pre'));
    expect(matched).toHaveLength(0);
  });

  test('handler without condition always matches event', () => {
    const handlers = [
      makeHandler('no-condition', 'tool:pre'),
    ];
    const matched = matchHandlers(handlers, 'tool:pre', makeContext('tool:pre'));
    expect(matched).toHaveLength(1);
  });
});
