import { AgentError, ErrorCode } from '@expo/core';
import type { Message } from '@expo/core';
import type { ToolExecutor, PermissionEvaluatorLike } from '@expo/tools';
import type { AgentDefinition, StepResult, GenerateResponseFn } from './types.js';
import type { AgentRegistry } from './registry.js';

export interface AgentRunnerOptions {
  signal?: AbortSignal;
  maxSteps?: number;
  permissionEvaluator?: PermissionEvaluatorLike;
}

export class AgentRunner {
  constructor(
    private registry: AgentRegistry,
    private toolExecutor: ToolExecutor,
    private generateResponse: GenerateResponseFn
  ) {}

  async *run(
    agentName: string,
    messages: Message[],
    options?: AgentRunnerOptions
  ): AsyncGenerator<StepResult> {
    const definition = this.registry.get(agentName);
    const maxSteps = options?.maxSteps ?? definition.maxSteps;
    const signal = options?.signal;

    const conversationMessages: Message[] = [
      { id: 'system', role: 'system', content: definition.systemPrompt, timestamp: new Date().toISOString() },
      ...messages,
    ];

    let step = 0;

    while (step < maxSteps) {
      if (signal?.aborted) {
        throw new AgentError('Agent execution aborted', ErrorCode.AGENT_EXECUTION_FAILED);
      }

      step++;
      const agentStep = await this.generateResponse(
        conversationMessages,
        definition.tools,
        { signal }
      );

      if (agentStep.action === 'error') {
        yield { continue: false, response: agentStep.error };
        return;
      }

      if (agentStep.action === 'response') {
        yield { continue: false, response: agentStep.response };
        return;
      }

      if (agentStep.action === 'tool_call' && agentStep.toolCalls) {
        const toolResults: Array<{ toolCallId: string; output: string; error?: string }> = [];

        for (const toolCall of agentStep.toolCalls) {
          try {
            const result = await this.toolExecutor.execute(
              toolCall.name,
              toolCall.input,
              {
                workingDir: process.cwd(),
                sessionId: 'runner-session',
                abortSignal: signal,
                permissions: {},
              }
            );
            toolResults.push({ toolCallId: toolCall.id, output: JSON.stringify(result) });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toolResults.push({ toolCallId: toolCall.id, output: '', error: message });
          }
        }

        // Add assistant message with tool calls
        conversationMessages.push({
          id: `step-${step}`,
          role: 'assistant',
          content: JSON.stringify(agentStep.toolCalls),
          timestamp: new Date().toISOString(),
        });

        // Add tool results as messages
        for (const result of toolResults) {
          conversationMessages.push({
            id: result.toolCallId,
            role: 'tool',
            content: result.error ?? result.output,
            timestamp: new Date().toISOString(),
          });
        }

        yield { continue: true, toolResults };
      }
    }

    throw new AgentError(
      `Agent "${agentName}" exceeded maximum steps (${maxSteps})`,
      ErrorCode.AGENT_EXECUTION_FAILED,
      { agentName, maxSteps }
    );
  }
}
