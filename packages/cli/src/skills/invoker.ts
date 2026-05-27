import type { Skill, SkillInvocation } from './types.js';

export interface PreparedMessages {
  system: string;
  user: string;
  tools: string[];
  model?: string;
}

export function invokeSkill(invocation: SkillInvocation): PreparedMessages {
  const { skill, input } = invocation;

  return {
    system: skill.prompt,
    user: input,
    tools: skill.tools ?? [],
    model: skill.model,
  };
}
