import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const MAX_DEPTH = 10;
const INCLUDE_PATTERN = /@([\w./_-]+\.md)/g;

export function expandIncludes(content: string, basePath: string, visited?: Set<string>, depth?: number): string {
  const currentDepth = depth ?? 0;
  const currentVisited = visited ?? new Set<string>();

  if (currentDepth > MAX_DEPTH) {
    throw new Error(`Max include depth of ${MAX_DEPTH} exceeded`);
  }

  const resolvedBase = resolve(basePath);
  currentVisited.add(resolvedBase);

  return content.replace(INCLUDE_PATTERN, (match, filePath: string) => {
    const resolvedPath = resolve(dirname(resolvedBase), filePath);

    if (currentVisited.has(resolvedPath)) {
      const cycle = [...currentVisited, resolvedPath].join(' -> ');
      throw new Error(`Circular include detected: ${cycle}`);
    }

    let fileContent: string;
    try {
      fileContent = readFileSync(resolvedPath, 'utf-8');
    } catch {
      return match; // Leave unresolved if file not found
    }

    const newVisited = new Set(currentVisited);
    return expandIncludes(fileContent, resolvedPath, newVisited, currentDepth + 1);
  });
}
