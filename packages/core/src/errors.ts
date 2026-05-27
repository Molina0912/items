export enum ErrorCode {
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_INVALID_INPUT = 'TOOL_INVALID_INPUT',
  AGENT_EXECUTION_FAILED = 'AGENT_EXECUTION_FAILED',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_NOT_CONFIGURED = 'PERMISSION_NOT_CONFIGURED',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  HOOK_EXECUTION_FAILED = 'HOOK_EXECUTION_FAILED',
  HOOK_INVALID_CONDITION = 'HOOK_INVALID_CONDITION',
  PLUGIN_LOAD_FAILED = 'PLUGIN_LOAD_FAILED',
  PLUGIN_INVALID = 'PLUGIN_INVALID',
  MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  MCP_PROTOCOL_ERROR = 'MCP_PROTOCOL_ERROR',
  LSP_CONNECTION_FAILED = 'LSP_CONNECTION_FAILED',
  LSP_PROTOCOL_ERROR = 'LSP_PROTOCOL_ERROR',
}

export class ExpoError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: ErrorCode, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ExpoError';
    this.code = code;
    this.context = context;
  }
}

export class ToolError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.TOOL_EXECUTION_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'ToolError';
  }
}

export class AgentError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.AGENT_EXECUTION_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'AgentError';
  }
}

export class PermissionError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.PERMISSION_DENIED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'PermissionError';
  }
}

export class ConfigError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFIG_INVALID, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'ConfigError';
  }
}

export class HookError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.HOOK_EXECUTION_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'HookError';
  }
}

export class PluginError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.PLUGIN_LOAD_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'PluginError';
  }
}

export class MCPError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.MCP_CONNECTION_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'MCPError';
  }
}

export class LSPError extends ExpoError {
  constructor(message: string, code: ErrorCode = ErrorCode.LSP_CONNECTION_FAILED, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'LSPError';
  }
}
