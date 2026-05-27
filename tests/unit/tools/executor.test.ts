import { describe, test, expect } from 'bun:test';
import { ToolRegistry, ToolExecutor } from '@expo/tools';
import type { ToolDefinition, ToolContext } from '@expo/tools';
import { z } from 'zod';

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    workingDir: process.cwd(),
    sessionId: 'test-session',
    permissions: {},
    ...overrides,
  };
}

describe('ToolExecutor', () => {
  test('executes a tool successfully', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'echo',
      description: 'Echoes input',
      category: 'other',
      inputSchema: z.object({ message: z.string() }),
      execute: async (input) => ({ echo: (input as { message: string }).message }),
    });
    const executor = new ToolExecutor(registry);
    const result = await executor.execute('echo', { message: 'hello' }, makeContext());
    expect(result).toEqual({ echo: 'hello' });
  });

  test('validates input with Zod schema', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'strict',
      description: 'Strict input',
      category: 'other',
      inputSchema: z.object({ count: z.number() }),
      execute: async (input) => ({ count: (input as { count: number }).count }),
    });
    const executor = new ToolExecutor(registry);
    await expect(
      executor.execute('strict', { count: 'not-a-number' }, makeContext())
    ).rejects.toThrow('Invalid input');
  });

  test('throws for unknown tool', async () => {
    const registry = new ToolRegistry(false);
    const executor = new ToolExecutor(registry);
    await expect(
      executor.execute('nonexistent', {}, makeContext())
    ).rejects.toThrow('Tool not found');
  });

  test('handles execution timeout', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'slow',
      description: 'Slow tool',
      category: 'other',
      inputSchema: z.object({}),
      timeout: 50,
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { done: true };
      },
    });
    const executor = new ToolExecutor(registry);
    await expect(
      executor.execute('slow', {}, makeContext())
    ).rejects.toThrow('timed out');
  });

  test('handles abort signal', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'waiter',
      description: 'Waits forever',
      category: 'other',
      inputSchema: z.object({}),
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return { done: true };
      },
    });
    const executor = new ToolExecutor(registry);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(
      executor.execute('waiter', {}, makeContext({ abortSignal: controller.signal }))
    ).rejects.toThrow('aborted');
  });

  test('handles pre-aborted signal', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'noop',
      description: 'No-op',
      category: 'other',
      inputSchema: z.object({}),
      execute: async () => ({ done: true }),
    });
    const executor = new ToolExecutor(registry);
    const controller = new AbortController();
    controller.abort();
    await expect(
      executor.execute('noop', {}, makeContext({ abortSignal: controller.signal }))
    ).rejects.toThrow('aborted');
  });

  test('wraps execution errors in ToolError', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'crasher',
      description: 'Crashes',
      category: 'other',
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error('something broke');
      },
    });
    const executor = new ToolExecutor(registry);
    await expect(
      executor.execute('crasher', {}, makeContext())
    ).rejects.toThrow('something broke');
  });
});
