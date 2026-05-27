import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  path: z.string().describe('Path to the file to write'),
  content: z.string().describe('Content to write to the file'),
  createDirs: z.boolean().optional().describe('Create parent directories if they do not exist'),
});

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file (create or overwrite)',
  category: 'filesystem',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const filePath = resolve(context.workingDir, parsed.path);

    // Check FS guard if available
    if (context.guards?.fs && !context.guards.fs.canWrite(filePath)) {
      throw new Error(`Write access denied: ${filePath}`);
    }

    if (parsed.createDirs) {
      mkdirSync(dirname(filePath), { recursive: true });
    }

    writeFileSync(filePath, parsed.content, 'utf-8');
    const bytesWritten = Buffer.byteLength(parsed.content, 'utf-8');

    return { path: filePath, bytesWritten };
  },
};
