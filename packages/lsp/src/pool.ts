import type { LSPServerConfig, Diagnostic } from './types.js';
import { LSPClient } from './client.js';
import type { LSPClientOptions } from './client.js';

export class LSPClientPool {
  private clients: Map<string, LSPClient> = new Map();
  private languageMap: Map<string, string> = new Map(); // language -> client name

  async addServer(config: LSPServerConfig, options?: LSPClientOptions): Promise<void> {
    const client = new LSPClient(config, options);
    await client.start();
    this.clients.set(config.name, client);
    this.languageMap.set(config.language, config.name);
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      // Remove language mapping
      for (const [lang, clientName] of this.languageMap) {
        if (clientName === name) {
          this.languageMap.delete(lang);
        }
      }
      await client.stop();
      this.clients.delete(name);
    }
  }

  getClientForLanguage(language: string): LSPClient | undefined {
    const clientName = this.languageMap.get(language);
    if (!clientName) return undefined;
    return this.clients.get(clientName);
  }

  getClient(name: string): LSPClient | undefined {
    return this.clients.get(name);
  }

  getAllDiagnostics(): Map<string, Diagnostic[]> {
    const allDiagnostics = new Map<string, Diagnostic[]>();
    for (const client of this.clients.values()) {
      if (client.getState() === 'ready') {
        const clientDiagnostics = client.getAllDiagnostics();
        for (const [uri, diagnostics] of clientDiagnostics) {
          const existing = allDiagnostics.get(uri) ?? [];
          allDiagnostics.set(uri, [...existing, ...diagnostics]);
        }
      }
    }
    return allDiagnostics;
  }

  async startAll(): Promise<void> {
    // All clients are started when added, this is a no-op for already running clients
    // But useful for restarting stopped clients
  }

  async stopAll(): Promise<void> {
    const stops = Array.from(this.clients.values()).map((client) =>
      client.stop()
    );
    await Promise.all(stops);
    this.clients.clear();
    this.languageMap.clear();
  }

  getClients(): LSPClient[] {
    return Array.from(this.clients.values());
  }
}
