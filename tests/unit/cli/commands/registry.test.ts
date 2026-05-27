import { describe, test, expect } from 'bun:test';
import { CommandRegistry } from '@expo/cli';
import type { SlashCommand, CommandContext, CommandResult } from '@expo/cli';

function makeContext(): CommandContext {
  return {
    config: {},
    tools: [],
    agents: [],
    permissions: {},
  };
}

function makeCommand(name: string, overrides: Partial<SlashCommand> = {}): SlashCommand {
  return {
    name,
    description: `${name} command`,
    execute: async () => ({ output: `executed ${name}` }),
    ...overrides,
  };
}

describe('CommandRegistry', () => {
  test('registers and retrieves a command', () => {
    const registry = new CommandRegistry();
    const cmd = makeCommand('test');
    registry.register(cmd);
    expect(registry.get('test')).toBe(cmd);
  });

  test('returns undefined for unknown command', () => {
    const registry = new CommandRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });

  test('lists all registered commands', () => {
    const registry = new CommandRegistry();
    registry.register(makeCommand('a'));
    registry.register(makeCommand('b'));
    registry.register(makeCommand('c'));
    expect(registry.list()).toHaveLength(3);
  });

  test('resolves commands by alias', () => {
    const registry = new CommandRegistry();
    const cmd = makeCommand('help', { aliases: ['h', '?'] });
    registry.register(cmd);
    expect(registry.get('h')).toBe(cmd);
    expect(registry.get('?')).toBe(cmd);
  });

  test('executes a command by name', async () => {
    const registry = new CommandRegistry();
    registry.register(makeCommand('test'));
    const result = await registry.execute('/test', makeContext());
    expect(result.output).toBe('executed test');
  });

  test('executes a command with arguments', async () => {
    const registry = new CommandRegistry();
    registry.register({
      name: 'echo',
      description: 'echo args',
      execute: async (args: string) => ({ output: args }),
    });
    const result = await registry.execute('/echo hello world', makeContext());
    expect(result.output).toBe('hello world');
  });

  test('returns error for unknown command execution', async () => {
    const registry = new CommandRegistry();
    const result = await registry.execute('/unknown', makeContext());
    expect(result.output).toContain('Unknown command');
  });

  test('executes via alias', async () => {
    const registry = new CommandRegistry();
    registry.register(makeCommand('help', { aliases: ['h'] }));
    const result = await registry.execute('/h', makeContext());
    expect(result.output).toBe('executed help');
  });
});
