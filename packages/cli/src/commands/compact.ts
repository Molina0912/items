import type { SlashCommand, CommandResult } from './types.js';

export const compactCommand: SlashCommand = {
  name: 'compact',
  description: 'Summarize and compact context',
  execute: async (): Promise<CommandResult> => {
    return { output: 'Context compacted. (placeholder - full implementation pending)' };
  },
};
