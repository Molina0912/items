import { describe, test, expect } from 'bun:test';
import {
  ExpoError,
  ToolError,
  AgentError,
  PermissionError,
  ConfigError,
  HookError,
  PluginError,
  MCPError,
  LSPError,
  ErrorCode,
} from '@expo/core';

describe('Errors', () => {
  test('ExpoError has correct properties', () => {
    const err = new ExpoError('test error', ErrorCode.TOOL_EXECUTION_FAILED, { tool: 'bash' });
    expect(err.message).toBe('test error');
    expect(err.code).toBe(ErrorCode.TOOL_EXECUTION_FAILED);
    expect(err.context).toEqual({ tool: 'bash' });
    expect(err.name).toBe('ExpoError');
    expect(err).toBeInstanceOf(Error);
  });

  test('ToolError inherits from ExpoError', () => {
    const err = new ToolError('tool failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ToolError');
    expect(err.code).toBe(ErrorCode.TOOL_EXECUTION_FAILED);
  });

  test('AgentError inherits from ExpoError', () => {
    const err = new AgentError('agent failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('AgentError');
    expect(err.code).toBe(ErrorCode.AGENT_EXECUTION_FAILED);
  });

  test('PermissionError inherits from ExpoError', () => {
    const err = new PermissionError('denied');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('PermissionError');
    expect(err.code).toBe(ErrorCode.PERMISSION_DENIED);
  });

  test('ConfigError inherits from ExpoError', () => {
    const err = new ConfigError('invalid config');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('ConfigError');
    expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  test('HookError inherits from ExpoError', () => {
    const err = new HookError('hook failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('HookError');
    expect(err.code).toBe(ErrorCode.HOOK_EXECUTION_FAILED);
  });

  test('PluginError inherits from ExpoError', () => {
    const err = new PluginError('plugin failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('PluginError');
    expect(err.code).toBe(ErrorCode.PLUGIN_LOAD_FAILED);
  });

  test('MCPError inherits from ExpoError', () => {
    const err = new MCPError('connection failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('MCPError');
    expect(err.code).toBe(ErrorCode.MCP_CONNECTION_FAILED);
  });

  test('LSPError inherits from ExpoError', () => {
    const err = new LSPError('lsp failed');
    expect(err).toBeInstanceOf(ExpoError);
    expect(err.name).toBe('LSPError');
    expect(err.code).toBe(ErrorCode.LSP_CONNECTION_FAILED);
  });

  test('custom error code can be provided', () => {
    const err = new ToolError('not found', ErrorCode.TOOL_NOT_FOUND);
    expect(err.code).toBe(ErrorCode.TOOL_NOT_FOUND);
  });
});
