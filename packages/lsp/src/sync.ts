import type { LSPClientPool } from './pool.js';

interface TrackedFile {
  uri: string;
  languageId: string;
  version: number;
  content: string;
}

export class DocumentSyncManager {
  private trackedFiles: Map<string, TrackedFile> = new Map();
  private pool: LSPClientPool;

  constructor(pool: LSPClientPool) {
    this.pool = pool;
  }

  async trackFile(uri: string, languageId: string, content: string): Promise<void> {
    const version = 1;
    this.trackedFiles.set(uri, { uri, languageId, version, content });

    const client = this.pool.getClientForLanguage(languageId);
    if (client && client.getState() === 'ready') {
      await client.textDocumentDidOpen(uri, languageId, version, content);
    }
  }

  async updateFile(uri: string, content: string): Promise<void> {
    const tracked = this.trackedFiles.get(uri);
    if (!tracked) return;

    tracked.version++;
    tracked.content = content;

    const client = this.pool.getClientForLanguage(tracked.languageId);
    if (client && client.getState() === 'ready') {
      await client.textDocumentDidChange(uri, tracked.version, [{ text: content }]);
    }
  }

  async closeFile(uri: string): Promise<void> {
    const tracked = this.trackedFiles.get(uri);
    if (!tracked) return;

    const client = this.pool.getClientForLanguage(tracked.languageId);
    if (client && client.getState() === 'ready') {
      await client.textDocumentDidClose(uri);
    }

    this.trackedFiles.delete(uri);
  }

  getTrackedFiles(): string[] {
    return Array.from(this.trackedFiles.keys());
  }
}
