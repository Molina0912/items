export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  muted: string;
  background: string;
  foreground: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export type OutputStyle = 'markdown' | 'plain' | 'json';

export interface StatusLineData {
  model: string;
  tokens?: number;
  session?: string;
  mode?: string;
}
