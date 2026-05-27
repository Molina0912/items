import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { MemoryFile } from './types.js';

export interface Frontmatter {
  conditions?: string[];
  priority?: number;
}

export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const frontmatter: Frontmatter = {};

  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    // Check for key: value pattern
    const keyMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      // Save previous array key if any
      if (currentKey === 'conditions' && arrayValues.length > 0) {
        frontmatter.conditions = arrayValues;
        arrayValues = [];
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (currentKey === 'priority' && value) {
        frontmatter.priority = parseInt(value, 10);
        currentKey = null;
      } else if (currentKey === 'conditions' && value) {
        // Inline array: conditions: [a, b]
        const inlineMatch = value.match(/^\[(.*)\]$/);
        if (inlineMatch) {
          frontmatter.conditions = inlineMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          currentKey = null;
        }
      }
    } else if (currentKey === 'conditions' && trimmed.startsWith('- ')) {
      arrayValues.push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
    }
  }

  // Final flush
  if (currentKey === 'conditions' && arrayValues.length > 0) {
    frontmatter.conditions = arrayValues;
  }

  return { frontmatter, body };
}

export function parseMemoryFile(filePath: string, content: string): MemoryFile {
  const { frontmatter, body } = parseFrontmatter(content);
  return {
    path: filePath,
    content: body,
    conditions: frontmatter.conditions,
    priority: frontmatter.priority,
  };
}

export function loadMemoryFiles(dir: string): MemoryFile[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  const files: MemoryFile[] = [];

  for (const entry of entries) {
    if (extname(entry) !== '.md') continue;
    const filePath = join(dir, entry);
    const content = readFileSync(filePath, 'utf-8');
    files.push(parseMemoryFile(filePath, content));
  }

  return files;
}
