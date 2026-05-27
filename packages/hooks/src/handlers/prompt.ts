import type { HookContext, HookResult } from '../types.js';

export interface PromptHookInput {
  content: string;
  position?: 'prepend' | 'append';
}

/**
 * PromptHookHandler injects prompt content as a hook action.
 * Stubbed for now - full integration comes in later features.
 */
export async function promptHookHandler(
  input: PromptHookInput,
  _context: HookContext
): Promise<HookResult> {
  return {
    modified: true,
    data: {
      content: input.content,
      position: input.position ?? 'append',
    },
  };
}
