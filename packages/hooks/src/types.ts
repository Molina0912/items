import { z } from 'zod';

export const HookEventSchema = z.enum([
  'session:start',
  'session:end',
  'turn:start',
  'turn:end',
  'tool:pre',
  'tool:post',
  'agent:start',
  'agent:end',
  'error',
  'permission:ask',
  'message:pre',
  'message:post',
]);
export type HookEvent = z.infer<typeof HookEventSchema>;

export interface HookResult {
  modified?: boolean;
  data?: unknown;
  error?: Error;
}

export interface HookContext {
  event: HookEvent;
  payload: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
}

export interface HookHandler {
  name: string;
  event: HookEvent | HookEvent[];
  condition?: string;
  handler: (context: HookContext) => Promise<HookResult>;
  once?: boolean;
  timeout?: number;
  priority?: number;
}

export interface HookDefinition {
  name: string;
  description?: string;
  event: HookEvent | HookEvent[];
  condition?: string;
  once?: boolean;
  timeout?: number;
  priority?: number;
  handlerType: 'command' | 'http' | 'mcp-tool' | 'prompt' | 'agent' | 'custom';
  handlerConfig: Record<string, unknown>;
}
