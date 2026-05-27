import type { HookContext, HookResult } from '../types.js';

export interface McpToolHookInput {
  server: string;
  tool: string;
  args?: unknown;
}

/**
 * McpToolHookHandler invokes an MCP tool as a hook action.
 * Stubbed - actual MCP integration comes in FEAT-007.
 */
export async function mcpToolHookHandler(
  input: McpToolHookInput,
  _context: HookContext
): Promise<HookResult> {
  // Stub: return the tool invocation that would be made
  return {
    modified: false,
    data: {
      server: input.server,
      tool: input.tool,
      args: input.args,
      status: 'stub',
    },
  };
}
