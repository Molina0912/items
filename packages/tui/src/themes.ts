import type { Theme } from './types.js';

export const DARK_THEME: Theme = {
  name: 'dark',
  colors: {
    primary: '#7c3aed',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    error: '#ef4444',
    warning: '#f97316',
    success: '#22c55e',
    muted: '#6b7280',
    background: '#1e1e2e',
    foreground: '#e2e8f0',
    border: '#374151',
  },
};

export const LIGHT_THEME: Theme = {
  name: 'light',
  colors: {
    primary: '#6d28d9',
    secondary: '#0891b2',
    accent: '#d97706',
    error: '#dc2626',
    warning: '#ea580c',
    success: '#16a34a',
    muted: '#9ca3af',
    background: '#ffffff',
    foreground: '#1f2937',
    border: '#d1d5db',
  },
};

const themes: Record<string, Theme> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};

export function getTheme(name: string): Theme | undefined {
  return themes[name];
}

export function listThemes(): string[] {
  return Object.keys(themes);
}
