import { ToolError, PermissionError, ErrorCode, EventBus } from '@expo/core';
import type { ToolInput, ToolOutput, ToolContext, SandboxGuards } from './types.js';
import type { ToolRegistry } from './registry.js';

export interface PermissionEvaluatorLike {
  evaluate(query: { scope: string; resource: string; context: { sessionId: string; mode: string; toolName?: string } }): 'allow' | 'ask' | 'deny';
}

export interface ToolExecutorOptions {
  permissionEvaluator?: PermissionEvaluatorLike;
  permissionMode?: 'auto' | 'interactive' | 'strict';
  guards?: SandboxGuards;
  eventBus?: EventBus;
}

export class ToolExecutor {
  private permissionEvaluator?: PermissionEvaluatorLike;
  private permissionMode: string;
  private guards?: SandboxGuards;
  private eventBus?: EventBus;

  constructor(private registry: ToolRegistry, options?: ToolExecutorOptions) {
    this.permissionEvaluator = options?.permissionEvaluator;
    this.permissionMode = options?.permissionMode ?? 'auto';
    this.guards = options?.guards;
    this.eventBus = options?.eventBus;
  }

  async execute(toolName: string, input: ToolInput, context: ToolContext): Promise<ToolOutput> {
    const tool = this.registry.get(toolName);

    // Check permissions if evaluator is provided and tool requires permission
    if (this.permissionEvaluator && tool.requiresPermission) {
      const decision = this.permissionEvaluator.evaluate({
        scope: 'tool',
        resource: toolName,
        context: {
          sessionId: context.sessionId,
          mode: this.permissionMode,
          toolName,
        },
      });

      if (decision === 'deny') {
        throw new PermissionError(
          `Permission denied for tool "${toolName}"`,
          ErrorCode.PERMISSION_DENIED,
          { toolName }
        );
      }

      if (decision === 'ask') {
        // In strict mode or interactive mode without a way to ask, deny
        if (this.permissionMode === 'strict') {
          throw new PermissionError(
            `Permission denied for tool "${toolName}" (strict mode)`,
            ErrorCode.PERMISSION_DENIED,
            { toolName }
          );
        }
        // In auto mode, allow but emit event for auditability
        if (this.permissionMode !== 'auto') {
          throw new PermissionError(
            `Permission requires approval for tool "${toolName}"`,
            ErrorCode.PERMISSION_DENIED,
            { toolName }
          );
        }
        // Auto-grant: emit event or log warning for visibility
        if (this.eventBus) {
          this.eventBus.emit('permission:auto_granted', {
            tool: toolName,
            sessionId: context.sessionId,
            resource: toolName,
            mode: this.permissionMode,
          });
        } else {
          console.warn(
            `[permissions] Auto-granted permission for tool "${toolName}" (session: ${context.sessionId})`
          );
        }
      }
    }

    // Validate input with Zod schema
    const parseResult = tool.inputSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ToolError(
        `Invalid input for tool "${toolName}": ${parseResult.error.message}`,
        ErrorCode.TOOL_INVALID_INPUT,
        { toolName, errors: parseResult.error.issues }
      );
    }

    const validatedInput = parseResult.data as ToolInput;
    const timeout = tool.timeout ?? 30000;

    // Merge guards from executor options into context
    const executionContext: ToolContext = this.guards
      ? { ...context, guards: { ...this.guards, ...context.guards } }
      : context;

    try {
      const result = await this.executeWithTimeout(
        () => tool.execute(validatedInput, executionContext),
        timeout,
        context.abortSignal
      );
      return result;
    } catch (error) {
      if (error instanceof ToolError || error instanceof PermissionError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ToolError(
        `Tool "${toolName}" execution failed: ${message}`,
        ErrorCode.TOOL_EXECUTION_FAILED,
        { toolName }
      );
    }
  }

  private async executeWithTimeout(
    fn: () => Promise<ToolOutput>,
    timeout: number,
    abortSignal?: AbortSignal
  ): Promise<ToolOutput> {
    if (abortSignal?.aborted) {
      throw new ToolError('Execution aborted', ErrorCode.TOOL_EXECUTION_FAILED);
    }

    return new Promise<ToolOutput>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolError('Tool execution timed out', ErrorCode.TOOL_EXECUTION_FAILED));
      }, timeout);

      const abortHandler = () => {
        clearTimeout(timer);
        reject(new ToolError('Execution aborted', ErrorCode.TOOL_EXECUTION_FAILED));
      };

      if (abortSignal) {
        abortSignal.addEventListener('abort', abortHandler, { once: true });
      }

      fn()
        .then((result) => {
          clearTimeout(timer);
          if (abortSignal) {
            abortSignal.removeEventListener('abort', abortHandler);
          }
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          if (abortSignal) {
            abortSignal.removeEventListener('abort', abortHandler);
          }
          reject(error);
        });
    });
  }
}
