import type { PermissionDecision, PermissionQuery } from './types.js';
import type { SQLiteConnection } from '@expo/storage';

interface StoredDecision {
  scope: string;
  resource: string;
  action: string;
  remember: string;
  sessionId: string;
  createdAt: string;
}

/**
 * PermissionStore persists permission decisions using SQLite storage.
 */
export class PermissionStore {
  private storage: SQLiteConnection;

  constructor(storage: SQLiteConnection) {
    this.storage = storage;
    this.initialize();
  }

  private initialize(): void {
    this.storage.exec(`
      CREATE TABLE IF NOT EXISTS permission_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        remember TEXT NOT NULL,
        session_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(scope, resource, session_id, remember)
      )
    `);
  }

  /**
   * Save a permission decision.
   */
  save(query: PermissionQuery, decision: PermissionDecision): void {
    const db = this.storage.database;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO permission_decisions (scope, resource, action, remember, session_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(query.scope, query.resource, decision.action, decision.remember, query.context.sessionId);
  }

  /**
   * Load a previously saved decision for the given query.
   * Checks permanent decisions first, then session decisions.
   */
  load(query: PermissionQuery): PermissionDecision | null {
    const db = this.storage.database;

    // Check permanent decisions first
    const permanent = db.prepare(`
      SELECT action, remember FROM permission_decisions
      WHERE scope = ? AND resource = ? AND remember = 'permanent'
      ORDER BY created_at DESC LIMIT 1
    `).get(query.scope, query.resource) as StoredDecision | null;

    if (permanent) {
      return { action: permanent.action as PermissionDecision['action'], remember: 'permanent' };
    }

    // Check session decisions
    const session = db.prepare(`
      SELECT action, remember FROM permission_decisions
      WHERE scope = ? AND resource = ? AND session_id = ? AND remember = 'session'
      ORDER BY created_at DESC LIMIT 1
    `).get(query.scope, query.resource, query.context.sessionId) as StoredDecision | null;

    if (session) {
      return { action: session.action as PermissionDecision['action'], remember: 'session' };
    }

    return null;
  }

  /**
   * Clear saved decisions, optionally filtered by scope.
   */
  clear(scope?: string): void {
    const db = this.storage.database;
    if (scope) {
      db.prepare('DELETE FROM permission_decisions WHERE scope = ?').run(scope);
    } else {
      this.storage.exec('DELETE FROM permission_decisions');
    }
  }

  /**
   * Get all decisions for a session.
   */
  getSessionDecisions(sessionId: string): PermissionDecision[] {
    const db = this.storage.database;
    const rows = db.prepare(`
      SELECT action, remember FROM permission_decisions
      WHERE session_id = ? AND remember = 'session'
    `).all(sessionId) as StoredDecision[];

    return rows.map((row) => ({
      action: row.action as PermissionDecision['action'],
      remember: 'session' as const,
    }));
  }

  /**
   * Get all permanent decisions.
   */
  getPermanentDecisions(): PermissionDecision[] {
    const db = this.storage.database;
    const rows = db.prepare(`
      SELECT action, remember FROM permission_decisions
      WHERE remember = 'permanent'
    `).all() as StoredDecision[];

    return rows.map((row) => ({
      action: row.action as PermissionDecision['action'],
      remember: 'permanent' as const,
    }));
  }
}
