import { parseCondition, evaluateCondition } from '@expo/core';
import type { MemoryContext } from './types.js';

const CONDITIONAL_PATTERN = /<!--\s*if\(([^)]+)\)\s*-->([\s\S]*?)<!--\s*endif\s*-->/g;

export function evaluateConditionalBlocks(content: string, context: MemoryContext): string {
  const contextRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) {
      contextRecord[key] = value;
    }
  }

  return content.replace(CONDITIONAL_PATTERN, (_match, condition: string, blockContent: string) => {
    try {
      const { ast } = parseCondition(condition.trim());
      const result = evaluateCondition(ast, contextRecord);
      return result ? blockContent : '';
    } catch {
      // If condition fails to parse, remove the block
      return '';
    }
  });
}
