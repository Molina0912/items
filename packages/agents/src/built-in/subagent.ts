import type { AgentDefinition } from '../types.js';

export const subagentDefinition: AgentDefinition = {
  name: 'subagent',
  role: 'subagent',
  model: 'default',
  systemPrompt: `You are a focused task executor. You have been delegated a specific task by the primary agent.
Complete the task efficiently using the tools available to you.
Return your results clearly and concisely when done.`,
  tools: ['read_file', 'write_file', 'edit_file', 'bash', 'glob', 'grep', 'list_dir'],
  maxSteps: 25,
  description: 'Scoped subagent for delegated tasks with limited tool access',
};
