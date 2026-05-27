import { describe, test, expect } from 'bun:test';
import { createTranslator } from '@expo/i18n';
import type { TranslationBundle } from '@expo/i18n';

const enBundle: TranslationBundle = {
  "common": {
    "yes": "Yes",
    "no": "No",
    "cancel": "Cancel"
  },
  "errors": {
    "generic": "An unexpected error occurred",
    "validation": "Validation failed: {{field}}"
  },
  "cli": {
    "welcome": "Welcome to Expo CLI",
    "version": "Version {{version}}"
  },
  "item_one": "{{count}} item",
  "item_other": "{{count}} items",
  "greeting": "Hello, {{name}}!"
};

const esBundle: TranslationBundle = {
  "common": {
    "yes": "Si",
    "no": "No",
    "cancel": "Cancelar"
  },
  "errors": {
    "generic": "Ocurrio un error inesperado",
    "validation": "Error de validacion: {{field}}"
  },
  "cli": {
    "welcome": "Bienvenido a Expo CLI",
    "version": "Version {{version}}"
  },
  "item_one": "{{count}} elemento",
  "item_other": "{{count}} elementos",
  "greeting": "Hola, {{name}}!"
};

describe('createTranslator', () => {
  test('resolves simple keys', () => {
    const t = createTranslator(enBundle);
    expect(t('greeting')).toBe('Hello, {{name}}!');
  });

  test('resolves dot-notation nested keys', () => {
    const t = createTranslator(enBundle);
    expect(t('common.yes')).toBe('Yes');
    expect(t('cli.welcome')).toBe('Welcome to Expo CLI');
  });

  test('interpolates parameters', () => {
    const t = createTranslator(enBundle);
    expect(t('greeting', { name: 'World' })).toBe('Hello, World!');
    expect(t('cli.version', { version: '1.0.0' })).toBe('Version 1.0.0');
  });

  test('interpolates with nested key', () => {
    const t = createTranslator(enBundle);
    expect(t('errors.validation', { field: 'email' })).toBe('Validation failed: email');
  });

  test('returns key when not found', () => {
    const t = createTranslator(enBundle);
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('falls back to fallback bundle', () => {
    const emptyBundle: TranslationBundle = {};
    const t = createTranslator(emptyBundle, enBundle);
    expect(t('common.yes')).toBe('Yes');
  });

  test('pluralization with count=1', () => {
    const t = createTranslator(enBundle);
    expect(t.plural('item', 1)).toBe('1 item');
  });

  test('pluralization with count>1', () => {
    const t = createTranslator(enBundle);
    expect(t.plural('item', 5)).toBe('5 items');
  });

  test('works with Spanish bundle', () => {
    const t = createTranslator(esBundle);
    expect(t('common.cancel')).toBe('Cancelar');
    expect(t('greeting', { name: 'Mundo' })).toBe('Hola, Mundo!');
  });

  test('Spanish pluralization', () => {
    const t = createTranslator(esBundle);
    expect(t.plural('item', 1)).toBe('1 elemento');
    expect(t.plural('item', 3)).toBe('3 elementos');
  });
});
