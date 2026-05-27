const BOLD = '\x1b[1m';
const ITALIC = '\x1b[3m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

export function formatMarkdown(text: string): string {
  let result = text;
  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, `${BOLD}$1${RESET}`);
  // Italic: *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, `${ITALIC}$1${RESET}`);
  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, `${CYAN}$1${RESET}`);
  // Lists: - item
  result = result.replace(/^- (.+)$/gm, `  ${DIM}-${RESET} $1`);
  return result;
}

export function formatCodeBlock(code: string, language?: string): string {
  const header = language ? `${DIM}--- ${language} ---${RESET}\n` : '';
  return `${header}${code}`;
}

export function formatDiff(diff: string): string {
  return diff
    .split('\n')
    .map((line) => {
      if (line.startsWith('+')) {
        return `${GREEN}${line}${RESET}`;
      }
      if (line.startsWith('-')) {
        return `${RED}${line}${RESET}`;
      }
      return line;
    })
    .join('\n');
}

export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
  const separator = colWidths.map((w) => '-'.repeat(w)).join('-+-');
  const dataLines = rows.map((row) =>
    row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ')
  );

  return [headerLine, separator, ...dataLines].join('\n');
}
