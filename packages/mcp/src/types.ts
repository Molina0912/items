export type MCPTransport = 'stdio' | 'http' | 'sse';

export interface MCPOAuthConfig {
  clientId: string;
  clientSecret?: string;
  tokenUrl: string;
  scopes?: string[];
}

export interface MCPServerConfig {
  name: string;
  transport: MCPTransport;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  oauth?: MCPOAuthConfig;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export type MCPClientState = 'disconnected' | 'connecting' | 'ready' | 'error';

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface MCPTransportInterface {
  start?(): Promise<void>;
  send(message: MCPMessage): Promise<void>;
  onMessage(cb: (message: MCPMessage) => void): void;
  close(): Promise<void>;
}
