export type {
  HookEvent,
  HookHandler,
  HookDefinition,
  HookContext,
  HookResult,
} from './types.js';
export { HookEventSchema } from './types.js';

export { HookEngine } from './engine.js';
export { matchHandlers } from './matcher.js';
export { dispatchToHandlers } from './dispatch.js';
export type { DispatchOptions } from './dispatch.js';

export { commandHookHandler } from './handlers/command.js';
export type { CommandHookInput } from './handlers/command.js';

export { httpHookHandler } from './handlers/http.js';
export type { HttpHookInput } from './handlers/http.js';

export { mcpToolHookHandler } from './handlers/mcp-tool.js';
export type { McpToolHookInput } from './handlers/mcp-tool.js';

export { promptHookHandler } from './handlers/prompt.js';
export type { PromptHookInput } from './handlers/prompt.js';

export { agentHookHandler } from './handlers/agent.js';
export type { AgentHookInput } from './handlers/agent.js';
