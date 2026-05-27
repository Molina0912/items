export type {
  MCPTransport,
  MCPOAuthConfig,
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPromptArgument,
  MCPPrompt,
  MCPClientState,
  MCPMessage,
  MCPTransportInterface,
} from './types.js';

export { MCPClient } from './client.js';
export type { MCPClientOptions } from './client.js';

export { MCPClientPool } from './pool.js';
export type { MCPPoolAddOptions } from './pool.js';

export { StdioTransport } from './transport/stdio.js';
export type { StdioTransportOptions, SpawnedProcess } from './transport/stdio.js';

export { HttpTransport } from './transport/http.js';
export type { HttpTransportOptions } from './transport/http.js';

export { SSETransport } from './transport/sse.js';
export type { SSETransportOptions, EventSourceLike } from './transport/sse.js';

export { MCPOAuth } from './oauth.js';

export { registerMCPTools, registerMCPResources, registerMCPPrompts } from './registration.js';
export type { ToolRegistryLike, ResourceStoreLike, PromptStoreLike } from './registration.js';
