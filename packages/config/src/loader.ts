import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { ExpoConfigSchema, type ExpoConfig } from './schema.js';
import { deepMerge } from './merge.js';
import { discoverWellKnown } from './well-known.js';

export interface LoadOptions {
  projectRoot?: string;
  configPath?: string;
}

function loadJsonFile(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadGlobalConfig(): Record<string, unknown> {
  const globalPath = join(homedir(), '.expo', 'config.json');
  return loadJsonFile(globalPath) ?? {};
}

function loadProjectConfig(projectRoot: string): Record<string, unknown> {
  const projectPath = join(projectRoot, '.expo', 'config.json');
  return loadJsonFile(projectPath) ?? {};
}

function loadEnvConfig(): Record<string, unknown> {
  const env: Record<string, unknown> = {};

  if (process.env.EXPO_MODEL) {
    env.model = { ...((env.model as Record<string, unknown>) ?? {}), name: process.env.EXPO_MODEL };
  }

  if (process.env.EXPO_MODEL_PROVIDER) {
    env.model = { ...((env.model as Record<string, unknown>) ?? {}), provider: process.env.EXPO_MODEL_PROVIDER };
  }

  if (process.env.EXPO_MODEL_TEMPERATURE) {
    const temp = parseFloat(process.env.EXPO_MODEL_TEMPERATURE);
    if (!isNaN(temp)) {
      env.model = { ...((env.model as Record<string, unknown>) ?? {}), temperature: temp };
    }
  }

  if (process.env.EXPO_MODEL_MAX_TOKENS) {
    const tokens = parseInt(process.env.EXPO_MODEL_MAX_TOKENS, 10);
    if (!isNaN(tokens)) {
      env.model = { ...((env.model as Record<string, unknown>) ?? {}), maxTokens: tokens };
    }
  }

  if (process.env.EXPO_PERMISSIONS_MODE) {
    env.permissions = { mode: process.env.EXPO_PERMISSIONS_MODE };
  }

  if (process.env.EXPO_TELEMETRY_ENABLED) {
    env.telemetry = { enabled: process.env.EXPO_TELEMETRY_ENABLED === 'true' };
  }

  if (process.env.EXPO_LOCALE) {
    env.i18n = { locale: process.env.EXPO_LOCALE };
  }

  if (process.env.EXPO_SANDBOX_MODE) {
    env.sandbox = { mode: process.env.EXPO_SANDBOX_MODE };
  }

  return env;
}

export function loadConfig(options: LoadOptions = {}): ExpoConfig {
  const projectRoot = options.projectRoot ?? process.cwd();

  let merged: Record<string, unknown> = {};

  // Load in precedence order: global < well-known < project < env
  const globalConfig = loadGlobalConfig();
  merged = deepMerge(merged, globalConfig);

  const wellKnownConfig = discoverWellKnown(projectRoot);
  if (wellKnownConfig) {
    merged = deepMerge(merged, wellKnownConfig);
  }

  if (options.configPath) {
    const customConfig = loadJsonFile(options.configPath);
    if (customConfig) {
      merged = deepMerge(merged, customConfig);
    }
  } else {
    const projectConfig = loadProjectConfig(projectRoot);
    merged = deepMerge(merged, projectConfig);
  }

  const envConfig = loadEnvConfig();
  merged = deepMerge(merged, envConfig);

  return ExpoConfigSchema.parse(merged);
}
