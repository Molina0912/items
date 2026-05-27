import { describe, test, expect } from 'bun:test';
import { parseRule, parseRules } from '@expo/permissions';

describe('parseRule', () => {
  test('parses tool:name:allow format', () => {
    const rule = parseRule('tool:bash:allow');
    expect(rule).toEqual({ pattern: 'bash', action: 'allow', scope: 'tool' });
  });

  test('parses file:glob:deny format', () => {
    const rule = parseRule('file:/tmp/**:deny');
    expect(rule).toEqual({ pattern: '/tmp/**', action: 'deny', scope: 'file' });
  });

  test('parses network:pattern:ask format', () => {
    const rule = parseRule('network:*.example.com:ask');
    expect(rule).toEqual({ pattern: '*.example.com', action: 'ask', scope: 'network' });
  });

  test('parses command:pattern:deny format', () => {
    const rule = parseRule('command:rm *:deny');
    expect(rule).toEqual({ pattern: 'rm *', action: 'deny', scope: 'command' });
  });

  test('handles patterns with colons (URLs)', () => {
    const rule = parseRule('network:https://api.example.com:allow');
    expect(rule).toEqual({ pattern: 'https://api.example.com', action: 'allow', scope: 'network' });
  });

  test('throws for invalid format (too few parts)', () => {
    expect(() => parseRule('tool:bash')).toThrow('Invalid permission rule format');
  });

  test('throws for empty pattern', () => {
    expect(() => parseRule('tool::allow')).toThrow('Pattern cannot be empty');
  });

  test('throws for invalid scope', () => {
    expect(() => parseRule('invalid:bash:allow')).toThrow('Invalid permission scope');
  });

  test('throws for invalid action', () => {
    expect(() => parseRule('tool:bash:invalid')).toThrow('Invalid permission action');
  });
});

describe('parseRules', () => {
  test('parses an array of rule strings', () => {
    const rules = parseRules([
      'tool:bash:allow',
      'file:/tmp/**:deny',
      'network:*.example.com:ask',
    ]);
    expect(rules).toHaveLength(3);
    expect(rules[0].scope).toBe('tool');
    expect(rules[1].scope).toBe('file');
    expect(rules[2].scope).toBe('network');
  });

  test('returns empty array for empty input', () => {
    const rules = parseRules([]);
    expect(rules).toHaveLength(0);
  });
});
