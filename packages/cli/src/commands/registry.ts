import type { SlashCommand, CommandContext, CommandResult } from './types.js';

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>();
  private aliasMap = new Map<string, string>();

  register(command: SlashCommand): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliasMap.set(alias, command.name);
      }
    }
  }

  get(name: string): SlashCommand | undefined {
    return this.commands.get(name) ?? this.commands.get(this.aliasMap.get(name) ?? '');
  }

  list(): SlashCommand[] {
    return [...this.commands.values()];
  }

  async execute(input: string, context: CommandContext): Promise<CommandResult> {
    const trimmed = input.startsWith('/') ? input.slice(1) : input;
    const spaceIdx = trimmed.indexOf(' ');
    const name = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const args = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

    const command = this.get(name);
    if (!command) {
      return { output: `Unknown command: /${name}. Type /help for available commands.` };
    }

    return command.execute(args, context);
  }
}
