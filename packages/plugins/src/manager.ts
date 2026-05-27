import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PluginResolver } from './resolver.js';
import { PluginInstaller } from './installer.js';
import { PluginLoader } from './loader.js';
import type { PluginInfo, PluginManifest, PluginState } from './types.js';

interface PluginRegistry {
  plugins: Record<string, PluginInfo>;
}

export class PluginManager {
  private resolver: PluginResolver;
  private installer: PluginInstaller;
  private loader: PluginLoader;
  private pluginsDir: string;
  private registryPath: string;
  private registry: PluginRegistry;

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;
    this.registryPath = join(pluginsDir, 'registry.json');
    this.resolver = new PluginResolver();
    this.installer = new PluginInstaller();
    this.loader = new PluginLoader();
    this.registry = this.loadRegistry();
  }

  private loadRegistry(): PluginRegistry {
    if (existsSync(this.registryPath)) {
      const data = readFileSync(this.registryPath, 'utf-8');
      return JSON.parse(data) as PluginRegistry;
    }
    return { plugins: {} };
  }

  private saveRegistry(): void {
    mkdirSync(this.pluginsDir, { recursive: true });
    writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
  }

  private updateState(name: string, state: PluginState): void {
    if (this.registry.plugins[name]) {
      this.registry.plugins[name].state = state;
      this.saveRegistry();
    }
  }

  async install(source: string): Promise<PluginInfo> {
    const resolved = this.resolver.resolve(source);
    const pluginPath = await this.installer.install(resolved, this.pluginsDir);
    const manifest = this.installer.validate(pluginPath);

    const info: PluginInfo = {
      manifest,
      state: 'installed',
      path: pluginPath,
      installedAt: new Date().toISOString(),
    };

    this.registry.plugins[manifest.name] = info;
    this.saveRegistry();
    return info;
  }

  async uninstall(name: string): Promise<void> {
    const info = this.registry.plugins[name];
    if (!info) {
      throw new Error(`Plugin not registered: ${name}`);
    }

    if (this.loader.isLoaded(name)) {
      await this.loader.unload(name);
    }

    this.installer.uninstall(name, this.pluginsDir);
    delete this.registry.plugins[name];
    this.saveRegistry();
  }

  async enable(name: string): Promise<void> {
    const info = this.registry.plugins[name];
    if (!info) {
      throw new Error(`Plugin not registered: ${name}`);
    }

    await this.loader.load(info.path, info.manifest);
    this.updateState(name, 'enabled');
  }

  async disable(name: string): Promise<void> {
    const info = this.registry.plugins[name];
    if (!info) {
      throw new Error(`Plugin not registered: ${name}`);
    }

    if (this.loader.isLoaded(name)) {
      await this.loader.unload(name);
    }
    this.updateState(name, 'disabled');
  }

  async update(name: string): Promise<PluginInfo | null> {
    const info = this.registry.plugins[name];
    if (!info) {
      throw new Error(`Plugin not registered: ${name}`);
    }
    // In a real implementation, we would check the source for a newer version
    // and reinstall if available. For now, return the current info.
    return info;
  }

  list(): PluginInfo[] {
    return Object.values(this.registry.plugins);
  }

  getInfo(name: string): PluginInfo | undefined {
    return this.registry.plugins[name];
  }
}
