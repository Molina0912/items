import { z } from 'zod';

export const ModelConfigSchema = z.object({
  provider: z.string().default('openai'),
  name: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4096),
});

export const PermissionRuleSchema = z.object({
  tool: z.string(),
  action: z.enum(['allow', 'deny', 'ask']),
  condition: z.string().optional(),
});

export const PermissionsConfigSchema = z.object({
  mode: z.enum(['strict', 'permissive', 'interactive']).default('interactive'),
  rules: z.array(PermissionRuleSchema).default([]),
});

export const CustomToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  command: z.string(),
  args: z.array(z.string()).default([]),
});

export const ToolsConfigSchema = z.object({
  enabled: z.array(z.string()).default([]),
  disabled: z.array(z.string()).default([]),
  custom: z.array(CustomToolSchema).default([]),
});

export const AgentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  tools: z.array(z.string()).default([]),
  maxTurns: z.number().positive().optional(),
});

export const AgentsConfigSchema = z.object({
  definitions: z.array(AgentDefinitionSchema).default([]),
});

export const HookHandlerSchema = z.object({
  event: z.string(),
  condition: z.string().optional(),
  handler: z.string(),
});

export const HooksConfigSchema = z.object({
  handlers: z.array(HookHandlerSchema).default([]),
});

export const PluginSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

export const PluginsConfigSchema = z.object({
  installed: z.array(PluginSchema).default([]),
});

export const MCPServerSchema = z.object({
  name: z.string(),
  url: z.string(),
  transport: z.enum(['stdio', 'sse', 'streamable-http']).default('stdio'),
  config: z.record(z.unknown()).optional(),
});

export const MCPConfigSchema = z.object({
  servers: z.array(MCPServerSchema).default([]),
});

export const LSPServerSchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export const LSPConfigSchema = z.object({
  servers: z.array(LSPServerSchema).default([]),
});

export const ChannelRouteSchema = z.object({
  name: z.string(),
  type: z.enum(['stdin', 'http', 'websocket', 'ipc']),
  config: z.record(z.unknown()).optional(),
});

export const ChannelsConfigSchema = z.object({
  routes: z.array(ChannelRouteSchema).default([]),
});

export const TelemetryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  endpoint: z.string().optional(),
});

export const SandboxConfigSchema = z.object({
  mode: z.enum(['none', 'process', 'container']).default('none'),
  rules: z.array(z.string()).default([]),
});

export const I18nConfigSchema = z.object({
  locale: z.string().default('en'),
  fallback: z.string().default('en'),
});

export const ExpoConfigSchema = z.object({
  model: ModelConfigSchema.default({}),
  permissions: PermissionsConfigSchema.default({}),
  tools: ToolsConfigSchema.default({}),
  agents: AgentsConfigSchema.default({}),
  hooks: HooksConfigSchema.default({}),
  plugins: PluginsConfigSchema.default({}),
  mcp: MCPConfigSchema.default({}),
  lsp: LSPConfigSchema.default({}),
  channels: ChannelsConfigSchema.default({}),
  telemetry: TelemetryConfigSchema.default({}),
  sandbox: SandboxConfigSchema.default({}),
  i18n: I18nConfigSchema.default({}),
});

export type ExpoConfig = z.infer<typeof ExpoConfigSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type PermissionsConfig = z.infer<typeof PermissionsConfigSchema>;
export type ToolsConfig = z.infer<typeof ToolsConfigSchema>;
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;
export type HooksConfig = z.infer<typeof HooksConfigSchema>;
export type PluginsConfig = z.infer<typeof PluginsConfigSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;
export type LSPConfig = z.infer<typeof LSPConfigSchema>;
export type ChannelsConfig = z.infer<typeof ChannelsConfigSchema>;
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;
export type SandboxConfig = z.infer<typeof SandboxConfigSchema>;
export type I18nConfig = z.infer<typeof I18nConfigSchema>;
