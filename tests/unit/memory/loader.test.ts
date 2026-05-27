import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadMemoryFiles, parseMemoryFile, parseFrontmatter } from '@expo/memory';

const TEST_DIR = join(import.meta.dir, '.tmp-memory-loader');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('parseFrontmatter', () => {
  test('parses conditions from YAML frontmatter', () => {
    const content = `---
conditions:
  - os:mac
  - tool:vscode
priority: 10
---
Some content here.`;
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.conditions).toEqual(['os:mac', 'tool:vscode']);
    expect(frontmatter.priority).toBe(10);
    expect(body).toBe('Some content here.');
  });

  test('returns empty frontmatter when no markers', () => {
    const content = 'Just plain content.';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter).toEqual({});
    expect(body).toBe(content);
  });

  test('parses inline array conditions', () => {
    const content = `---
conditions: [os:linux, tool:neovim]
---
Body text.`;
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.conditions).toEqual(['os:linux', 'tool:neovim']);
    expect(body).toBe('Body text.');
  });
});

describe('parseMemoryFile', () => {
  test('parses a memory file with frontmatter', () => {
    const content = `---
conditions:
  - os:mac
priority: 5
---
Memory content.`;
    const file = parseMemoryFile('/test/file.md', content);
    expect(file.path).toBe('/test/file.md');
    expect(file.content).toBe('Memory content.');
    expect(file.conditions).toEqual(['os:mac']);
    expect(file.priority).toBe(5);
  });

  test('parses a memory file without frontmatter', () => {
    const file = parseMemoryFile('/test/plain.md', 'Plain content.');
    expect(file.content).toBe('Plain content.');
    expect(file.conditions).toBeUndefined();
    expect(file.priority).toBeUndefined();
  });
});

describe('loadMemoryFiles', () => {
  test('loads .md files from a directory', () => {
    writeFileSync(join(TEST_DIR, 'a.md'), 'File A');
    writeFileSync(join(TEST_DIR, 'b.md'), 'File B');
    writeFileSync(join(TEST_DIR, 'c.txt'), 'Ignored');

    const files = loadMemoryFiles(TEST_DIR);
    expect(files).toHaveLength(2);
    expect(files.map(f => f.content).sort()).toEqual(['File A', 'File B']);
  });

  test('returns empty array for non-existent directory', () => {
    const files = loadMemoryFiles('/does/not/exist');
    expect(files).toEqual([]);
  });

  test('loads files with frontmatter conditions', () => {
    writeFileSync(
      join(TEST_DIR, 'conditioned.md'),
      `---
conditions:
  - os:mac
---
Mac-specific content.`
    );

    const files = loadMemoryFiles(TEST_DIR);
    expect(files).toHaveLength(1);
    expect(files[0].conditions).toEqual(['os:mac']);
    expect(files[0].content).toBe('Mac-specific content.');
  });
});
