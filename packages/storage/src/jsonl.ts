import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';

export class JsonlLog<T> {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  append(entry: T): void {
    const line = JSON.stringify(entry) + '\n';
    appendFileSync(this.path, line, 'utf-8');
  }

  replay(filter?: (entry: T) => boolean): T[] {
    if (!existsSync(this.path)) {
      return [];
    }

    const content = readFileSync(this.path, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const entries = lines.map((line) => JSON.parse(line) as T);

    if (filter) {
      return entries.filter(filter);
    }

    return entries;
  }

  rotate(maxLines: number): void {
    if (!existsSync(this.path)) {
      return;
    }

    const content = readFileSync(this.path, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length <= maxLines) {
      return;
    }

    const kept = lines.slice(lines.length - maxLines);
    writeFileSync(this.path, kept.join('\n') + '\n', 'utf-8');
  }
}
