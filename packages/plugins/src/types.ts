import { z } from 'zod';

export const PluginCapabilityEnum = z.enum([
  'tools',
  'agents',
  'hooks',
  'themes',
  'commands',
  'providers',
]);

export type PluginCapability = z.infer<typeof PluginCapabilityEnum>;

export const PluginHookSchema = z.object({
  event: z.string(),
  handler: z.string(),
});

export type PluginHook = z.infer<typeof PluginHookSchema>;

export const PluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  author: z.string().optional(),
  license: z.string().optional(),
  main: z.string().min(1),
  capabilities: z.array(PluginCapabilityEnum).optional(),
  hooks: z.array(PluginHookSchema).optional(),
  tools: z.array(z.string()).optional(),
  agents: z.array(z.string()).optional(),
  minCliVersion: z.string().optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export type PluginState = 'installed' | 'enabled' | 'disabled' | 'error';

export interface PluginInfo {
  manifest: PluginManifest;
  state: PluginState;
  path: string;
  installedAt: string;
}
