import { describe, test, expect } from 'bun:test';
import { PermissionEvaluator } from '@expo/permissions';
import type { PermissionRule, PermissionQuery, PermissionContext } from '@expo/permissions';

function makeContext(overrides: Partial<PermissionContext> = {}): PermissionContext {
  return {
    sessionId: 'test-session',
    mode: 'strict',
    ...overrides,
  };
}

function makeQuery(scope: string, resource: string, mode: 'auto' | 'interactive' | 'strict' = 'strict'): PermissionQuery {
  return {
    scope,
    resource,
    context: makeContext({ mode }),
  };
}

describe('PermissionEvaluator', () => {
  test('exact match returns rule action', () => {
    const rules: PermissionRule[] = [
      { pattern: 'bash', action: 'allow', scope: 'tool' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'strict');
    expect(evaluator.evaluate(makeQuery('tool', 'bash'))).toBe('allow');
  });

  test('glob match with * for file paths', () => {
    const rules: PermissionRule[] = [
      { pattern: '/tmp/*', action: 'deny', scope: 'file' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'auto');
    expect(evaluator.evaluate(makeQuery('file', '/tmp/test.txt'))).toBe('deny');
    expect(evaluator.evaluate(makeQuery('file', '/home/user/test.txt'))).toBe('allow');
  });

  test('glob match with ** for recursive paths', () => {
    const rules: PermissionRule[] = [
      { pattern: '/tmp/**', action: 'deny', scope: 'file' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'auto');
    expect(evaluator.evaluate(makeQuery('file', '/tmp/subdir/test.txt'))).toBe('deny');
  });

  test('glob match with * for network patterns', () => {
    const rules: PermissionRule[] = [
      { pattern: '*.example.com', action: 'ask', scope: 'network' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'strict');
    expect(evaluator.evaluate(makeQuery('network', 'api.example.com'))).toBe('ask');
    expect(evaluator.evaluate(makeQuery('network', 'other.org'))).toBe('deny');
  });

  test('no match with auto mode returns allow', () => {
    const rules: PermissionRule[] = [
      { pattern: 'bash', action: 'deny', scope: 'tool' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'auto');
    expect(evaluator.evaluate(makeQuery('tool', 'read_file', 'auto'))).toBe('allow');
  });

  test('no match with interactive mode returns ask', () => {
    const rules: PermissionRule[] = [
      { pattern: 'bash', action: 'deny', scope: 'tool' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'interactive');
    expect(evaluator.evaluate(makeQuery('tool', 'read_file', 'interactive'))).toBe('ask');
  });

  test('no match with strict mode returns deny', () => {
    const rules: PermissionRule[] = [
      { pattern: 'bash', action: 'allow', scope: 'tool' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'strict');
    expect(evaluator.evaluate(makeQuery('tool', 'read_file'))).toBe('deny');
  });

  test('more specific rules override less specific', () => {
    const rules: PermissionRule[] = [
      { pattern: '/tmp/**', action: 'deny', scope: 'file' },
      { pattern: '/tmp/allowed.txt', action: 'allow', scope: 'file' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'strict');
    // The more specific rule (no globs) should win
    expect(evaluator.evaluate(makeQuery('file', '/tmp/allowed.txt'))).toBe('allow');
    expect(evaluator.evaluate(makeQuery('file', '/tmp/other.txt'))).toBe('deny');
  });

  test('rules without scope match any scope', () => {
    const rules: PermissionRule[] = [
      { pattern: '**', action: 'deny' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'auto');
    expect(evaluator.evaluate(makeQuery('tool', 'bash'))).toBe('deny');
    expect(evaluator.evaluate(makeQuery('file', '/tmp/test'))).toBe('deny');
  });

  test('scope filtering works correctly', () => {
    const rules: PermissionRule[] = [
      { pattern: 'bash', action: 'deny', scope: 'tool' },
      { pattern: 'bash', action: 'allow', scope: 'command' },
    ];
    const evaluator = new PermissionEvaluator(rules, 'strict');
    expect(evaluator.evaluate(makeQuery('tool', 'bash'))).toBe('deny');
    expect(evaluator.evaluate(makeQuery('command', 'bash'))).toBe('allow');
  });
});
