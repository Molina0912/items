import semver from 'semver';
import { PluginManifestSchema } from './types.js';
import type { PluginManifest } from './types.js';

export function validateManifest(data: unknown): PluginManifest {
  return PluginManifestSchema.parse(data);
}

export function checkCompatibility(manifest: PluginManifest, cliVersion: string): boolean {
  if (!manifest.minCliVersion) {
    return true;
  }
  return semver.gte(cliVersion, manifest.minCliVersion);
}
