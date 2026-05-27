import { describe, test, expect } from 'bun:test';
import { parseCondition, evaluateCondition } from '@expo/core';

describe('Condition Parser', () => {
  test('parses simple predicate', () => {
    const result = parseCondition('os:linux');
    expect(result.ast).toEqual({ type: 'predicate', key: 'os', value: 'linux' });
  });

  test('parses AND condition', () => {
    const result = parseCondition('os:linux AND tool:bash');
    expect(result.ast).toEqual({
      type: 'and',
      left: { type: 'predicate', key: 'os', value: 'linux' },
      right: { type: 'predicate', key: 'tool', value: 'bash' },
    });
  });

  test('parses OR condition', () => {
    const result = parseCondition('os:linux OR os:macos');
    expect(result.ast).toEqual({
      type: 'or',
      left: { type: 'predicate', key: 'os', value: 'linux' },
      right: { type: 'predicate', key: 'os', value: 'macos' },
    });
  });

  test('parses NOT condition', () => {
    const result = parseCondition('NOT os:windows');
    expect(result.ast).toEqual({
      type: 'not',
      operand: { type: 'predicate', key: 'os', value: 'windows' },
    });
  });

  test('parses nested conditions with parentheses', () => {
    const result = parseCondition('(os:linux OR os:macos) AND tool:bash');
    expect(result.ast).toEqual({
      type: 'and',
      left: {
        type: 'or',
        left: { type: 'predicate', key: 'os', value: 'linux' },
        right: { type: 'predicate', key: 'os', value: 'macos' },
      },
      right: { type: 'predicate', key: 'tool', value: 'bash' },
    });
  });

  test('AND has higher precedence than OR', () => {
    const result = parseCondition('os:linux OR os:macos AND tool:bash');
    expect(result.ast).toEqual({
      type: 'or',
      left: { type: 'predicate', key: 'os', value: 'linux' },
      right: {
        type: 'and',
        left: { type: 'predicate', key: 'os', value: 'macos' },
        right: { type: 'predicate', key: 'tool', value: 'bash' },
      },
    });
  });

  test('throws on invalid input', () => {
    expect(() => parseCondition('AND')).toThrow();
  });
});

describe('Condition Evaluator', () => {
  test('evaluates simple predicate - true', () => {
    const { ast } = parseCondition('os:linux');
    expect(evaluateCondition(ast, { os: 'linux' })).toBe(true);
  });

  test('evaluates simple predicate - false', () => {
    const { ast } = parseCondition('os:linux');
    expect(evaluateCondition(ast, { os: 'windows' })).toBe(false);
  });

  test('evaluates AND - both true', () => {
    const { ast } = parseCondition('os:linux AND tool:bash');
    expect(evaluateCondition(ast, { os: 'linux', tool: 'bash' })).toBe(true);
  });

  test('evaluates AND - one false', () => {
    const { ast } = parseCondition('os:linux AND tool:bash');
    expect(evaluateCondition(ast, { os: 'linux', tool: 'fish' })).toBe(false);
  });

  test('evaluates OR - one true', () => {
    const { ast } = parseCondition('os:linux OR os:macos');
    expect(evaluateCondition(ast, { os: 'macos' })).toBe(true);
  });

  test('evaluates NOT', () => {
    const { ast } = parseCondition('NOT os:windows');
    expect(evaluateCondition(ast, { os: 'linux' })).toBe(true);
    expect(evaluateCondition(ast, { os: 'windows' })).toBe(false);
  });

  test('evaluates complex nested condition', () => {
    const { ast } = parseCondition('(os:linux OR os:macos) AND NOT tool:rm');
    expect(evaluateCondition(ast, { os: 'linux', tool: 'bash' })).toBe(true);
    expect(evaluateCondition(ast, { os: 'linux', tool: 'rm' })).toBe(false);
    expect(evaluateCondition(ast, { os: 'windows', tool: 'bash' })).toBe(false);
  });
});
