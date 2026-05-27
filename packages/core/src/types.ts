export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Turn {
  id: string;
  sessionId: string;
  messages: Message[];
  toolCalls: ToolCall[];
  startedAt: string;
  completedAt?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
  duration: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  maxTurns?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

export interface SessionState {
  id: string;
  agentId: string;
  turns: Turn[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}
