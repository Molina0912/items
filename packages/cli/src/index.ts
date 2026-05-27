export { parseFlags } from './flags.js';
export type { CliFlags } from './flags.js';
export { runHeadless } from './headless.js';
export { runRepl } from './repl.js';

export type { SlashCommand, CommandContext, CommandResult } from './commands/types.js';
export { CommandRegistry } from './commands/registry.js';
export { createHelpCommand } from './commands/help.js';
export { clearCommand } from './commands/clear.js';
export { compactCommand } from './commands/compact.js';
export { configCommand } from './commands/config.js';
export { modelCommand } from './commands/model.js';
export { sessionCommand } from './commands/session.js';
export { toolsCommand } from './commands/tools.js';
export { agentsCommand } from './commands/agents.js';
export { permissionsCommand } from './commands/permissions.js';

export type { Skill, SkillManifest, SkillInvocation } from './skills/types.js';
export { loadSkills } from './skills/loader.js';
export { invokeSkill } from './skills/invoker.js';
export type { PreparedMessages } from './skills/invoker.js';

import { parseFlags } from './flags.js';
import { runHeadless } from './headless.js';
import { runRepl } from './repl.js';

export async function main(argv?: string[]): Promise<void> {
  const flags = parseFlags(argv);

  if (flags.headless || flags.print) {
    await runHeadless(flags);
  } else {
    await runRepl(flags);
  }
}
