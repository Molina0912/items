import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function discoverWellKnown(projectRoot: string): Record<string, unknown> | null {
  const wellKnownPath = join(projectRoot, '.well-known', 'expo.json');

  if (!existsSync(wellKnownPath)) {
    return null;
  }

  try {
    const content = readFileSync(wellKnownPath, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}
