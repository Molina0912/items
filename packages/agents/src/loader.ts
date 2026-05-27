import { z } from 'zod';
import { AgentError, ErrorCode } from '@expo/core';
import type { AgentDefinition, AgentRole } from './types.js';
import { AgentRegistry } from './registry.js';

const agentDefinitionSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['primary', 'subagent', 'hidden']),
  model: z.string().min(1),
  systemPrompt: z.string(),
  tools: z.array(z.string()),
  maxSteps: z.number().int().positive(),
  description: z.string(),
});

const agentsConfigSchema = z.object({
  agents: z.array(agentDefinitionSchema).optional(),
});

export function loadAgents(config: unknown): AgentRegistry {
  const registry = new AgentRegistry(true);

  const parseResult = agentsConfigSchema.safeParse(config);
  if (!parseResult.success) {
    throw new AgentError(
      `Invalid agents configuration: ${parseResult.error.message}`,
      ErrorCode.AGENT_EXECUTION_FAILED,
      { errors: parseResult.error.issues }
    );
  }

  const agentDefs = parseResult.data.agents ?? [];
  for (const def of agentDefs) {
    const definition: AgentDefinition = {
      ...def,
      role: def.role as AgentRole,
    };
    registry.register(definition);
  }

  return registry;
}
