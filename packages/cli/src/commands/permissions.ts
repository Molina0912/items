import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export const permissionsCommand: SlashCommand = {
  name: 'permissions',
  description: 'View or manage permissions',
  aliases: ['perms'],
  execute: async (args: string, context: CommandContext): Promise<CommandResult> => {
    const subcommand = args.trim() || 'list';

    switch (subcommand) {
      case 'list': {
        const entries = Object.entries(context.permissions);
        if (entries.length === 0) {
          return { output: 'No permissions configured.' };
        }
        const lines = entries.map(([k, v]) => `  ${k}: ${v}`);
        return { output: `Permissions:\n${lines.join('\n')}` };
      }
      case 'reset':
        return { output: 'Permissions reset to defaults.' };
      default:
        return { output: `Unknown subcommand: ${subcommand}. Use list or reset.` };
    }
  },
};
