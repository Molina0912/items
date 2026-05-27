import { parseCondition, evaluateCondition } from '@expo/core';
import { loadMemoryFiles } from './loader.js';
import { expandIncludes } from './include.js';
import { evaluateConditionalBlocks } from './conditional.js';
import type { MemoryContext, MemoryFile } from './types.js';

function matchesConditions(conditions: string[], context: MemoryContext): boolean {
  const contextRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) {
      contextRecord[key] = value;
    }
  }

  return conditions.every(condition => {
    try {
      const { ast } = parseCondition(condition.trim());
      return evaluateCondition(ast, contextRecord);
    } catch {
      return false;
    }
  });
}

export function resolveMemory(dir: string, context: MemoryContext): string {
  // 1. Load all memory files
  const files = loadMemoryFiles(dir);

  // 2. Filter by file-level conditions
  const filtered = files.filter((file: MemoryFile) => {
    if (!file.conditions || file.conditions.length === 0) return true;
    return matchesConditions(file.conditions, context);
  });

  // 3. Expand @-includes
  const expanded = filtered.map((file: MemoryFile) => ({
    ...file,
    content: expandIncludes(file.content, file.path),
  }));

  // 4. Evaluate conditional blocks
  const resolved = expanded.map((file: MemoryFile) => ({
    ...file,
    content: evaluateConditionalBlocks(file.content, context),
  }));

  // 5. Sort by priority (higher priority first, undefined = 0)
  resolved.sort((a: MemoryFile, b: MemoryFile) => (b.priority ?? 0) - (a.priority ?? 0));

  // 6. Concatenate and return
  return resolved.map((f: MemoryFile) => f.content.trim()).filter(Boolean).join('\n\n');
}
