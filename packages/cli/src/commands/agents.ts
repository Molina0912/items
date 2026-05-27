import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export const agentsCommand: SlashCommand = {
  name: 'agents',
  description: 'List all available agents',
  execute: async (_args: string, context: CommandContext): Promise<CommandResult> => {
    if (context.agents.length === 0) {
      return { output: 'No agents available.' };
    }
    const lines = context.agents.map(a => `  ${a.name} - ${a.description}`);
    return { output: `Available agents:\n${lines.join('\n')}` };
  },
};
