import { MCPError, ErrorCode } from '@expo/core';
import type { MCPServerConfig, MCPTool } from './types.js';
import { MCPClient } from './client.js';
import type { MCPClientOptions } from './client.js';

export interface MCPPoolAddOptions {
  clientOptions?: MCPClientOptions;
}

export class MCPClientPool {
  private clients: Map<string, MCPClient> = new Map();

  async addServer(config: MCPServerConfig, options?: MCPPoolAddOptions): Promise<void> {
    const client = new MCPClient(config, options?.clientOptions);
    await client.connect();
    this.clients.set(config.name, client);
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  async getAllTools(): Promise<Array<MCPTool & { serverName: string }>> {
    const tools: Array<MCPTool & { serverName: string }> = [];
    for (const [serverName, client] of this.clients) {
      if (client.getState() === 'ready') {
        const serverTools = await client.listTools();
        for (const tool of serverTools) {
          tools.push({ ...tool, serverName });
        }
      }
    }
    return tools;
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new MCPError(
        `MCP server not found: ${serverName}`,
        ErrorCode.MCP_CONNECTION_FAILED,
        { serverName }
      );
    }
    return client.callTool(toolName, args);
  }

  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const [name, client] of this.clients) {
      results.set(name, client.getState() === 'ready');
    }
    return results;
  }

  async disconnectAll(): Promise<void> {
    const disconnections = Array.from(this.clients.values()).map((client) =>
      client.disconnect()
    );
    await Promise.all(disconnections);
    this.clients.clear();
  }
}
