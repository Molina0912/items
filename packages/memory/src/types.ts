export interface MemoryFile {
  path: string;
  content: string;
  conditions?: string[];
  priority?: number;
}

export interface MemoryRule {
  content: string;
  conditions: string[];
  priority?: number;
}

export interface ConditionalBlock {
  condition: string;
  content: string;
}

export interface MemoryContext {
  os: string;
  tool?: string;
  agent?: string;
  project?: string;
  [key: string]: string | undefined;
}
