import { z } from 'zod';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  path: z.string().describe('Directory path to list'),
  recursive: z.boolean().optional().describe('List recursively'),
  includeHidden: z.boolean().optional().describe('Include hidden files (starting with .)'),
});

interface DirEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  size: number;
  modified: string;
}

function listEntries(
  dirPath: string,
  recursive: boolean,
  includeHidden: boolean,
  prefix: string
): DirEntry[] {
  const entries: DirEntry[] = [];
  let names: string[];

  try {
    names = readdirSync(dirPath);
  } catch {
    return entries;
  }

  for (const name of names) {
    if (!includeHidden && name.startsWith('.')) continue;

    const fullPath = join(dirPath, name);
    const displayName = prefix ? join(prefix, name) : name;
    let stat;

    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    const type = stat.isDirectory()
      ? 'directory'
      : stat.isFile()
        ? 'file'
        : stat.isSymbolicLink()
          ? 'symlink'
          : 'other';

    entries.push({
      name: displayName,
      type,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });

    if (recursive && stat.isDirectory()) {
      entries.push(...listEntries(fullPath, true, includeHidden, displayName));
    }
  }

  return entries;
}

export const listDirTool: ToolDefinition = {
  name: 'list_dir',
  description: 'List directory contents with metadata',
  category: 'filesystem',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const dirPath = resolve(context.workingDir, parsed.path);
    const recursive = parsed.recursive ?? false;
    const includeHidden = parsed.includeHidden ?? false;

    // Check FS guard for read access on the target path
    if (context.guards?.fs && !context.guards.fs.canRead(dirPath)) {
      throw new Error(`Read access denied: ${dirPath}`);
    }

    const entries = listEntries(dirPath, recursive, includeHidden, '');

    return { entries };
  },
};
