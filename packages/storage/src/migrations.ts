import type { SQLiteConnection } from './sqlite.js';

export interface Migration {
  version: number;
  name: string;
  up(connection: SQLiteConnection): void;
}

export class MigrationRunner {
  private connection: SQLiteConnection;

  constructor(connection: SQLiteConnection) {
    this.connection = connection;
    this.ensureMigrationsTable();
  }

  private ensureMigrationsTable(): void {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  getAppliedVersions(): number[] {
    const rows = this.connection.database
      .prepare('SELECT version FROM _migrations ORDER BY version ASC')
      .all() as { version: number }[];
    return rows.map((r) => r.version);
  }

  run(migrations: Migration[]): void {
    const applied = new Set(this.getAppliedVersions());
    const pending = migrations
      .filter((m) => !applied.has(m.version))
      .sort((a, b) => a.version - b.version);

    for (const migration of pending) {
      this.connection.database.transaction(() => {
        migration.up(this.connection);
        this.connection.database
          .prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name);
      })();
    }
  }
}
