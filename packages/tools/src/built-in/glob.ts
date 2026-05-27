import { z } from 'zod';
import { resolve } from 'node:path';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files'),
  cwd: z.string().optional().describe('Working directory for the glob'),
  ignore: z.array(z.string()).optional().describe('Patterns to ignore'),
});

export const globTool: ToolDefinition = {
  name: 'glob',
  description: 'Find files matching a glob pattern',
  category: 'search',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const cwd = resolve(context.workingDir, parsed.cwd ?? '.');

    // Check FS guard for read access on the base path
    if (context.guards?.fs && !context.guards.fs.canRead(cwd)) {
      throw new Error(`Read access denied: ${cwd}`);
    }

    const glob = new Bun.Glob(parsed.pattern);
    const files: string[] = [];

    for await (const file of glob.scan({ cwd, dot: false })) {
      if (parsed.ignore?.some((ig) => file.includes(ig))) {
        continue;
      }
      files.push(file);
    }

    files.sort();
    return { files };
  },
};
