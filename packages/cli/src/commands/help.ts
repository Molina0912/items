import type { SlashCommand, CommandResult } from './types.js';
import type { CommandRegistry } from './registry.js';

export function createHelpCommand(registry: CommandRegistry): SlashCommand {
  return {
    name: 'help',
    description: 'List all commands or show specific command help',
    aliases: ['h', '?'],
    execute: async (args: string): Promise<CommandResult> => {
      if (args) {
        const command = registry.get(args);
        if (command) {
          return { output: `/${command.name} - ${command.description}` };
        }
        return { output: `Unknown command: ${args}` };
      }

      const commands = registry.list();
      const lines = commands.map(cmd => `  /${cmd.name} - ${cmd.description}`);
      return { output: `Available commands:\n${lines.join('\n')}` };
    },
  };
}
