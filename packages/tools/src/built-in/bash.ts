import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory for the command'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  shell: z.string().optional().describe('Shell to use (default: /bin/sh)'),
});

export const bashTool: ToolDefinition = {
  name: 'bash',
  description: 'Execute a shell command',
  category: 'shell',
  inputSchema,
  timeout: 60000,
  requiresPermission: true,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const cwd = parsed.cwd ?? context.workingDir;
    const shell = parsed.shell ?? '/bin/sh';

    // Check process guard if available
    if (context.guards?.process && !context.guards.process.canExecute(parsed.command)) {
      throw new Error(`Process execution denied: ${parsed.command}`);
    }

    const proc = Bun.spawn([shell, '-c', parsed.command], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return { stdout, stderr, exitCode };
  },
};
