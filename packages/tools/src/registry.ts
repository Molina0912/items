import { ToolError, ErrorCode } from '@expo/core';
import type { ToolDefinition, ToolCategory } from './types.js';
import { bashTool } from './built-in/bash.js';
import { readFileTool } from './built-in/read-file.js';
import { writeFileTool } from './built-in/write-file.js';
import { editFileTool } from './built-in/edit-file.js';
import { globTool } from './built-in/glob.js';
import { grepTool } from './built-in/grep.js';
import { listDirTool } from './built-in/list-dir.js';
import { fetchTool } from './built-in/fetch.js';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(autoRegisterBuiltIn = true) {
    if (autoRegisterBuiltIn) {
      this.registerBuiltIns();
    }
  }

  register(definition: ToolDefinition): void {
    this.tools.set(definition.name, definition);
  }

  get(name: string): ToolDefinition {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolError(
        `Tool not found: ${name}`,
        ErrorCode.TOOL_NOT_FOUND,
        { toolName: name }
      );
    }
    return tool;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  listByCategory(category: ToolCategory): ToolDefinition[] {
    return this.list().filter((t) => t.category === category);
  }

  private registerBuiltIns(): void {
    this.register(bashTool);
    this.register(readFileTool);
    this.register(writeFileTool);
    this.register(editFileTool);
    this.register(globTool);
    this.register(grepTool);
    this.register(listDirTool);
    this.register(fetchTool);
  }
}
