import { describe, test, expect } from 'bun:test';
import { ExpoConfigSchema } from '@expo/config';

describe('ExpoConfigSchema', () => {
  test('parses empty object with defaults', () => {
    const result = ExpoConfigSchema.parse({});

    expect(result.model.provider).toBe('openai');
    expect(result.model.name).toBe('gpt-4');
    expect(result.model.temperature).toBe(0.7);
    expect(result.model.maxTokens).toBe(4096);
    expect(result.permissions.mode).toBe('interactive');
    expect(result.permissions.rules).toEqual([]);
    expect(result.tools.enabled).toEqual([]);
    expect(result.tools.disabled).toEqual([]);
    expect(result.telemetry.enabled).toBe(false);
    expect(result.sandbox.mode).toBe('none');
    expect(result.i18n.locale).toBe('en');
  });

  test('parses valid model config', () => {
    const result = ExpoConfigSchema.parse({
      model: { provider: 'anthropic', name: 'claude-3', temperature: 0.5, maxTokens: 8192 },
    });

    expect(result.model.provider).toBe('anthropic');
    expect(result.model.name).toBe('claude-3');
    expect(result.model.temperature).toBe(0.5);
    expect(result.model.maxTokens).toBe(8192);
  });

  test('rejects invalid temperature', () => {
    expect(() =>
      ExpoConfigSchema.parse({
        model: { temperature: 3 },
      })
    ).toThrow();
  });

  test('rejects invalid maxTokens', () => {
    expect(() =>
      ExpoConfigSchema.parse({
        model: { maxTokens: -1 },
      })
    ).toThrow();
  });

  test('parses valid permissions config', () => {
    const result = ExpoConfigSchema.parse({
      permissions: {
        mode: 'strict',
        rules: [{ tool: 'bash', action: 'deny' }],
      },
    });

    expect(result.permissions.mode).toBe('strict');
    expect(result.permissions.rules).toHaveLength(1);
    expect(result.permissions.rules[0].tool).toBe('bash');
  });

  test('rejects invalid permissions mode', () => {
    expect(() =>
      ExpoConfigSchema.parse({
        permissions: { mode: 'invalid' },
      })
    ).toThrow();
  });

  test('parses valid tools config', () => {
    const result = ExpoConfigSchema.parse({
      tools: {
        enabled: ['bash', 'read'],
        disabled: ['write'],
        custom: [{ name: 'deploy', description: 'Deploy app', command: 'deploy.sh' }],
      },
    });

    expect(result.tools.enabled).toEqual(['bash', 'read']);
    expect(result.tools.disabled).toEqual(['write']);
    expect(result.tools.custom).toHaveLength(1);
    expect(result.tools.custom[0].name).toBe('deploy');
  });

  test('parses valid MCP config', () => {
    const result = ExpoConfigSchema.parse({
      mcp: {
        servers: [{ name: 'test-server', url: 'http://localhost:3000', transport: 'sse' }],
      },
    });

    expect(result.mcp.servers).toHaveLength(1);
    expect(result.mcp.servers[0].name).toBe('test-server');
    expect(result.mcp.servers[0].transport).toBe('sse');
  });

  test('parses valid telemetry config', () => {
    const result = ExpoConfigSchema.parse({
      telemetry: { enabled: true, endpoint: 'https://telemetry.example.com' },
    });

    expect(result.telemetry.enabled).toBe(true);
    expect(result.telemetry.endpoint).toBe('https://telemetry.example.com');
  });

  test('parses valid i18n config', () => {
    const result = ExpoConfigSchema.parse({
      i18n: { locale: 'es', fallback: 'en' },
    });

    expect(result.i18n.locale).toBe('es');
    expect(result.i18n.fallback).toBe('en');
  });

  test('parses valid sandbox config', () => {
    const result = ExpoConfigSchema.parse({
      sandbox: { mode: 'container', rules: ['no-network', 'read-only'] },
    });

    expect(result.sandbox.mode).toBe('container');
    expect(result.sandbox.rules).toEqual(['no-network', 'read-only']);
  });
});
