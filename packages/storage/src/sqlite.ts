import { Database } from 'bun:sqlite';

export interface SQLiteOptions {
  path: string;
  walMode?: boolean;
}

export class SQLiteConnection {
  private db: Database;
  private closed = false;

  constructor(options: SQLiteOptions) {
    this.db = new Database(options.path);

    if (options.walMode !== false) {
      this.db.exec('PRAGMA journal_mode = WAL');
    }

    this.db.exec('PRAGMA busy_timeout = 5000');
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  get database(): Database {
    if (this.closed) {
      throw new Error('Database connection is closed');
    }
    return this.db;
  }

  exec(sql: string): void {
    this.database.exec(sql);
  }

  close(): void {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}
