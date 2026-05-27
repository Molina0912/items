import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PluginManager } from '@expo/plugins';

const TEST_DIR = join(import.meta.dir, '.tmp-manager');
const PLUGINS_DIR = join(TEST_DIR, 'plugins');
const LOCAL_PLUGIN_DIR = join(TEST_DIR, 'local-plugin');

function createLocalPlugin(name: string, version = '1.0.0'): string {
  const dir = join(LOCAL_PLUGIN_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'plugin.json'),
    JSON.stringify({
      name,
      version,
      description: `Test plugin ${name}`,
      main: './index.js',
    })
  );
  writeFileSync(
    join(dir, 'index.js'),
    'export const tools = []; export function activate() {} export function deactivate() {}'
  );
  return dir;
}

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
  mkdirSync(PLUGINS_DIR, { recursive: true });
  mkdirSync(LOCAL_PLUGIN_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('PluginManager', () => {
  test('installs a local plugin', async () => {
    const pluginPath = createLocalPlugin('test-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    const info = await manager.install(pluginPath);
    expect(info.manifest.name).toBe('test-plugin');
    expect(info.state).toBe('installed');
    expect(info.installedAt).toBeDefined();
  });

  test('lists installed plugins', async () => {
    const pluginPath = createLocalPlugin('list-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    await manager.install(pluginPath);
    const plugins = manager.list();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].manifest.name).toBe('list-plugin');
  });

  test('gets info for a specific plugin', async () => {
    const pluginPath = createLocalPlugin('info-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    await manager.install(pluginPath);
    const info = manager.getInfo('info-plugin');
    expect(info).toBeDefined();
    expect(info!.manifest.name).toBe('info-plugin');
  });

  test('uninstalls a plugin', async () => {
    const pluginPath = createLocalPlugin('remove-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    await manager.install(pluginPath);
    await manager.uninstall('remove-plugin');
    const plugins = manager.list();
    expect(plugins).toHaveLength(0);
  });

  test('enables a plugin', async () => {
    const pluginPath = createLocalPlugin('enable-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    await manager.install(pluginPath);
    await manager.enable('enable-plugin');
    const info = manager.getInfo('enable-plugin');
    expect(info!.state).toBe('enabled');
  });

  test('disables a plugin', async () => {
    const pluginPath = createLocalPlugin('disable-plugin');
    const manager = new PluginManager(PLUGINS_DIR);
    await manager.install(pluginPath);
    await manager.enable('disable-plugin');
    await manager.disable('disable-plugin');
    const info = manager.getInfo('disable-plugin');
    expect(info!.state).toBe('disabled');
  });

  test('throws when uninstalling non-existent plugin', async () => {
    const manager = new PluginManager(PLUGINS_DIR);
    await expect(manager.uninstall('non-existent')).rejects.toThrow('Plugin not registered');
  });

  test('throws when enabling non-existent plugin', async () => {
    const manager = new PluginManager(PLUGINS_DIR);
    await expect(manager.enable('non-existent')).rejects.toThrow('Plugin not registered');
  });
});
