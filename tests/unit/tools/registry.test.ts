import { describe, test, expect } from 'bun:test';
import { ToolRegistry } from '@expo/tools';
import type { ToolDefinition } from '@expo/tools';
import { z } from 'zod';

describe('ToolRegistry', () => {
  test('auto-registers built-in tools', () => {
    const registry = new ToolRegistry();
    expect(registry.has('bash')).toBe(true);
    expect(registry.has('read_file')).toBe(true);
    expect(registry.has('write_file')).toBe(true);
    expect(registry.has('edit_file')).toBe(true);
    expect(registry.has('glob')).toBe(true);
    expect(registry.has('grep')).toBe(true);
    expect(registry.has('list_dir')).toBe(true);
    expect(registry.has('fetch')).toBe(true);
  });

  test('can register a custom tool', () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'custom',
      description: 'A custom tool',
      category: 'other',
      inputSchema: z.object({ value: z.string() }),
      execute: async () => ({ result: 'ok' }),
    });
    expect(registry.has('custom')).toBe(true);
  });

  test('get returns registered tool', () => {
    const registry = new ToolRegistry();
    const tool = registry.get('bash');
    expect(tool.name).toBe('bash');
    expect(tool.category).toBe('shell');
  });

  test('get throws for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(() => registry.get('nonexistent')).toThrow('Tool not found: nonexistent');
  });

  test('has returns false for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.has('nonexistent')).toBe(false);
  });

  test('list returns all registered tools', () => {
    const registry = new ToolRegistry();
    const tools = registry.list();
    expect(tools.length).toBe(8);
  });

  test('listByCategory filters tools', () => {
    const registry = new ToolRegistry();
    const filesystemTools = registry.listByCategory('filesystem');
    expect(filesystemTools.length).toBeGreaterThan(0);
    for (const tool of filesystemTools) {
      expect(tool.category).toBe('filesystem');
    }
  });

  test('listByCategory returns empty for unused category', () => {
    const registry = new ToolRegistry();
    const tools = registry.listByCategory('other');
    expect(tools.length).toBe(0);
  });

  test('can create registry without built-ins', () => {
    const registry = new ToolRegistry(false);
    expect(registry.list().length).toBe(0);
  });
});
