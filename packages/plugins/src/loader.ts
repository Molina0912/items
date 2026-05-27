import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { PluginManifest } from './types.js';

export interface PluginExports {
  tools?: unknown[];
  agents?: unknown[];
  hooks?: Array<{ event: string; handler: (...args: unknown[]) => unknown }>;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  exports: PluginExports;
  activate?: () => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
}

export class PluginLoader {
  private loaded: Map<string, LoadedPlugin> = new Map();

  async load(pluginPath: string, manifest: PluginManifest): Promise<LoadedPlugin> {
    const mainPath = join(pluginPath, manifest.main);
    if (!existsSync(mainPath)) {
      throw new Error(`Plugin main entry not found: ${mainPath}`);
    }

    const mod = await import(mainPath);
    const plugin: LoadedPlugin = {
      manifest,
      exports: {
        tools: mod.tools ?? [],
        agents: mod.agents ?? [],
        hooks: mod.hooks ?? [],
      },
      activate: mod.activate,
      deactivate: mod.deactivate,
    };

    if (plugin.activate) {
      await plugin.activate();
    }

    this.loaded.set(manifest.name, plugin);
    return plugin;
  }

  async unload(name: string): Promise<void> {
    const plugin = this.loaded.get(name);
    if (!plugin) {
      throw new Error(`Plugin not loaded: ${name}`);
    }
    if (plugin.deactivate) {
      await plugin.deactivate();
    }
    this.loaded.delete(name);
  }

  getExports(name: string): PluginExports | undefined {
    const plugin = this.loaded.get(name);
    return plugin?.exports;
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }
}
