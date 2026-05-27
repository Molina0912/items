import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PluginResolver } from '@expo/plugins';

const TEST_DIR = join(import.meta.dir, '.tmp-resolver');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('PluginResolver', () => {
  const resolver = new PluginResolver();

  describe('resolveFromNpm', () => {
    test('constructs npm registry URL for scoped package', () => {
      const result = resolver.resolveFromNpm('@expo/plugin-git');
      expect(result.type).toBe('npm');
      expect(result.source).toBe('@expo/plugin-git');
      expect(result.url).toBe('https://registry.npmjs.org/@expo/plugin-git');
    });

    test('constructs npm registry URL for unscoped package', () => {
      const result = resolver.resolveFromNpm('expo-plugin-docker');
      expect(result.type).toBe('npm');
      expect(result.source).toBe('expo-plugin-docker');
      expect(result.url).toBe('https://registry.npmjs.org/expo-plugin-docker');
    });
  });

  describe('resolveFromLocal', () => {
    test('resolves existing local path', () => {
      const result = resolver.resolveFromLocal(TEST_DIR);
      expect(result.type).toBe('local');
      expect(result.url).toContain('.tmp-resolver');
    });

    test('throws for non-existent path', () => {
      expect(() => resolver.resolveFromLocal('/does/not/exist/plugin')).toThrow(
        'Local plugin path does not exist'
      );
    });
  });

  describe('resolveFromGit', () => {
    test('resolves HTTPS git URL', () => {
      const url = 'https://github.com/expo/plugin-example.git';
      const result = resolver.resolveFromGit(url);
      expect(result.type).toBe('git');
      expect(result.url).toBe(url);
    });

    test('resolves SSH git URL', () => {
      const url = 'git@github.com:expo/plugin-example.git';
      const result = resolver.resolveFromGit(url);
      expect(result.type).toBe('git');
      expect(result.url).toBe(url);
    });

    test('resolves git protocol URL', () => {
      const url = 'git://github.com/expo/plugin-example.git';
      const result = resolver.resolveFromGit(url);
      expect(result.type).toBe('git');
      expect(result.url).toBe(url);
    });

    test('throws for invalid git URL', () => {
      expect(() => resolver.resolveFromGit('not-a-valid-url')).toThrow('Invalid git URL');
    });
  });

  describe('resolve (auto-detect)', () => {
    test('detects local path starting with ./', () => {
      // Use the existing test dir
      const result = resolver.resolve(TEST_DIR);
      expect(result.type).toBe('local');
    });

    test('detects git URL with https', () => {
      const result = resolver.resolve('https://github.com/expo/plugin.git');
      expect(result.type).toBe('git');
    });

    test('detects git URL with git@', () => {
      const result = resolver.resolve('git@github.com:expo/plugin.git');
      expect(result.type).toBe('git');
    });

    test('defaults to npm for package names', () => {
      const result = resolver.resolve('@expo/plugin-git');
      expect(result.type).toBe('npm');
    });

    test('defaults to npm for simple names', () => {
      const result = resolver.resolve('my-plugin');
      expect(result.type).toBe('npm');
    });
  });
});
