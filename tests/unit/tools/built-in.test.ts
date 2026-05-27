import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bashTool, readFileTool, writeFileTool, editFileTool, globTool, grepTool, listDirTool } from '@expo/tools';
import type { ToolContext } from '@expo/tools';

const testDir = join(tmpdir(), `expo-tools-test-${Date.now()}`);

function makeContext(cwd?: string): ToolContext {
  return {
    workingDir: cwd ?? testDir,
    sessionId: 'test-session',
    permissions: {},
  };
}

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, 'subdir'), { recursive: true });
  writeFileSync(join(testDir, 'hello.txt'), 'Hello World\nLine 2\nLine 3\n');
  writeFileSync(join(testDir, 'data.json'), '{"key": "value"}');
  writeFileSync(join(testDir, 'subdir', 'nested.txt'), 'Nested content');
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('bash tool', () => {
  test('executes echo command', async () => {
    const result = await bashTool.execute({ command: 'echo hello' }, makeContext());
    expect((result as { stdout: string }).stdout.trim()).toBe('hello');
    expect((result as { exitCode: number }).exitCode).toBe(0);
  });

  test('captures stderr', async () => {
    const result = await bashTool.execute({ command: 'echo error >&2' }, makeContext());
    expect((result as { stderr: string }).stderr.trim()).toBe('error');
  });

  test('returns non-zero exit code', async () => {
    const result = await bashTool.execute({ command: 'exit 42' }, makeContext());
    expect((result as { exitCode: number }).exitCode).toBe(42);
  });

  test('respects cwd parameter', async () => {
    const result = await bashTool.execute({ command: 'pwd', cwd: '/tmp' }, makeContext());
    expect((result as { stdout: string }).stdout.trim()).toContain('/tmp');
  });
});

describe('read_file tool', () => {
  test('reads entire file', async () => {
    const result = await readFileTool.execute({ path: 'hello.txt' }, makeContext());
    expect((result as { content: string }).content).toContain('Hello World');
    expect((result as { totalLines: number }).totalLines).toBe(4);
  });

  test('reads line range', async () => {
    const result = await readFileTool.execute(
      { path: 'hello.txt', startLine: 2, endLine: 2 },
      makeContext()
    );
    expect((result as { content: string }).content).toBe('Line 2');
  });

  test('throws for nonexistent file', async () => {
    await expect(
      readFileTool.execute({ path: 'nonexistent.txt' }, makeContext())
    ).rejects.toThrow();
  });
});

describe('write_file tool', () => {
  test('writes a new file', async () => {
    const result = await writeFileTool.execute(
      { path: 'output.txt', content: 'new content' },
      makeContext()
    );
    expect((result as { bytesWritten: number }).bytesWritten).toBe(11);

    const read = await readFileTool.execute({ path: 'output.txt' }, makeContext());
    expect((read as { content: string }).content).toBe('new content');
  });

  test('creates parent directories', async () => {
    const result = await writeFileTool.execute(
      { path: 'deep/nested/file.txt', content: 'deep', createDirs: true },
      makeContext()
    );
    expect((result as { bytesWritten: number }).bytesWritten).toBe(4);
  });
});

describe('edit_file tool', () => {
  test('applies search/replace edit', async () => {
    writeFileSync(join(testDir, 'editable.txt'), 'foo bar baz');
    const result = await editFileTool.execute(
      { path: 'editable.txt', edits: [{ oldText: 'bar', newText: 'qux' }] },
      makeContext()
    );
    expect((result as { editsApplied: number }).editsApplied).toBe(1);

    const read = await readFileTool.execute({ path: 'editable.txt' }, makeContext());
    expect((read as { content: string }).content).toBe('foo qux baz');
  });

  test('throws when text not found', async () => {
    writeFileSync(join(testDir, 'edit-fail.txt'), 'unchanged');
    await expect(
      editFileTool.execute(
        { path: 'edit-fail.txt', edits: [{ oldText: 'missing', newText: 'new' }] },
        makeContext()
      )
    ).rejects.toThrow('could not find text');
  });
});

describe('glob tool', () => {
  test('finds files matching pattern', async () => {
    const result = await globTool.execute({ pattern: '*.txt' }, makeContext());
    const files = (result as { files: string[] }).files;
    expect(files).toContain('hello.txt');
  });

  test('finds nested files with **', async () => {
    const result = await globTool.execute({ pattern: '**/*.txt' }, makeContext());
    const files = (result as { files: string[] }).files;
    expect(files.some((f: string) => f.includes('nested.txt'))).toBe(true);
  });

  test('respects ignore patterns', async () => {
    const result = await globTool.execute(
      { pattern: '**/*.txt', ignore: ['subdir'] },
      makeContext()
    );
    const files = (result as { files: string[] }).files;
    expect(files.every((f: string) => !f.includes('subdir'))).toBe(true);
  });
});

describe('grep tool', () => {
  test('finds matches in a file', async () => {
    const result = await grepTool.execute(
      { pattern: 'Hello', path: 'hello.txt' },
      makeContext()
    );
    const matches = (result as { matches: Array<{ line: number; content: string }> }).matches;
    expect(matches.length).toBe(1);
    expect(matches[0].line).toBe(1);
    expect(matches[0].content).toContain('Hello');
  });

  test('searches recursively in directory', async () => {
    const result = await grepTool.execute(
      { pattern: 'Nested', path: '.' },
      makeContext()
    );
    const matches = (result as { matches: Array<{ file: string }> }).matches;
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].file).toContain('nested.txt');
  });

  test('returns empty for no matches', async () => {
    const result = await grepTool.execute(
      { pattern: 'ZZZZZ', path: 'hello.txt' },
      makeContext()
    );
    expect((result as { matches: unknown[] }).matches.length).toBe(0);
  });
});

describe('list_dir tool', () => {
  test('lists directory contents', async () => {
    const result = await listDirTool.execute({ path: '.' }, makeContext());
    const entries = (result as { entries: Array<{ name: string; type: string }> }).entries;
    expect(entries.some((e) => e.name === 'hello.txt')).toBe(true);
    expect(entries.some((e) => e.name === 'subdir' && e.type === 'directory')).toBe(true);
  });

  test('lists recursively', async () => {
    const result = await listDirTool.execute(
      { path: '.', recursive: true },
      makeContext()
    );
    const entries = (result as { entries: Array<{ name: string }> }).entries;
    expect(entries.some((e) => e.name.includes('nested.txt'))).toBe(true);
  });

  test('excludes hidden files by default', async () => {
    writeFileSync(join(testDir, '.hidden'), 'secret');
    const result = await listDirTool.execute({ path: '.' }, makeContext());
    const entries = (result as { entries: Array<{ name: string }> }).entries;
    expect(entries.every((e) => !e.name.startsWith('.'))).toBe(true);
  });

  test('includes hidden files when requested', async () => {
    const result = await listDirTool.execute(
      { path: '.', includeHidden: true },
      makeContext()
    );
    const entries = (result as { entries: Array<{ name: string }> }).entries;
    expect(entries.some((e) => e.name.startsWith('.'))).toBe(true);
  });
});
