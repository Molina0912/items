import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { expandIncludes } from '@expo/memory';

const TEST_DIR = join(import.meta.dir, '.tmp-memory-include');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('expandIncludes', () => {
  test('replaces @file references with file content', () => {
    writeFileSync(join(TEST_DIR, 'included.md'), 'Included content');
    const basePath = join(TEST_DIR, 'main.md');
    writeFileSync(basePath, 'Before @included.md after');

    const result = expandIncludes('Before @included.md after', basePath);
    expect(result).toBe('Before Included content after');
  });

  test('handles nested includes', () => {
    writeFileSync(join(TEST_DIR, 'level2.md'), 'Level 2');
    writeFileSync(join(TEST_DIR, 'level1.md'), 'Level 1: @level2.md');
    const basePath = join(TEST_DIR, 'main.md');

    const result = expandIncludes('Start @level1.md end', basePath);
    expect(result).toBe('Start Level 1: Level 2 end');
  });

  test('detects circular references', () => {
    writeFileSync(join(TEST_DIR, 'a.md'), 'A: @b.md');
    writeFileSync(join(TEST_DIR, 'b.md'), 'B: @a.md');
    const basePath = join(TEST_DIR, 'a.md');

    expect(() => {
      expandIncludes('Start @b.md', basePath);
    }).toThrow(/Circular include detected/);
  });

  test('enforces max depth limit', () => {
    // Create a deep chain of includes
    for (let i = 0; i < 12; i++) {
      const next = i + 1;
      writeFileSync(join(TEST_DIR, `file${i}.md`), `Level ${i}: @file${next}.md`);
    }
    writeFileSync(join(TEST_DIR, 'file12.md'), 'End');
    const basePath = join(TEST_DIR, 'file0.md');

    expect(() => {
      expandIncludes('@file1.md', basePath);
    }).toThrow(/Max include depth/);
  });

  test('leaves unresolved references when file not found', () => {
    const basePath = join(TEST_DIR, 'main.md');
    writeFileSync(basePath, 'Before @nonexistent.md after');

    const result = expandIncludes('Before @nonexistent.md after', basePath);
    expect(result).toBe('Before @nonexistent.md after');
  });

  test('handles relative paths with subdirectories', () => {
    mkdirSync(join(TEST_DIR, 'sub'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'sub/nested.md'), 'Nested content');
    const basePath = join(TEST_DIR, 'main.md');

    const result = expandIncludes('Include: @sub/nested.md', basePath);
    expect(result).toBe('Include: Nested content');
  });
});
