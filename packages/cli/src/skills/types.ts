export interface Skill {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
}

export interface SkillManifest {
  skills: Skill[];
}

export interface SkillInvocation {
  skill: Skill;
  input: string;
  context: unknown;
}
