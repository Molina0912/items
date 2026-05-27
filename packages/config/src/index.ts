export {
  ExpoConfigSchema,
  ModelConfigSchema,
  PermissionsConfigSchema,
  ToolsConfigSchema,
  AgentsConfigSchema,
  HooksConfigSchema,
  PluginsConfigSchema,
  MCPConfigSchema,
  LSPConfigSchema,
  ChannelsConfigSchema,
  TelemetryConfigSchema,
  SandboxConfigSchema,
  I18nConfigSchema,
} from './schema.js';

export type {
  ExpoConfig,
  ModelConfig,
  PermissionsConfig,
  ToolsConfig,
  AgentsConfig,
  HooksConfig,
  PluginsConfig,
  MCPConfig,
  LSPConfig,
  ChannelsConfig,
  TelemetryConfig,
  SandboxConfig,
  I18nConfig,
} from './schema.js';

export { loadConfig } from './loader.js';
export type { LoadOptions } from './loader.js';

export { deepMerge, mergeConfigs } from './merge.js';

export { discoverWellKnown } from './well-known.js';
