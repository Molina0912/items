import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { resolveMemory } from '@expo/memory';
import type { MemoryContext } from '@expo/memory';

const TEST_DIR = join(import.meta.dir, '.tmp-memory-resolver');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('resolveMemory', () => {
  test('resolves memory files without conditions', () => {
    writeFileSync(join(TEST_DIR, 'general.md'), 'General rules.');
    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, context);
    expect(result).toBe('General rules.');
  });

  test('filters files by conditions', () => {
    writeFileSync(
      join(TEST_DIR, 'mac.md'),
      `---
conditions:
  - os:mac
---
Mac rules.`
    );
    writeFileSync(
      join(TEST_DIR, 'linux.md'),
      `---
conditions:
  - os:linux
---
Linux rules.`
    );

    const macContext: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, macContext);
    expect(result).toBe('Mac rules.');
    expect(result).not.toContain('Linux');
  });

  test('sorts by priority (higher first)', () => {
    writeFileSync(
      join(TEST_DIR, 'low.md'),
      `---
priority: 1
---
Low priority.`
    );
    writeFileSync(
      join(TEST_DIR, 'high.md'),
      `---
priority: 10
---
High priority.`
    );

    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, context);
    expect(result.indexOf('High priority')).toBeLessThan(result.indexOf('Low priority'));
  });

  test('expands @-includes in resolved files', () => {
    writeFileSync(join(TEST_DIR, 'included.md'), 'Included content');
    writeFileSync(join(TEST_DIR, 'main.md'), 'Main: @included.md');

    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, context);
    expect(result).toContain('Included content');
  });

  test('evaluates conditional blocks within files', () => {
    writeFileSync(
      join(TEST_DIR, 'mixed.md'),
      'Always. <!-- if(os:mac) -->Mac only.<!-- endif --> <!-- if(os:linux) -->Linux only.<!-- endif -->'
    );

    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, context);
    expect(result).toContain('Always.');
    expect(result).toContain('Mac only.');
    expect(result).not.toContain('Linux only.');
  });

  test('returns empty string for empty directory', () => {
    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory(TEST_DIR, context);
    expect(result).toBe('');
  });

  test('returns empty string for non-existent directory', () => {
    const context: MemoryContext = { os: 'mac' };
    const result = resolveMemory('/does/not/exist', context);
    expect(result).toBe('');
  });
});
