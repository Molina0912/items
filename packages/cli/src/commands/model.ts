import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export const modelCommand: SlashCommand = {
  name: 'model',
  description: 'Show current or switch model',
  execute: async (args: string, context: CommandContext): Promise<CommandResult> => {
    if (!args) {
      const current = context.config['model'] ?? 'default';
      return { output: `Current model: ${current}` };
    }

    context.config['model'] = args;
    return { output: `Switched to model: ${args}` };
  },
};
