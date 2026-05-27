import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export const toolsCommand: SlashCommand = {
  name: 'tools',
  description: 'List all available tools',
  execute: async (_args: string, context: CommandContext): Promise<CommandResult> => {
    if (context.tools.length === 0) {
      return { output: 'No tools available.' };
    }
    const lines = context.tools.map(t => `  ${t.name} - ${t.description}`);
    return { output: `Available tools:\n${lines.join('\n')}` };
  },
};
