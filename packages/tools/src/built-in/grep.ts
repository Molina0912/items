import { z } from 'zod';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  pattern: z.string().describe('Regex pattern to search for'),
  path: z.string().describe('File or directory path to search'),
  contextLines: z.number().optional().describe('Number of context lines around matches'),
  maxResults: z.number().optional().describe('Maximum number of results to return'),
});

interface GrepMatch {
  file: string;
  line: number;
  content: string;
  context: string[];
}

function searchFile(
  filePath: string,
  regex: RegExp,
  contextLines: number,
  maxResults: number,
  matches: GrepMatch[]
): void {
  if (matches.length >= maxResults) return;

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (matches.length >= maxResults) break;
    if (regex.test(lines[i])) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length - 1, i + contextLines);
      const context = lines.slice(start, end + 1);
      matches.push({
        file: filePath,
        line: i + 1,
        content: lines[i],
        context,
      });
    }
  }
}

function searchDir(
  dirPath: string,
  regex: RegExp,
  contextLines: number,
  maxResults: number,
  matches: GrepMatch[]
): void {
  if (matches.length >= maxResults) return;

  let entries: string[];
  try {
    entries = readdirSync(dirPath);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (matches.length >= maxResults) break;
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') continue;
    const fullPath = join(dirPath, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      searchDir(fullPath, regex, contextLines, maxResults, matches);
    } else if (stat.isFile()) {
      searchFile(fullPath, regex, contextLines, maxResults, matches);
    }
  }
}

export const grepTool: ToolDefinition = {
  name: 'grep',
  description: 'Search file contents with regex pattern',
  category: 'search',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const searchPath = resolve(context.workingDir, parsed.path);
    const contextLines = parsed.contextLines ?? 2;
    const maxResults = parsed.maxResults ?? 100;
    const regex = new RegExp(parsed.pattern, 'g');

    // Check FS guard for read access on the search path
    if (context.guards?.fs && !context.guards.fs.canRead(searchPath)) {
      throw new Error(`Read access denied: ${searchPath}`);
    }

    const matches: GrepMatch[] = [];

    let stat;
    try {
      stat = statSync(searchPath);
    } catch {
      return { matches: [] };
    }

    if (stat.isFile()) {
      searchFile(searchPath, regex, contextLines, maxResults, matches);
    } else if (stat.isDirectory()) {
      searchDir(searchPath, regex, contextLines, maxResults, matches);
    }

    return { matches };
  },
};
