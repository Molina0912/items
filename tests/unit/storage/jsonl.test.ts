import { describe, test, expect, afterEach } from 'bun:test';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonlLog } from '@expo/storage';

describe('JsonlLog', () => {
  const testFiles: string[] = [];

  function tempFile(): string {
    const path = join(tmpdir(), `jsonl-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
    testFiles.push(path);
    return path;
  }

  afterEach(() => {
    for (const f of testFiles) {
      if (existsSync(f)) {
        unlinkSync(f);
      }
    }
    testFiles.length = 0;
  });

  test('append writes entries', () => {
    const path = tempFile();
    const log = new JsonlLog<{ msg: string }>(path);

    log.append({ msg: 'hello' });
    log.append({ msg: 'world' });

    const entries = log.replay();
    expect(entries).toEqual([{ msg: 'hello' }, { msg: 'world' }]);
  });

  test('replay returns empty array for non-existent file', () => {
    const log = new JsonlLog<{ msg: string }>('/tmp/nonexistent-file-abc123.jsonl');
    const entries = log.replay();
    expect(entries).toEqual([]);
  });

  test('replay with filter returns matching entries', () => {
    const path = tempFile();
    const log = new JsonlLog<{ type: string; value: number }>(path);

    log.append({ type: 'a', value: 1 });
    log.append({ type: 'b', value: 2 });
    log.append({ type: 'a', value: 3 });

    const filtered = log.replay((entry) => entry.type === 'a');
    expect(filtered).toEqual([
      { type: 'a', value: 1 },
      { type: 'a', value: 3 },
    ]);
  });

  test('rotate keeps only last N lines', () => {
    const path = tempFile();
    const log = new JsonlLog<{ n: number }>(path);

    log.append({ n: 1 });
    log.append({ n: 2 });
    log.append({ n: 3 });
    log.append({ n: 4 });
    log.append({ n: 5 });

    log.rotate(3);

    const entries = log.replay();
    expect(entries).toEqual([{ n: 3 }, { n: 4 }, { n: 5 }]);
  });

  test('rotate does nothing when under limit', () => {
    const path = tempFile();
    const log = new JsonlLog<{ n: number }>(path);

    log.append({ n: 1 });
    log.append({ n: 2 });

    log.rotate(5);

    const entries = log.replay();
    expect(entries).toEqual([{ n: 1 }, { n: 2 }]);
  });

  test('rotate handles non-existent file', () => {
    const log = new JsonlLog<{ n: number }>('/tmp/nonexistent-rotate-test.jsonl');
    expect(() => log.rotate(5)).not.toThrow();
  });
});
