import type { SlashCommand, CommandResult } from './types.js';

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: 'Reset conversation',
  aliases: ['cls'],
  execute: async (): Promise<CommandResult> => {
    return { output: 'Conversation cleared.', action: 'clear' };
  },
};
