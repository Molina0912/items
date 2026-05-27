import type { SlashCommand, CommandResult } from './types.js';

export const sessionCommand: SlashCommand = {
  name: 'session',
  description: 'Manage sessions (list, new, switch)',
  aliases: ['s'],
  execute: async (args: string): Promise<CommandResult> => {
    const parts = args.split(/\s+/).filter(Boolean);
    const subcommand = parts[0] ?? 'list';

    switch (subcommand) {
      case 'list':
        return { output: 'Sessions:\n  [current] default' };
      case 'new':
        return { output: 'Created new session.' };
      case 'switch': {
        const id = parts[1];
        if (!id) {
          return { output: 'Usage: /session switch <id>' };
        }
        return { output: `Switched to session: ${id}` };
      }
      default:
        return { output: `Unknown subcommand: ${subcommand}. Use list, new, or switch.` };
    }
  },
};
