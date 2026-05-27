import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { TranslationBundle } from './types.js';

export function loadBundle(locale: string, dir: string): TranslationBundle | null {
  const filePath = join(dir, `${locale}.json`);
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as TranslationBundle;
}

export async function loadAllBundles(dir: string): Promise<Record<string, TranslationBundle>> {
  const result: Record<string, TranslationBundle> = {};
  if (!existsSync(dir)) {
    return result;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const locale = basename(file, '.json');
    const bundle = loadBundle(locale, dir);
    if (bundle) {
      result[locale] = bundle;
    }
  }
  return result;
}
