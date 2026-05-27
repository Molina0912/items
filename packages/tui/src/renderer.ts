import type { Theme, OutputStyle } from './types.js';
import { DARK_THEME } from './themes.js';
import { formatMarkdown } from './output.js';

export interface RendererOptions {
  altScreen?: boolean;
  theme?: Theme;
}

export class Renderer {
  private theme: Theme;
  private altScreen: boolean;
  private active = false;

  constructor(options: RendererOptions = {}) {
    this.theme = options.theme ?? DARK_THEME;
    this.altScreen = options.altScreen ?? false;
  }

  render(content: string, style: OutputStyle = 'plain'): string {
    if (!this.active) {
      this.active = true;
    }
    switch (style) {
      case 'markdown':
        return formatMarkdown(content);
      case 'json':
        return content;
      case 'plain':
      default:
        return content;
    }
  }

  clear(): string {
    return '\x1b[2J\x1b[H';
  }

  dispose(): void {
    this.active = false;
  }

  getTheme(): Theme {
    return this.theme;
  }

  isActive(): boolean {
    return this.active;
  }
}
