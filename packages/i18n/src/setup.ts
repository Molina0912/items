import type { I18nConfig, TranslationBundle } from './types.js';
import { loadAllBundles } from './loader.js';

export class I18n {
  private config: I18nConfig;
  private bundles: Map<string, TranslationBundle> = new Map();

  constructor(config: I18nConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    const loaded = await loadAllBundles(this.config.localesDir);
    for (const [locale, bundle] of Object.entries(loaded)) {
      this.bundles.set(locale, bundle);
    }
  }

  setLocale(locale: string): void {
    this.config.locale = locale;
  }

  getLocale(): string {
    return this.config.locale;
  }

  detectLocale(): string {
    const envLocale =
      process.env['LC_ALL'] ||
      process.env['LANG'] ||
      process.env['LANGUAGE'] ||
      this.config.fallbackLocale;
    const normalized = envLocale.split('.')[0].replace('_', '-');
    return normalized;
  }

  getBundle(locale?: string): TranslationBundle | undefined {
    return this.bundles.get(locale ?? this.config.locale);
  }

  getFallbackBundle(): TranslationBundle | undefined {
    return this.bundles.get(this.config.fallbackLocale);
  }

  getConfig(): I18nConfig {
    return { ...this.config };
  }
}
