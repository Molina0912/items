import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export const configCommand: SlashCommand = {
  name: 'config',
  description: 'View or set config values',
  aliases: ['cfg'],
  execute: async (args: string, context: CommandContext): Promise<CommandResult> => {
    if (!args) {
      const entries = Object.entries(context.config);
      if (entries.length === 0) {
        return { output: 'No configuration values set.' };
      }
      const lines = entries.map(([k, v]) => `  ${k} = ${JSON.stringify(v)}`);
      return { output: `Configuration:\n${lines.join('\n')}` };
    }

    const parts = args.split(/\s+/);
    const key = parts[0];
    const value = parts.slice(1).join(' ');

    if (!value) {
      const val = context.config[key];
      if (val === undefined) {
        return { output: `Config key '${key}' is not set.` };
      }
      return { output: `${key} = ${JSON.stringify(val)}` };
    }

    context.config[key] = value;
    return { output: `Set ${key} = ${value}` };
  },
};
