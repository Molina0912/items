import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  url: z.string().describe('URL to fetch'),
  method: z.string().optional().describe('HTTP method (default: GET)'),
  headers: z.record(z.string()).optional().describe('Request headers'),
  body: z.string().optional().describe('Request body'),
});

export const fetchTool: ToolDefinition = {
  name: 'fetch',
  description: 'Make an HTTP request',
  category: 'network',
  inputSchema,
  timeout: 30000,
  requiresPermission: true,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const method = parsed.method ?? 'GET';

    // Check network guard if available
    if (context.guards?.network) {
      const url = new URL(parsed.url);
      const port = url.port ? parseInt(url.port, 10) : undefined;
      if (!context.guards.network.canConnect(url.hostname, port)) {
        throw new Error(`Network access denied: ${url.hostname}${port ? ':' + port : ''}`);
      }
    }

    const response = await globalThis.fetch(parsed.url, {
      method,
      headers: parsed.headers,
      body: parsed.body,
      signal: context.abortSignal,
    });

    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      headers,
      body,
    };
  },
};
