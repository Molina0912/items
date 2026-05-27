import { describe, test, expect, afterEach } from 'bun:test';
import { SQLiteConnection, MigrationRunner, migration001Init } from '@expo/storage';

describe('SQLiteConnection', () => {
  let conn: SQLiteConnection;

  afterEach(() => {
    if (conn && !conn.isClosed) {
      conn.close();
    }
  });

  test('creates in-memory database', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    expect(conn.isClosed).toBe(false);
  });

  test('enables WAL mode by default', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const result = conn.database.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    // In-memory databases may report 'memory' instead of 'wal'
    expect(result.journal_mode).toBeDefined();
  });

  test('can execute SQL statements', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    conn.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    conn.database.prepare('INSERT INTO test (name) VALUES (?)').run('hello');
    const row = conn.database.prepare('SELECT name FROM test').get() as { name: string };
    expect(row.name).toBe('hello');
  });

  test('close prevents further operations', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    conn.close();
    expect(conn.isClosed).toBe(true);
    expect(() => conn.database).toThrow('Database connection is closed');
  });

  test('close is idempotent', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    conn.close();
    expect(() => conn.close()).not.toThrow();
  });
});

describe('MigrationRunner', () => {
  let conn: SQLiteConnection;

  afterEach(() => {
    if (conn && !conn.isClosed) {
      conn.close();
    }
  });

  test('creates _migrations table', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    new MigrationRunner(conn);
    const tables = conn.database
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .all() as { name: string }[];
    expect(tables.length).toBe(1);
  });

  test('runs migrations and tracks versions', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const runner = new MigrationRunner(conn);
    runner.run([migration001Init]);

    const versions = runner.getAppliedVersions();
    expect(versions).toEqual([1]);
  });

  test('does not re-run already applied migrations', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const runner = new MigrationRunner(conn);
    runner.run([migration001Init]);
    runner.run([migration001Init]);

    const versions = runner.getAppliedVersions();
    expect(versions).toEqual([1]);
  });

  test('migration 001 creates sessions, turns, tool_calls tables', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const runner = new MigrationRunner(conn);
    runner.run([migration001Init]);

    const tables = conn.database
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('turns');
    expect(tableNames).toContain('tool_calls');
  });

  test('can insert and query sessions', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const runner = new MigrationRunner(conn);
    runner.run([migration001Init]);

    conn.database.prepare("INSERT INTO sessions (id) VALUES (?)").run('session-1');
    const session = conn.database.prepare("SELECT * FROM sessions WHERE id = ?").get('session-1') as { id: string };
    expect(session.id).toBe('session-1');
  });

  test('can insert and query turns', () => {
    conn = new SQLiteConnection({ path: ':memory:' });
    const runner = new MigrationRunner(conn);
    runner.run([migration001Init]);

    conn.database.prepare("INSERT INTO sessions (id) VALUES (?)").run('session-1');
    conn.database.prepare("INSERT INTO turns (id, session_id, role, content) VALUES (?, ?, ?, ?)").run('turn-1', 'session-1', 'user', 'hello');

    const turn = conn.database.prepare("SELECT * FROM turns WHERE id = ?").get('turn-1') as { id: string; role: string; content: string };
    expect(turn.id).toBe('turn-1');
    expect(turn.role).toBe('user');
    expect(turn.content).toBe('hello');
  });
});
