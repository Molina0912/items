import { describe, test, expect } from 'bun:test';
import { ToolRegistry, ToolExecutor } from '@expo/tools';
import type { ToolContext } from '@expo/tools';
import type { PermissionEvaluatorLike } from '@expo/tools/dist/executor.js';
import { z } from 'zod';

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    workingDir: process.cwd(),
    sessionId: 'test-session',
    permissions: {},
    ...overrides,
  };
}

function makeEvaluator(result: 'allow' | 'ask' | 'deny'): PermissionEvaluatorLike {
  return {
    evaluate: () => result,
  };
}

describe('ToolExecutor permission checks', () => {
  test('allows execution when evaluator returns allow', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('allow'),
      permissionMode: 'auto',
    });

    const result = await executor.execute('test-tool', {}, makeContext());
    expect(result).toEqual({ done: true });
  });

  test('denies execution when evaluator returns deny', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('deny'),
      permissionMode: 'auto',
    });

    await expect(
      executor.execute('test-tool', {}, makeContext())
    ).rejects.toThrow('Permission denied');
  });

  test('allows execution in auto mode when evaluator returns ask', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('ask'),
      permissionMode: 'auto',
    });

    const result = await executor.execute('test-tool', {}, makeContext());
    expect(result).toEqual({ done: true });
  });

  test('denies execution in strict mode when evaluator returns ask', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('ask'),
      permissionMode: 'strict',
    });

    await expect(
      executor.execute('test-tool', {}, makeContext())
    ).rejects.toThrow('Permission denied');
  });

  test('denies execution in interactive mode when evaluator returns ask', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('ask'),
      permissionMode: 'interactive',
    });

    await expect(
      executor.execute('test-tool', {}, makeContext())
    ).rejects.toThrow('Permission requires approval');
  });

  test('skips permission check for tools without requiresPermission', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'safe-tool',
      description: 'A tool that does not require permission',
      category: 'other',
      inputSchema: z.object({}),
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry, {
      permissionEvaluator: makeEvaluator('deny'),
      permissionMode: 'strict',
    });

    // Should succeed because tool does not require permission
    const result = await executor.execute('safe-tool', {}, makeContext());
    expect(result).toEqual({ done: true });
  });

  test('skips permission check when no evaluator is provided', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test-tool',
      description: 'A tool',
      category: 'other',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    const executor = new ToolExecutor(registry);

    const result = await executor.execute('test-tool', {}, makeContext());
    expect(result).toEqual({ done: true });
  });

  test('evaluator receives correct tool name and scope', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'bash',
      description: 'Shell',
      category: 'shell',
      inputSchema: z.object({}),
      requiresPermission: true,
      execute: async () => ({ done: true }),
    });

    let receivedQuery: { scope: string; resource: string } | null = null;
    const executor = new ToolExecutor(registry, {
      permissionEvaluator: {
        evaluate(query) {
          receivedQuery = { scope: query.scope, resource: query.resource };
          return 'allow';
        },
      },
      permissionMode: 'auto',
    });

    await executor.execute('bash', {}, makeContext());
    expect(receivedQuery).toEqual({ scope: 'tool', resource: 'bash' });
  });
});
