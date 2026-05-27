import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  path: z.string().describe('Path to the file to read'),
  startLine: z.number().optional().describe('Start line (1-indexed)'),
  endLine: z.number().optional().describe('End line (1-indexed, inclusive)'),
});

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read file contents with optional line range',
  category: 'filesystem',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const filePath = resolve(context.workingDir, parsed.path);

    // Check FS guard if available
    if (context.guards?.fs && !context.guards.fs.canRead(filePath)) {
      throw new Error(`Read access denied: ${filePath}`);
    }

    const rawContent = readFileSync(filePath, 'utf-8');
    const lines = rawContent.split('\n');
    const totalLines = lines.length;

    let content: string;
    if (parsed.startLine !== undefined || parsed.endLine !== undefined) {
      const start = (parsed.startLine ?? 1) - 1;
      const end = parsed.endLine ?? totalLines;
      content = lines.slice(start, end).join('\n');
    } else {
      content = rawContent;
    }

    return { content, totalLines };
  },
};
