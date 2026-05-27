import type { Migration } from '../migrations.js';
import type { SQLiteConnection } from '../sqlite.js';

export const migration001Init: Migration = {
  version: 1,
  name: 'init',
  up(connection: SQLiteConnection): void {
    connection.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        metadata TEXT DEFAULT '{}'
      )
    `);

    connection.exec(`
      CREATE TABLE IF NOT EXISTS turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        tool_calls TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    connection.exec(`
      CREATE TABLE IF NOT EXISTS tool_calls (
        id TEXT PRIMARY KEY,
        turn_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        input TEXT DEFAULT '{}',
        output TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        started_at TEXT DEFAULT NULL,
        completed_at TEXT DEFAULT NULL,
        FOREIGN KEY (turn_id) REFERENCES turns(id)
      )
    `);

    connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_turns_session_id ON turns(session_id)
    `);

    connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_tool_calls_turn_id ON tool_calls(turn_id)
    `);
  },
};
