import { ToolError, ErrorCode } from '@expo/core';
import type { ToolDefinition } from './types.js';

export async function loadCustomTools(paths: string[]): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [];

  for (const toolPath of paths) {
    try {
      const mod = await import(toolPath);
      const toolDef = mod.default ?? mod.tool;
      if (!toolDef || !toolDef.name || !toolDef.execute) {
        throw new ToolError(
          `Invalid tool module at "${toolPath}": must export a ToolDefinition with name and execute`,
          ErrorCode.TOOL_INVALID_INPUT,
          { path: toolPath }
        );
      }
      tools.push(toolDef as ToolDefinition);
    } catch (error) {
      if (error instanceof ToolError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ToolError(
        `Failed to load tool from "${toolPath}": ${message}`,
        ErrorCode.TOOL_EXECUTION_FAILED,
        { path: toolPath }
      );
    }
  }

  return tools;
}
