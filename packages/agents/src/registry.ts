import { AgentError, ErrorCode } from '@expo/core';
import type { AgentDefinition } from './types.js';
import { primaryAgent } from './built-in/primary.js';
import { subagentDefinition } from './built-in/subagent.js';

export class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  constructor(autoRegisterBuiltIn = true) {
    if (autoRegisterBuiltIn) {
      this.registerBuiltIns();
    }
  }

  register(definition: AgentDefinition): void {
    this.agents.set(definition.name, definition);
  }

  get(name: string): AgentDefinition {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new AgentError(
        `Agent not found: ${name}`,
        ErrorCode.AGENT_NOT_FOUND,
        { agentName: name }
      );
    }
    return agent;
  }

  has(name: string): boolean {
    return this.agents.has(name);
  }

  list(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  private registerBuiltIns(): void {
    this.register(primaryAgent);
    this.register(subagentDefinition);
  }
}
