import type { HookContext, HookResult } from '../types.js';

export interface AgentHookInput {
  agent: string;
  message: string;
}

/**
 * AgentHookHandler delegates to an agent as a hook action.
 * Stubbed for now - full integration comes in later features.
 */
export async function agentHookHandler(
  input: AgentHookInput,
  _context: HookContext
): Promise<HookResult> {
  // Stub: return the delegation that would be made
  return {
    modified: false,
    data: {
      agent: input.agent,
      message: input.message,
      status: 'stub',
    },
  };
}
