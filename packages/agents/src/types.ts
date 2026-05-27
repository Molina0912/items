import type { Message } from '@expo/core';

export type AgentRole = 'primary' | 'subagent' | 'hidden';

export interface AgentDefinition {
  name: string;
  role: AgentRole;
  model: string;
  systemPrompt: string;
  tools: string[];
  maxSteps: number;
  description: string;
}

export interface AgentInstance {
  definition: AgentDefinition;
  state: 'idle' | 'running' | 'completed' | 'failed';
  currentStep: number;
  messages: Message[];
}

export interface AgentStep {
  stepNumber: number;
  action: 'tool_call' | 'response' | 'error';
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  response?: string;
  error?: string;
}

export interface StepResult {
  continue: boolean;
  response?: string;
  toolResults?: Array<{ toolCallId: string; output: string; error?: string }>;
}

export type GenerateResponseFn = (
  messages: Message[],
  tools: string[],
  options?: { signal?: AbortSignal }
) => Promise<AgentStep>;
