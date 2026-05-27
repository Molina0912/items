import { describe, test, expect } from 'bun:test';
import { deepMerge, mergeConfigs } from '@expo/config';

describe('deepMerge', () => {
  test('merges flat objects', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('merges nested objects recursively', () => {
    const result = deepMerge(
      { model: { provider: 'openai', name: 'gpt-4' } },
      { model: { name: 'gpt-3.5' } }
    );
    expect(result).toEqual({ model: { provider: 'openai', name: 'gpt-3.5' } });
  });

  test('arrays replace instead of concatenating', () => {
    const result = deepMerge(
      { tools: { enabled: ['bash', 'read'] } },
      { tools: { enabled: ['write'] } }
    );
    expect(result).toEqual({ tools: { enabled: ['write'] } });
  });

  test('source values override target for primitives', () => {
    const result = deepMerge(
      { temperature: 0.7 },
      { temperature: 0.5 }
    );
    expect(result).toEqual({ temperature: 0.5 });
  });

  test('handles deeply nested objects', () => {
    const result = deepMerge(
      { a: { b: { c: { d: 1 } } } },
      { a: { b: { c: { e: 2 } } } }
    );
    expect(result).toEqual({ a: { b: { c: { d: 1, e: 2 } } } });
  });

  test('null values in source override target', () => {
    const result = deepMerge(
      { a: 'hello' },
      { a: null }
    );
    expect(result).toEqual({ a: null });
  });
});

describe('mergeConfigs', () => {
  test('merges multiple configs in order', () => {
    const result = mergeConfigs(
      { model: { provider: 'openai' } },
      { model: { name: 'gpt-4' } },
      { model: { temperature: 0.5 } }
    );
    expect(result).toEqual({ model: { provider: 'openai', name: 'gpt-4', temperature: 0.5 } });
  });

  test('later configs take precedence', () => {
    const result = mergeConfigs(
      { model: { name: 'gpt-3.5' } },
      { model: { name: 'gpt-4' } },
      { model: { name: 'claude-3' } }
    );
    expect(result).toEqual({ model: { name: 'claude-3' } });
  });

  test('simulates env > project > global precedence', () => {
    const global = { model: { provider: 'openai', name: 'gpt-3.5', temperature: 0.7 } };
    const project = { model: { name: 'gpt-4' } };
    const env = { model: { temperature: 0.2 } };

    const result = mergeConfigs(global, project, env);
    expect(result).toEqual({ model: { provider: 'openai', name: 'gpt-4', temperature: 0.2 } });
  });
});
