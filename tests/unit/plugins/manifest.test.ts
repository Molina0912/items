import { describe, test, expect } from 'bun:test';
import { validateManifest, checkCompatibility } from '@expo/plugins';

describe('validateManifest', () => {
  test('accepts a valid manifest with all required fields', () => {
    const data = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
    };
    const result = validateManifest(data);
    expect(result.name).toBe('test-plugin');
    expect(result.version).toBe('1.0.0');
    expect(result.description).toBe('A test plugin');
    expect(result.main).toBe('./dist/index.js');
  });

  test('accepts a valid manifest with optional fields', () => {
    const data = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
      author: 'Test Author',
      license: 'MIT',
      capabilities: ['tools', 'agents'],
      hooks: [{ event: 'beforeRun', handler: 'onBeforeRun' }],
      tools: ['search', 'read'],
      agents: ['coder'],
      minCliVersion: '0.1.0',
      dependencies: { lodash: '^4.0.0' },
    };
    const result = validateManifest(data);
    expect(result.author).toBe('Test Author');
    expect(result.license).toBe('MIT');
    expect(result.capabilities).toEqual(['tools', 'agents']);
    expect(result.hooks).toHaveLength(1);
    expect(result.tools).toEqual(['search', 'read']);
    expect(result.minCliVersion).toBe('0.1.0');
  });

  test('rejects manifest with missing name', () => {
    const data = {
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
    };
    expect(() => validateManifest(data)).toThrow();
  });

  test('rejects manifest with missing version', () => {
    const data = {
      name: 'test-plugin',
      description: 'A test plugin',
      main: './dist/index.js',
    };
    expect(() => validateManifest(data)).toThrow();
  });

  test('rejects manifest with missing description', () => {
    const data = {
      name: 'test-plugin',
      version: '1.0.0',
      main: './dist/index.js',
    };
    expect(() => validateManifest(data)).toThrow();
  });

  test('rejects manifest with missing main', () => {
    const data = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
    };
    expect(() => validateManifest(data)).toThrow();
  });

  test('rejects manifest with empty name', () => {
    const data = {
      name: '',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
    };
    expect(() => validateManifest(data)).toThrow();
  });

  test('rejects manifest with invalid capability', () => {
    const data = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
      capabilities: ['invalid'],
    };
    expect(() => validateManifest(data)).toThrow();
  });
});

describe('checkCompatibility', () => {
  test('returns true when no minCliVersion is specified', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
    };
    expect(checkCompatibility(manifest, '0.1.0')).toBe(true);
  });

  test('returns true when CLI version meets minimum', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
      minCliVersion: '0.1.0',
    };
    expect(checkCompatibility(manifest, '0.2.0')).toBe(true);
  });

  test('returns true when CLI version equals minimum', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
      minCliVersion: '1.0.0',
    };
    expect(checkCompatibility(manifest, '1.0.0')).toBe(true);
  });

  test('returns false when CLI version is below minimum', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      main: './dist/index.js',
      minCliVersion: '2.0.0',
    };
    expect(checkCompatibility(manifest, '1.5.0')).toBe(false);
  });
});
