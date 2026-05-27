export interface CommandContext {
  session?: unknown;
  config: Record<string, unknown>;
  tools: Array<{ name: string; description: string }>;
  agents: Array<{ name: string; description: string }>;
  permissions: Record<string, unknown>;
}

export interface CommandResult {
  output: string;
  action?: 'continue' | 'exit' | 'clear';
}

export interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  execute: (args: string, context: CommandContext) => Promise<CommandResult>;
}
