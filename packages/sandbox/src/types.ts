import { z } from 'zod';

export type SandboxMode = 'none' | 'permissive' | 'strict';

export interface FSPolicy {
  allowRead: string[];
  allowWrite: string[];
  denyRead?: string[];
  denyWrite?: string[];
}

export interface NetworkPolicy {
  allowDomains: string[];
  denyDomains?: string[];
  allowPorts?: number[];
}

export interface ProcessPolicy {
  allowCommands: string[];
  denyCommands?: string[];
  maxProcesses?: number;
  maxMemoryMB?: number;
}

export interface SandboxPolicy {
  mode: SandboxMode;
  fs?: FSPolicy;
  network?: NetworkPolicy;
  process?: ProcessPolicy;
}

export const FSPolicySchema = z.object({
  allowRead: z.array(z.string()),
  allowWrite: z.array(z.string()),
  denyRead: z.array(z.string()).optional(),
  denyWrite: z.array(z.string()).optional(),
});

export const NetworkPolicySchema = z.object({
  allowDomains: z.array(z.string()),
  denyDomains: z.array(z.string()).optional(),
  allowPorts: z.array(z.number()).optional(),
});

export const ProcessPolicySchema = z.object({
  allowCommands: z.array(z.string()),
  denyCommands: z.array(z.string()).optional(),
  maxProcesses: z.number().optional(),
  maxMemoryMB: z.number().optional(),
});

export const SandboxPolicySchema = z.object({
  mode: z.enum(['none', 'permissive', 'strict']),
  fs: FSPolicySchema.optional(),
  network: NetworkPolicySchema.optional(),
  process: ProcessPolicySchema.optional(),
});
