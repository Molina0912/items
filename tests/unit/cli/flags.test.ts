import { describe, test, expect } from 'bun:test';
import { parseFlags } from '@expo/cli';

describe('parseFlags', () => {
  test('returns defaults when no flags provided', () => {
    const flags = parseFlags([]);
    expect(flags.print).toBe(false);
    expect(flags.model).toBeNull();
    expect(flags.verbose).toBe(false);
    expect(flags.config).toBeNull();
    expect(flags.headless).toBe(false);
    expect(flags.session).toBeNull();
    expect(flags.continue).toBe(false);
    expect(flags.args).toEqual([]);
  });

  test('parses --print flag', () => {
    const flags = parseFlags(['--print']);
    expect(flags.print).toBe(true);
  });

  test('parses -p alias for --print', () => {
    const flags = parseFlags(['-p']);
    expect(flags.print).toBe(true);
  });

  test('parses --model with value', () => {
    const flags = parseFlags(['--model', 'claude-3']);
    expect(flags.model).toBe('claude-3');
  });

  test('parses --model=value form', () => {
    const flags = parseFlags(['--model=gpt-4']);
    expect(flags.model).toBe('gpt-4');
  });

  test('parses --verbose flag', () => {
    const flags = parseFlags(['--verbose']);
    expect(flags.verbose).toBe(true);
  });

  test('parses --config with path', () => {
    const flags = parseFlags(['--config', '/path/to/config.json']);
    expect(flags.config).toBe('/path/to/config.json');
  });

  test('parses --config=path form', () => {
    const flags = parseFlags(['--config=/path/to/config.json']);
    expect(flags.config).toBe('/path/to/config.json');
  });

  test('parses --headless flag', () => {
    const flags = parseFlags(['--headless']);
    expect(flags.headless).toBe(true);
  });

  test('parses --session with ID', () => {
    const flags = parseFlags(['--session', 'sess-123']);
    expect(flags.session).toBe('sess-123');
  });

  test('parses --session=value form', () => {
    const flags = parseFlags(['--session=sess-456']);
    expect(flags.session).toBe('sess-456');
  });

  test('parses --continue flag', () => {
    const flags = parseFlags(['--continue']);
    expect(flags.continue).toBe(true);
  });

  test('collects non-flag arguments', () => {
    const flags = parseFlags(['hello', 'world']);
    expect(flags.args).toEqual(['hello', 'world']);
  });

  test('parses multiple flags together', () => {
    const flags = parseFlags(['--print', '--verbose', '--model', 'gpt-4', '--headless', 'prompt text']);
    expect(flags.print).toBe(true);
    expect(flags.verbose).toBe(true);
    expect(flags.model).toBe('gpt-4');
    expect(flags.headless).toBe(true);
    expect(flags.args).toEqual(['prompt text']);
  });

  test('handles --model without value', () => {
    const flags = parseFlags(['--model']);
    expect(flags.model).toBeNull();
  });
});
