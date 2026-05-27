import type { Diagnostic, DiagnosticSeverity } from './types.js';
import type { LSPClientPool } from './pool.js';

export class DiagnosticCollector {
  async collectForFile(uri: string, pool: LSPClientPool): Promise<Diagnostic[]> {
    const clients = pool.getClients();
    const diagnostics: Diagnostic[] = [];

    for (const client of clients) {
      if (client.getState() === 'ready') {
        const clientDiagnostics = client.getDiagnostics(uri);
        diagnostics.push(...clientDiagnostics);
      }
    }

    return diagnostics;
  }

  async collectAll(pool: LSPClientPool): Promise<Map<string, Diagnostic[]>> {
    return pool.getAllDiagnostics();
  }

  formatForAgent(diagnostics: Diagnostic[]): string {
    if (diagnostics.length === 0) {
      return 'No diagnostics found.';
    }

    const lines: string[] = [];
    for (const diag of diagnostics) {
      const severity = severityToString(diag.severity);
      const location = `${diag.range.start.line + 1}:${diag.range.start.character + 1}`;
      const source = diag.source ? ` [${diag.source}]` : '';
      const code = diag.code !== undefined ? ` (${diag.code})` : '';
      lines.push(`${severity} at ${location}${source}${code}: ${diag.message}`);
    }

    return lines.join('\n');
  }

  filterBySeverity(diagnostics: Diagnostic[], minSeverity: DiagnosticSeverity): Diagnostic[] {
    // Lower number = higher severity (Error=1, Warning=2, Info=3, Hint=4)
    return diagnostics.filter((d) => d.severity <= minSeverity);
  }
}

function severityToString(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 1:
      return 'ERROR';
    case 2:
      return 'WARNING';
    case 3:
      return 'INFO';
    case 4:
      return 'HINT';
    default:
      return 'UNKNOWN';
  }
}
