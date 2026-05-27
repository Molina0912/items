import type { HookContext, HookResult } from '../types.js';

export interface CommandHookInput {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * CommandHookHandler executes a shell command as a hook action.
 * Stubbed for now - full integration comes in later features.
 */
export async function commandHookHandler(
  input: CommandHookInput,
  _context: HookContext
): Promise<HookResult> {
  // Stub: return the command that would be executed
  return {
    modified: false,
    data: {
      command: input.command,
      cwd: input.cwd,
      env: input.env,
      status: 'stub',
    },
  };
}
