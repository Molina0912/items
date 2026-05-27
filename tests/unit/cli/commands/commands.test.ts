import { describe, test, expect } from 'bun:test';
import {
  CommandRegistry,
  createHelpCommand,
  clearCommand,
  compactCommand,
  configCommand,
  modelCommand,
  sessionCommand,
  toolsCommand,
  agentsCommand,
  permissionsCommand,
} from '@expo/cli';
import type { CommandContext } from '@expo/cli';

function makeContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    config: {},
    tools: [],
    agents: [],
    permissions: {},
    ...overrides,
  };
}

describe('built-in commands', () => {
  describe('/help', () => {
    test('lists all commands when no args', async () => {
      const registry = new CommandRegistry();
      registry.register(clearCommand);
      registry.register(compactCommand);
      const helpCmd = createHelpCommand(registry);
      registry.register(helpCmd);

      const result = await helpCmd.execute('', makeContext());
      expect(result.output).toContain('/clear');
      expect(result.output).toContain('/compact');
    });

    test('shows specific command help', async () => {
      const registry = new CommandRegistry();
      registry.register(clearCommand);
      const helpCmd = createHelpCommand(registry);
      registry.register(helpCmd);

      const result = await helpCmd.execute('clear', makeContext());
      expect(result.output).toContain('/clear');
      expect(result.output).toContain('Reset conversation');
    });

    test('shows error for unknown command', async () => {
      const registry = new CommandRegistry();
      const helpCmd = createHelpCommand(registry);

      const result = await helpCmd.execute('nonexistent', makeContext());
      expect(result.output).toContain('Unknown command');
    });
  });

  describe('/clear', () => {
    test('returns clear action', async () => {
      const result = await clearCommand.execute('', makeContext());
      expect(result.action).toBe('clear');
      expect(result.output).toContain('cleared');
    });
  });

  describe('/compact', () => {
    test('returns placeholder message', async () => {
      const result = await compactCommand.execute('', makeContext());
      expect(result.output).toContain('compacted');
    });
  });

  describe('/config', () => {
    test('shows all config when no args', async () => {
      const ctx = makeContext({ config: { model: 'gpt-4', theme: 'dark' } });
      const result = await configCommand.execute('', ctx);
      expect(result.output).toContain('model');
      expect(result.output).toContain('theme');
    });

    test('shows specific key', async () => {
      const ctx = makeContext({ config: { model: 'gpt-4' } });
      const result = await configCommand.execute('model', ctx);
      expect(result.output).toContain('gpt-4');
    });

    test('sets a config value', async () => {
      const ctx = makeContext();
      const result = await configCommand.execute('model gpt-4o', ctx);
      expect(result.output).toContain('Set model');
      expect(ctx.config['model']).toBe('gpt-4o');
    });

    test('shows message for unset key', async () => {
      const result = await configCommand.execute('missing', makeContext());
      expect(result.output).toContain('not set');
    });
  });

  describe('/model', () => {
    test('shows current model', async () => {
      const ctx = makeContext({ config: { model: 'claude-3' } });
      const result = await modelCommand.execute('', ctx);
      expect(result.output).toContain('claude-3');
    });

    test('switches model', async () => {
      const ctx = makeContext();
      const result = await modelCommand.execute('gpt-4', ctx);
      expect(result.output).toContain('gpt-4');
      expect(ctx.config['model']).toBe('gpt-4');
    });
  });

  describe('/session', () => {
    test('lists sessions by default', async () => {
      const result = await sessionCommand.execute('', makeContext());
      expect(result.output).toContain('Sessions');
    });

    test('creates new session', async () => {
      const result = await sessionCommand.execute('new', makeContext());
      expect(result.output).toContain('Created new session');
    });

    test('switches session', async () => {
      const result = await sessionCommand.execute('switch abc123', makeContext());
      expect(result.output).toContain('abc123');
    });

    test('shows usage for switch without id', async () => {
      const result = await sessionCommand.execute('switch', makeContext());
      expect(result.output).toContain('Usage');
    });
  });

  describe('/tools', () => {
    test('lists tools', async () => {
      const ctx = makeContext({ tools: [{ name: 'bash', description: 'Run shell commands' }] });
      const result = await toolsCommand.execute('', ctx);
      expect(result.output).toContain('bash');
    });

    test('shows message when no tools', async () => {
      const result = await toolsCommand.execute('', makeContext());
      expect(result.output).toContain('No tools');
    });
  });

  describe('/agents', () => {
    test('lists agents', async () => {
      const ctx = makeContext({ agents: [{ name: 'coder', description: 'Coding agent' }] });
      const result = await agentsCommand.execute('', ctx);
      expect(result.output).toContain('coder');
    });

    test('shows message when no agents', async () => {
      const result = await agentsCommand.execute('', makeContext());
      expect(result.output).toContain('No agents');
    });
  });

  describe('/permissions', () => {
    test('lists permissions', async () => {
      const ctx = makeContext({ permissions: { 'tool:bash': 'allow' } });
      const result = await permissionsCommand.execute('list', ctx);
      expect(result.output).toContain('tool:bash');
    });

    test('shows message when no permissions', async () => {
      const result = await permissionsCommand.execute('list', makeContext());
      expect(result.output).toContain('No permissions');
    });

    test('resets permissions', async () => {
      const result = await permissionsCommand.execute('reset', makeContext());
      expect(result.output).toContain('reset');
    });
  });
});
