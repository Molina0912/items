import type { z } from 'zod';

export type ToolCategory = 'filesystem' | 'shell' | 'search' | 'network' | 'edit' | 'other';

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: z.ZodType;
  execute: (input: ToolInput, context: ToolContext) => Promise<ToolOutput>;
  timeout?: number;
  requiresPermission?: boolean;
}

export type ToolInput = Record<string, unknown>;
export type ToolOutput = Record<string, unknown>;

export interface SandboxGuards {
  fs?: { canRead(path: string): boolean; canWrite(path: string): boolean };
  network?: { canConnect(host: string, port?: number): boolean };
  process?: { canExecute(command: string): boolean };
}

export interface ToolContext {
  workingDir: string;
  sessionId: string;
  abortSignal?: AbortSignal;
  permissions: Record<string, boolean>;
  guards?: SandboxGuards;
}
