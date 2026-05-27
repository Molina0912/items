import type { TranslationBundle } from './types.js';

function resolveKey(bundle: TranslationBundle, key: string): string | undefined {
  const parts = key.split('.');
  let current: any = bundle;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

export type TranslatorFn = {
  (key: string, params?: Record<string, string | number>): string;
  plural: (key: string, count: number, params?: Record<string, string | number>) => string;
};

export function createTranslator(
  bundle: TranslationBundle,
  fallbackBundle?: TranslationBundle
): TranslatorFn {
  function t(key: string, params?: Record<string, string | number>): string {
    let value = resolveKey(bundle, key);
    if (value === undefined && fallbackBundle) {
      value = resolveKey(fallbackBundle, key);
    }
    if (value === undefined) {
      return key;
    }
    if (params) {
      return interpolate(value, params);
    }
    return value;
  }

  t.plural = function tPlural(
    key: string,
    count: number,
    params?: Record<string, string | number>
  ): string {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
    const allParams = { ...params, count };
    return t(pluralKey, allParams);
  };

  return t as TranslatorFn;
}
