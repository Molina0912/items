import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { FileSecretStore } from '@expo/secrets';

const TEST_DIR = join(import.meta.dir, '.tmp-secrets');
const SECRETS_FILE = join(TEST_DIR, 'secrets.enc');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('FileSecretStore', () => {
  test('sets and gets a secret', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    store.set('my-service', 'api-key', 'secret-value-123');
    const result = store.get('my-service', 'api-key');
    expect(result).toBe('secret-value-123');
  });

  test('returns null for non-existent secret', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    const result = store.get('my-service', 'non-existent');
    expect(result).toBeNull();
  });

  test('overwrites existing secret', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    store.set('my-service', 'api-key', 'old-value');
    store.set('my-service', 'api-key', 'new-value');
    const result = store.get('my-service', 'api-key');
    expect(result).toBe('new-value');
  });

  test('deletes a secret', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    store.set('my-service', 'api-key', 'value');
    const deleted = store.delete('my-service', 'api-key');
    expect(deleted).toBe(true);
    const result = store.get('my-service', 'api-key');
    expect(result).toBeNull();
  });

  test('returns false when deleting non-existent secret', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    const result = store.delete('my-service', 'non-existent');
    expect(result).toBe(false);
  });

  test('lists all secrets', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    store.set('service-a', 'key1', 'val1');
    store.set('service-b', 'key2', 'val2');
    const entries = store.list();
    expect(entries).toHaveLength(2);
  });

  test('lists secrets filtered by service', () => {
    const store = new FileSecretStore(SECRETS_FILE);
    store.set('service-a', 'key1', 'val1');
    store.set('service-a', 'key2', 'val2');
    store.set('service-b', 'key3', 'val3');
    const entries = store.list('service-a');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.service === 'service-a')).toBe(true);
  });

  test('handles missing file gracefully', () => {
    const store = new FileSecretStore(join(TEST_DIR, 'nonexistent', 'secrets.enc'));
    const result = store.get('service', 'key');
    expect(result).toBeNull();
    const entries = store.list();
    expect(entries).toHaveLength(0);
  });

  test('persists across store instances', () => {
    const store1 = new FileSecretStore(SECRETS_FILE);
    store1.set('my-service', 'api-key', 'persisted-value');

    const store2 = new FileSecretStore(SECRETS_FILE);
    const result = store2.get('my-service', 'api-key');
    expect(result).toBe('persisted-value');
  });
});
