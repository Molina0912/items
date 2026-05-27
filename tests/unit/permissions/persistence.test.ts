import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { PermissionStore } from '@expo/permissions';
import type { PermissionQuery, PermissionDecision, PermissionContext } from '@expo/permissions';
import { SQLiteConnection } from '@expo/storage';
import { unlinkSync, existsSync } from 'fs';

const TEST_DB_PATH = '/tmp/test-permissions.db';

function makeContext(sessionId = 'session-1'): PermissionContext {
  return { sessionId, mode: 'interactive' };
}

function makeQuery(scope: string, resource: string, sessionId = 'session-1'): PermissionQuery {
  return { scope, resource, context: makeContext(sessionId) };
}

describe('PermissionStore', () => {
  let db: SQLiteConnection;
  let store: PermissionStore;

  beforeEach(() => {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    db = new SQLiteConnection({ path: TEST_DB_PATH });
    store = new PermissionStore(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  test('save and load a session decision', () => {
    const query = makeQuery('tool', 'bash');
    const decision: PermissionDecision = { action: 'allow', remember: 'session' };
    store.save(query, decision);

    const loaded = store.load(query);
    expect(loaded).toEqual(decision);
  });

  test('save and load a permanent decision', () => {
    const query = makeQuery('file', '/tmp/test.txt');
    const decision: PermissionDecision = { action: 'deny', remember: 'permanent' };
    store.save(query, decision);

    const loaded = store.load(query);
    expect(loaded).toEqual(decision);
  });

  test('permanent decisions override session decisions', () => {
    const query = makeQuery('tool', 'bash');
    store.save(query, { action: 'deny', remember: 'session' });
    store.save(query, { action: 'allow', remember: 'permanent' });

    const loaded = store.load(query);
    expect(loaded?.action).toBe('allow');
    expect(loaded?.remember).toBe('permanent');
  });

  test('session decisions are scoped to session', () => {
    const query1 = makeQuery('tool', 'bash', 'session-1');
    const query2 = makeQuery('tool', 'bash', 'session-2');

    store.save(query1, { action: 'allow', remember: 'session' });

    const loaded1 = store.load(query1);
    const loaded2 = store.load(query2);
    expect(loaded1).not.toBeNull();
    expect(loaded2).toBeNull();
  });

  test('load returns null for unknown query', () => {
    const query = makeQuery('tool', 'unknown');
    expect(store.load(query)).toBeNull();
  });

  test('clear removes all decisions', () => {
    store.save(makeQuery('tool', 'bash'), { action: 'allow', remember: 'permanent' });
    store.save(makeQuery('file', '/tmp/x'), { action: 'deny', remember: 'session' });

    store.clear();

    expect(store.load(makeQuery('tool', 'bash'))).toBeNull();
    expect(store.load(makeQuery('file', '/tmp/x'))).toBeNull();
  });

  test('clear with scope only removes matching scope', () => {
    store.save(makeQuery('tool', 'bash'), { action: 'allow', remember: 'permanent' });
    store.save(makeQuery('file', '/tmp/x'), { action: 'deny', remember: 'permanent' });

    store.clear('tool');

    expect(store.load(makeQuery('tool', 'bash'))).toBeNull();
    expect(store.load(makeQuery('file', '/tmp/x'))).not.toBeNull();
  });

  test('getSessionDecisions returns all decisions for a session', () => {
    store.save(makeQuery('tool', 'bash', 'sess-a'), { action: 'allow', remember: 'session' });
    store.save(makeQuery('file', '/tmp/x', 'sess-a'), { action: 'deny', remember: 'session' });
    store.save(makeQuery('tool', 'other', 'sess-b'), { action: 'allow', remember: 'session' });

    const decisions = store.getSessionDecisions('sess-a');
    expect(decisions).toHaveLength(2);
  });

  test('getPermanentDecisions returns all permanent decisions', () => {
    store.save(makeQuery('tool', 'bash'), { action: 'allow', remember: 'permanent' });
    store.save(makeQuery('file', '/x'), { action: 'deny', remember: 'permanent' });
    store.save(makeQuery('tool', 'other'), { action: 'allow', remember: 'session' });

    const decisions = store.getPermanentDecisions();
    expect(decisions).toHaveLength(2);
  });
});
