import { z } from 'zod';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ToolError, ErrorCode } from '@expo/core';
import type { ToolDefinition, ToolContext, ToolOutput } from '../types.js';

const inputSchema = z.object({
  path: z.string().describe('Path to the file to edit'),
  edits: z.array(z.object({
    oldText: z.string().describe('Text to find'),
    newText: z.string().describe('Replacement text'),
  })).describe('Array of search/replace edits'),
});

export const editFileTool: ToolDefinition = {
  name: 'edit_file',
  description: 'Apply targeted search/replace edits to a file',
  category: 'edit',
  inputSchema,

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const parsed = inputSchema.parse(input);
    const filePath = resolve(context.workingDir, parsed.path);

    // Check FS guard for read access
    if (context.guards?.fs && !context.guards.fs.canRead(filePath)) {
      throw new ToolError(
        `Read access denied: ${filePath}`,
        ErrorCode.TOOL_EXECUTION_FAILED,
        { path: filePath }
      );
    }

    // Check FS guard for write access
    if (context.guards?.fs && !context.guards.fs.canWrite(filePath)) {
      throw new ToolError(
        `Write access denied: ${filePath}`,
        ErrorCode.TOOL_EXECUTION_FAILED,
        { path: filePath }
      );
    }

    let content = readFileSync(filePath, 'utf-8');
    let editsApplied = 0;

    for (const edit of parsed.edits) {
      if (!content.includes(edit.oldText)) {
        throw new ToolError(
          `Edit failed: could not find text "${edit.oldText.slice(0, 50)}" in file`,
          ErrorCode.TOOL_EXECUTION_FAILED,
          { path: filePath }
        );
      }
      content = content.replace(edit.oldText, edit.newText);
      editsApplied++;
    }

    writeFileSync(filePath, content, 'utf-8');

    return { path: filePath, editsApplied };
  },
};
