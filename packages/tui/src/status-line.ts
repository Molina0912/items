import type { Theme, StatusLineData } from './types.js';

export class StatusLine {
  private theme: Theme;
  private data: StatusLineData;

  constructor(theme: Theme) {
    this.theme = theme;
    this.data = { model: '' };
  }

  render(data: StatusLineData): string {
    this.data = { ...data };
    const parts: string[] = [];
    if (data.model) {
      parts.push(`model: ${data.model}`);
    }
    if (data.tokens !== undefined) {
      parts.push(`tokens: ${data.tokens}`);
    }
    if (data.session) {
      parts.push(`session: ${data.session}`);
    }
    if (data.mode) {
      parts.push(`mode: ${data.mode}`);
    }
    return `[${parts.join(' | ')}]`;
  }

  update(data: Partial<StatusLineData>): string {
    this.data = { ...this.data, ...data };
    return this.render(this.data);
  }

  getData(): StatusLineData {
    return { ...this.data };
  }
}
