import type { MCPClientPool } from './pool.js';
import type { MCPTool, MCPResource, MCPPrompt } from './types.js';

export interface ToolRegistryLike {
  register(definition: {
    name: string;
    description: string;
    category: string;
    inputSchema: unknown;
    execute: (input: Record<string, unknown>, context: unknown) => Promise<unknown>;
    timeout?: number;
  }): void;
}

export interface ResourceStoreLike {
  register(resource: MCPResource & { serverName: string; read: () => Promise<{ content: string; mimeType?: string }> }): void;
}

export interface PromptStoreLike {
  register(prompt: MCPPrompt & { serverName: string; get: (args?: Record<string, string>) => Promise<{ messages: unknown[] }> }): void;
}

export async function registerMCPTools(pool: MCPClientPool, toolRegistry: ToolRegistryLike): Promise<void> {
  const tools = await pool.getAllTools();
  for (const tool of tools) {
    toolRegistry.register({
      name: `${tool.serverName}/${tool.name}`,
      description: tool.description,
      category: 'other',
      inputSchema: tool.inputSchema,
      execute: async (input: Record<string, unknown>) => {
        const result = await pool.callTool(tool.serverName, tool.name, input);
        return result as Record<string, unknown>;
      },
    });
  }
}

export async function registerMCPResources(pool: MCPClientPool, resourceStore: ResourceStoreLike): Promise<void> {
  const allTools = await pool.getAllTools();
  const serverNames = [...new Set(allTools.map((t) => t.serverName))];

  for (const serverName of serverNames) {
    const client = pool.getClient(serverName);
    if (!client) continue;

    const resources = await client.listResources();
    for (const resource of resources) {
      resourceStore.register({
        ...resource,
        serverName,
        read: () => client.readResource(resource.uri),
      });
    }
  }
}

export async function registerMCPPrompts(pool: MCPClientPool, promptStore: PromptStoreLike): Promise<void> {
  const allTools = await pool.getAllTools();
  const serverNames = [...new Set(allTools.map((t) => t.serverName))];

  for (const serverName of serverNames) {
    const client = pool.getClient(serverName);
    if (!client) continue;

    const prompts = await client.listPrompts();
    for (const prompt of prompts) {
      promptStore.register({
        ...prompt,
        serverName,
        get: (args) => client.getPrompt(prompt.name, args),
      });
    }
  }
}
