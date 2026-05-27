import { existsSync, mkdirSync, rmSync, readFileSync, symlinkSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { ResolvedPlugin } from './resolver.js';
import { validateManifest } from './manifest.js';
import type { PluginManifest } from './types.js';

export class PluginInstaller {
  async install(resolved: ResolvedPlugin, pluginsDir: string): Promise<string> {
    mkdirSync(pluginsDir, { recursive: true });

    switch (resolved.type) {
      case 'npm':
        return this.installFromNpm(resolved, pluginsDir);
      case 'local':
        return this.installFromLocal(resolved, pluginsDir);
      case 'git':
        return this.installFromGit(resolved, pluginsDir);
      default:
        throw new Error(`Unknown plugin source type: ${(resolved as ResolvedPlugin).type}`);
    }
  }

  private async installFromNpm(resolved: ResolvedPlugin, pluginsDir: string): Promise<string> {
    const name = resolved.source.replace(/^@/, '').replace(/\//g, '-');
    const pluginDir = join(pluginsDir, name);
    mkdirSync(pluginDir, { recursive: true });
    // In production, this would fetch the tarball from npm and extract it.
    // For now, we create the directory structure and expect it to be populated.
    return pluginDir;
  }

  private async installFromLocal(resolved: ResolvedPlugin, pluginsDir: string): Promise<string> {
    const name = basename(resolved.url);
    const pluginDir = join(pluginsDir, name);
    if (existsSync(pluginDir)) {
      rmSync(pluginDir, { recursive: true, force: true });
    }
    symlinkSync(resolved.url, pluginDir);
    return pluginDir;
  }

  private async installFromGit(resolved: ResolvedPlugin, pluginsDir: string): Promise<string> {
    const name = basename(resolved.url, '.git').replace(/[^a-zA-Z0-9-_]/g, '-');
    const pluginDir = join(pluginsDir, name);
    mkdirSync(pluginDir, { recursive: true });
    // In production, this would clone the git repo.
    // For now, we create the directory structure.
    return pluginDir;
  }

  validate(pluginPath: string): PluginManifest {
    const manifestPath = join(pluginPath, 'plugin.json');
    if (!existsSync(manifestPath)) {
      throw new Error(`Plugin manifest not found at: ${manifestPath}`);
    }
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    return validateManifest(raw);
  }

  uninstall(name: string, pluginsDir: string): void {
    const pluginDir = join(pluginsDir, name);
    if (!existsSync(pluginDir)) {
      throw new Error(`Plugin not found: ${name}`);
    }
    rmSync(pluginDir, { recursive: true, force: true });
  }
}
