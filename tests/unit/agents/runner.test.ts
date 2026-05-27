import { describe, test, expect } from 'bun:test';
import { AgentRegistry, AgentRunner } from '@expo/agents';
import { ToolRegistry, ToolExecutor } from '@expo/tools';
import type { GenerateResponseFn, AgentStep } from '@expo/agents';
import type { Message } from '@expo/core';

function createMockGenerator(responses: AgentStep[]): GenerateResponseFn {
  let callIndex = 0;
  return async (_messages: Message[], _tools: string[], _options?: { signal?: AbortSignal }) => {
    const response = responses[callIndex];
    callIndex++;
    return response;
  };
}

describe('AgentRunner', () => {
  test('produces a direct response', async () => {
    const agentRegistry = new AgentRegistry();
    const toolRegistry = new ToolRegistry();
    const toolExecutor = new ToolExecutor(toolRegistry);

    const mockGen = createMockGenerator([
      { stepNumber: 1, action: 'response', response: 'Hello there!' },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);
    const results: Array<{ continue: boolean; response?: string }> = [];

    for await (const step of runner.run('primary', [])) {
      results.push(step);
    }

    expect(results.length).toBe(1);
    expect(results[0].continue).toBe(false);
    expect(results[0].response).toBe('Hello there!');
  });

  test('executes tool calls and feeds back results', async () => {
    const agentRegistry = new AgentRegistry();
    const toolRegistry = new ToolRegistry();
    const toolExecutor = new ToolExecutor(toolRegistry);

    const mockGen = createMockGenerator([
      {
        stepNumber: 1,
        action: 'tool_call',
        toolCalls: [{ id: 'tc-1', name: 'bash', input: { command: 'echo test' } }],
      },
      { stepNumber: 2, action: 'response', response: 'Done!' },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);
    const results: Array<{ continue: boolean; response?: string; toolResults?: unknown[] }> = [];

    for await (const step of runner.run('primary', [])) {
      results.push(step);
    }

    expect(results.length).toBe(2);
    expect(results[0].continue).toBe(true);
    expect(results[0].toolResults).toBeDefined();
    expect(results[0].toolResults!.length).toBe(1);
    expect(results[1].continue).toBe(false);
    expect(results[1].response).toBe('Done!');
  });

  test('respects maxSteps limit', async () => {
    const agentRegistry = new AgentRegistry(false);
    agentRegistry.register({
      name: 'limited',
      role: 'primary',
      model: 'test',
      systemPrompt: 'test',
      tools: ['*'],
      maxSteps: 3,
      description: 'limited agent',
    });

    const toolRegistry = new ToolRegistry();
    const toolExecutor = new ToolExecutor(toolRegistry);

    // Always returns tool calls - never terminates
    const mockGen = createMockGenerator([
      { stepNumber: 1, action: 'tool_call', toolCalls: [{ id: 'tc-1', name: 'bash', input: { command: 'echo 1' } }] },
      { stepNumber: 2, action: 'tool_call', toolCalls: [{ id: 'tc-2', name: 'bash', input: { command: 'echo 2' } }] },
      { stepNumber: 3, action: 'tool_call', toolCalls: [{ id: 'tc-3', name: 'bash', input: { command: 'echo 3' } }] },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);

    await expect(async () => {
      for await (const _step of runner.run('limited', [])) {
        // consume
      }
    }).toThrow('exceeded maximum steps');
  });

  test('supports abort signal', async () => {
    const agentRegistry = new AgentRegistry();
    const toolRegistry = new ToolRegistry();
    const toolExecutor = new ToolExecutor(toolRegistry);

    const controller = new AbortController();
    controller.abort(); // Pre-abort

    const mockGen = createMockGenerator([
      { stepNumber: 1, action: 'response', response: 'should not reach' },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);

    await expect(async () => {
      for await (const _step of runner.run('primary', [], { signal: controller.signal })) {
        // consume
      }
    }).toThrow('aborted');
  });

  test('handles error action from generator', async () => {
    const agentRegistry = new AgentRegistry();
    const toolRegistry = new ToolRegistry();
    const toolExecutor = new ToolExecutor(toolRegistry);

    const mockGen = createMockGenerator([
      { stepNumber: 1, action: 'error', error: 'Something went wrong' },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);
    const results: Array<{ continue: boolean; response?: string }> = [];

    for await (const step of runner.run('primary', [])) {
      results.push(step);
    }

    expect(results.length).toBe(1);
    expect(results[0].continue).toBe(false);
    expect(results[0].response).toBe('Something went wrong');
  });

  test('handles tool execution errors gracefully', async () => {
    const agentRegistry = new AgentRegistry();
    const toolRegistry = new ToolRegistry(false);
    const toolExecutor = new ToolExecutor(toolRegistry);

    const mockGen = createMockGenerator([
      {
        stepNumber: 1,
        action: 'tool_call',
        toolCalls: [{ id: 'tc-1', name: 'nonexistent_tool', input: {} }],
      },
      { stepNumber: 2, action: 'response', response: 'Recovered' },
    ]);

    const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);
    const results: Array<{ continue: boolean; response?: string; toolResults?: Array<{ error?: string }> }> = [];

    for await (const step of runner.run('primary', [])) {
      results.push(step);
    }

    expect(results.length).toBe(2);
    expect(results[0].toolResults![0].error).toContain('Tool not found');
    expect(results[1].response).toBe('Recovered');
  });
});
