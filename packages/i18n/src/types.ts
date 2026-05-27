import { z } from 'zod';

export interface I18nConfig {
  locale: string;
  fallbackLocale: string;
  localesDir: string;
}

export type TranslationBundle = Record<string, string | Record<string, string>>;

export const I18nConfigSchema = z.object({
  locale: z.string(),
  fallbackLocale: z.string(),
  localesDir: z.string(),
});
