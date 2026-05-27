import { describe, test, expect } from 'bun:test';
import { bashTool, readFileTool, writeFileTool, fetchTool, editFileTool, globTool, grepTool, listDirTool } from '@expo/tools';
import type { ToolContext, SandboxGuards } from '@expo/tools';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    workingDir: process.cwd(),
    sessionId: 'test-session',
    permissions: {},
    ...overrides,
  };
}

describe('Built-in tools sandbox guard checks', () => {
  describe('bash tool', () => {
    test('blocks execution when ProcessGuard denies command', async () => {
      const guards: SandboxGuards = {
        process: {
          canExecute: (command: string) => false,
        },
      };

      await expect(
        bashTool.execute({ command: 'echo hello' }, makeContext({ guards }))
      ).rejects.toThrow('Process execution denied');
    });

    test('allows execution when ProcessGuard allows command', async () => {
      const guards: SandboxGuards = {
        process: {
          canExecute: (command: string) => true,
        },
      };

      const result = await bashTool.execute(
        { command: 'echo hello' },
        makeContext({ guards })
      );
      expect((result as { stdout: string }).stdout.trim()).toBe('hello');
    });

    test('executes without guard when none provided', async () => {
      const result = await bashTool.execute(
        { command: 'echo world' },
        makeContext()
      );
      expect((result as { stdout: string }).stdout.trim()).toBe('world');
    });
  });

  describe('read_file tool', () => {
    const testDir = join(tmpdir(), 'guard-test-read');
    const testFile = join(testDir, 'test.txt');

    test('blocks read when FSGuard denies path', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => false,
          canWrite: (path: string) => true,
        },
      };

      await expect(
        readFileTool.execute({ path: testFile }, makeContext({ guards }))
      ).rejects.toThrow('Read access denied');
    });

    test('allows read when FSGuard allows path', async () => {
      mkdirSync(testDir, { recursive: true });
      writeFileSync(testFile, 'test content', 'utf-8');

      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      try {
        const result = await readFileTool.execute(
          { path: testFile },
          makeContext({ guards })
        );
        expect((result as { content: string }).content).toBe('test content');
      } finally {
        unlinkSync(testFile);
        rmdirSync(testDir);
      }
    });
  });

  describe('write_file tool', () => {
    const testDir = join(tmpdir(), 'guard-test-write');
    const testFile = join(testDir, 'output.txt');

    test('blocks write when FSGuard denies path', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => false,
        },
      };

      await expect(
        writeFileTool.execute(
          { path: testFile, content: 'blocked' },
          makeContext({ guards })
        )
      ).rejects.toThrow('Write access denied');
    });

    test('allows write when FSGuard allows path', async () => {
      mkdirSync(testDir, { recursive: true });

      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      try {
        const result = await writeFileTool.execute(
          { path: testFile, content: 'allowed content' },
          makeContext({ guards })
        );
        expect((result as { path: string }).path).toBe(resolve(process.cwd(), testFile));
      } finally {
        try { unlinkSync(testFile); } catch {}
        try { rmdirSync(testDir); } catch {}
      }
    });
  });

  describe('fetch tool', () => {
    test('blocks fetch when NetworkGuard denies host', async () => {
      const guards: SandboxGuards = {
        network: {
          canConnect: (host: string, port?: number) => false,
        },
      };

      await expect(
        fetchTool.execute(
          { url: 'https://example.com/api' },
          makeContext({ guards })
        )
      ).rejects.toThrow('Network access denied');
    });

    test('checks correct hostname from URL', async () => {
      let checkedHost: string | null = null;
      let checkedPort: number | undefined = undefined;

      const guards: SandboxGuards = {
        network: {
          canConnect: (host: string, port?: number) => {
            checkedHost = host;
            checkedPort = port;
            return false;
          },
        },
      };

      await expect(
        fetchTool.execute(
          { url: 'https://api.example.com:8443/path' },
          makeContext({ guards })
        )
      ).rejects.toThrow('Network access denied');

      expect(checkedHost).toBe('api.example.com');
      expect(checkedPort).toBe(8443);
    });
  });

  describe('edit_file tool', () => {
    const testDir = join(tmpdir(), 'guard-test-edit');
    const testFile = join(testDir, 'editable.txt');

    test('blocks edit when FSGuard denies read', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => false,
          canWrite: (path: string) => true,
        },
      };

      await expect(
        editFileTool.execute(
          { path: testFile, edits: [{ oldText: 'a', newText: 'b' }] },
          makeContext({ guards })
        )
      ).rejects.toThrow('Read access denied');
    });

    test('blocks edit when FSGuard denies write', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => false,
        },
      };

      await expect(
        editFileTool.execute(
          { path: testFile, edits: [{ oldText: 'a', newText: 'b' }] },
          makeContext({ guards })
        )
      ).rejects.toThrow('Write access denied');
    });

    test('allows edit when FSGuard allows both read and write', async () => {
      mkdirSync(testDir, { recursive: true });
      writeFileSync(testFile, 'hello world', 'utf-8');

      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      try {
        const result = await editFileTool.execute(
          { path: testFile, edits: [{ oldText: 'hello', newText: 'goodbye' }] },
          makeContext({ guards })
        );
        expect((result as { editsApplied: number }).editsApplied).toBe(1);
      } finally {
        try { unlinkSync(testFile); } catch {}
        try { rmdirSync(testDir); } catch {}
      }
    });
  });

  describe('glob tool', () => {
    test('blocks glob when FSGuard denies read on base path', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => false,
          canWrite: (path: string) => true,
        },
      };

      await expect(
        globTool.execute(
          { pattern: '*.ts' },
          makeContext({ guards })
        )
      ).rejects.toThrow('Read access denied');
    });

    test('allows glob when FSGuard allows read', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      const result = await globTool.execute(
        { pattern: '*.ts', cwd: 'packages/core/src' },
        makeContext({ guards })
      );
      expect((result as { files: string[] }).files).toBeDefined();
    });
  });

  describe('grep tool', () => {
    const testDir = join(tmpdir(), 'guard-test-grep');
    const testFile = join(testDir, 'searchable.txt');

    test('blocks grep when FSGuard denies read on search path', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => false,
          canWrite: (path: string) => true,
        },
      };

      await expect(
        grepTool.execute(
          { pattern: 'test', path: testDir },
          makeContext({ guards })
        )
      ).rejects.toThrow('Read access denied');
    });

    test('allows grep when FSGuard allows read', async () => {
      mkdirSync(testDir, { recursive: true });
      writeFileSync(testFile, 'line one\nline two\ntest match\n', 'utf-8');

      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      try {
        const result = await grepTool.execute(
          { pattern: 'test', path: testDir },
          makeContext({ guards })
        );
        expect((result as { matches: unknown[] }).matches.length).toBeGreaterThan(0);
      } finally {
        try { unlinkSync(testFile); } catch {}
        try { rmdirSync(testDir); } catch {}
      }
    });
  });

  describe('list_dir tool', () => {
    const testDir = join(tmpdir(), 'guard-test-listdir');

    test('blocks list_dir when FSGuard denies read on target path', async () => {
      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => false,
          canWrite: (path: string) => true,
        },
      };

      await expect(
        listDirTool.execute(
          { path: testDir },
          makeContext({ guards })
        )
      ).rejects.toThrow('Read access denied');
    });

    test('allows list_dir when FSGuard allows read', async () => {
      mkdirSync(testDir, { recursive: true });
      writeFileSync(join(testDir, 'file.txt'), 'content', 'utf-8');

      const guards: SandboxGuards = {
        fs: {
          canRead: (path: string) => true,
          canWrite: (path: string) => true,
        },
      };

      try {
        const result = await listDirTool.execute(
          { path: testDir },
          makeContext({ guards })
        );
        expect((result as { entries: unknown[] }).entries.length).toBeGreaterThan(0);
      } finally {
        try { unlinkSync(join(testDir, 'file.txt')); } catch {}
        try { rmdirSync(testDir); } catch {}
      }
    });
  });

  describe('ToolExecutor passes guards to tools', () => {
    test('executor merges guards into context', async () => {
      // Import executor separately
      const { ToolRegistry, ToolExecutor } = await import('@expo/tools');
      const { z } = await import('zod');

      let receivedGuards: SandboxGuards | undefined;
      const registry = new ToolRegistry(false);
      registry.register({
        name: 'spy-tool',
        description: 'Captures context',
        category: 'other',
        inputSchema: z.object({}),
        execute: async (_input, ctx) => {
          receivedGuards = ctx.guards;
          return { done: true };
        },
      });

      const guards: SandboxGuards = {
        fs: { canRead: () => true, canWrite: () => true },
        process: { canExecute: () => true },
      };

      const executor = new ToolExecutor(registry, { guards });
      await executor.execute('spy-tool', {}, makeContext());

      expect(receivedGuards).toBeDefined();
      expect(receivedGuards!.fs).toBeDefined();
      expect(receivedGuards!.process).toBeDefined();
    });
  });
});
