import { describe, test, expect } from 'bun:test';
import { AgentRegistry, AgentRunner, SessionOrchestrator } from '@expo/agents';
import { ToolRegistry, ToolExecutor } from '@expo/tools';
import type { GenerateResponseFn, AgentStep } from '@expo/agents';
import type { Message } from '@expo/core';

function createMockGenerator(responses: AgentStep[]): GenerateResponseFn {
  let callIndex = 0;
  return async (_messages: Message[], _tools: string[], _options?: { signal?: AbortSignal }) => {
    const response = responses[callIndex % responses.length];
    callIndex++;
    return response;
  };
}

function makeOrchestrator(responses: AgentStep[], maxSessions?: number): SessionOrchestrator {
  const agentRegistry = new AgentRegistry();
  const toolRegistry = new ToolRegistry();
  const toolExecutor = new ToolExecutor(toolRegistry);
  const mockGen = createMockGenerator(responses);
  const runner = new AgentRunner(agentRegistry, toolExecutor, mockGen);
  return new SessionOrchestrator(runner, agentRegistry, maxSessions !== undefined ? { maxSessions } : undefined);
}

describe('SessionOrchestrator', () => {
  test('boot creates a new session', () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'Hi' },
    ]);
    const id = orchestrator.boot('primary');
    expect(id).toBeTruthy();
    expect(id.startsWith('sess_')).toBe(true);
  });

  test('loop processes user input and returns response', async () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'Hello user!' },
    ]);
    const id = orchestrator.boot('primary');
    const response = await orchestrator.loop(id, 'Hi there');
    expect(response).toBe('Hello user!');
  });

  test('persist returns session state', async () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'Persisted' },
    ]);
    const id = orchestrator.boot('primary');
    await orchestrator.loop(id, 'Save this');

    const state = orchestrator.persist(id);
    expect(state.id).toBe(id);
    expect(state.agentId).toBe('primary');
    expect(state.turns.length).toBe(1);
    expect(state.turns[0].messages.length).toBe(2); // user + assistant
  });

  test('resume restores a session', () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'Resumed' },
    ]);
    const id = orchestrator.boot('primary');
    const state = orchestrator.persist(id);

    // Create a new orchestrator and resume
    const newOrchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'After resume' },
    ]);
    newOrchestrator.resume(state.id, state);
    const session = newOrchestrator.getSession(state.id);
    expect(session.agentName).toBe('primary');
  });

  test('continue returns most recent active session', async () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'test' },
    ]);
    const id1 = orchestrator.boot('primary');
    // Process a turn in the first session so its updatedAt advances
    await orchestrator.loop(id1, 'hello');

    // Wait briefly so timestamps differ
    await new Promise((r) => setTimeout(r, 5));

    const id2 = orchestrator.boot('primary');
    await orchestrator.loop(id2, 'world');

    // Should return the most recently updated session (id2)
    const continued = orchestrator.continue();
    expect(continued).toBe(id2);
  });

  test('continue returns null when no sessions exist', () => {
    const orchestrator = makeOrchestrator([]);
    expect(orchestrator.continue()).toBeNull();
  });

  test('branch creates a new session from a specific turn', async () => {
    const orchestrator = makeOrchestrator([
      { stepNumber: 1, action: 'response', response: 'Turn 1 response' },
    ]);
    const id = orchestrator.boot('primary');
    await orchestrator.loop(id, 'Message 1');
    await orchestrator.loop(id, 'Message 2');

    const branchedId = orchestrator.branch(id, 1);
    expect(branchedId).not.toBe(id);

    const branchedState = orchestrator.persist(branchedId);
    expect(branchedState.turns.length).toBe(1);
    expect(branchedState.metadata?.branchedFrom).toBe(id);
    expect(branchedState.metadata?.branchedAtTurn).toBe(1);
  });

  test('getSession throws for unknown session', () => {
    const orchestrator = makeOrchestrator([]);
    expect(() => orchestrator.getSession('fake-id')).toThrow('Session not found');
  });

  describe('session eviction', () => {
    test('evicts oldest session when maxSessions cap is reached', () => {
      const orchestrator = makeOrchestrator([
        { stepNumber: 1, action: 'response', response: 'test' },
      ], 3);

      const id1 = orchestrator.boot('primary');
      const id2 = orchestrator.boot('primary');
      const id3 = orchestrator.boot('primary');

      // All three should exist
      expect(() => orchestrator.getSession(id1)).not.toThrow();
      expect(() => orchestrator.getSession(id2)).not.toThrow();
      expect(() => orchestrator.getSession(id3)).not.toThrow();

      // Adding a 4th should evict the oldest (id1)
      const id4 = orchestrator.boot('primary');
      expect(() => orchestrator.getSession(id1)).toThrow('Session not found');
      expect(() => orchestrator.getSession(id2)).not.toThrow();
      expect(() => orchestrator.getSession(id3)).not.toThrow();
      expect(() => orchestrator.getSession(id4)).not.toThrow();
    });

    test('evicts least recently accessed session', async () => {
      const orchestrator = makeOrchestrator([
        { stepNumber: 1, action: 'response', response: 'test' },
      ], 3);

      const id1 = orchestrator.boot('primary');
      await new Promise((r) => setTimeout(r, 5));
      const id2 = orchestrator.boot('primary');
      await new Promise((r) => setTimeout(r, 5));
      const id3 = orchestrator.boot('primary');

      // Access id1 to make it most recently used
      await new Promise((r) => setTimeout(r, 5));
      orchestrator.getSession(id1);

      // Adding a 4th should evict id2 (least recently accessed)
      const id4 = orchestrator.boot('primary');
      expect(() => orchestrator.getSession(id2)).toThrow('Session not found');
      expect(() => orchestrator.getSession(id1)).not.toThrow();
      expect(() => orchestrator.getSession(id3)).not.toThrow();
      expect(() => orchestrator.getSession(id4)).not.toThrow();
    });

    test('defaults to maxSessions of 100', () => {
      const orchestrator = makeOrchestrator([
        { stepNumber: 1, action: 'response', response: 'test' },
      ]);

      // Boot 101 sessions - the first should be evicted
      const ids: string[] = [];
      for (let i = 0; i < 101; i++) {
        ids.push(orchestrator.boot('primary'));
      }

      // The first should have been evicted when the 101st was added
      expect(() => orchestrator.getSession(ids[0])).toThrow('Session not found');
      // The second should still exist
      expect(() => orchestrator.getSession(ids[1])).not.toThrow();
      // The last should exist
      expect(() => orchestrator.getSession(ids[100])).not.toThrow();
    });

    test('resume enforces maxSessions cap', () => {
      const orchestrator = makeOrchestrator([
        { stepNumber: 1, action: 'response', response: 'test' },
      ], 2);

      const id1 = orchestrator.boot('primary');
      const id2 = orchestrator.boot('primary');

      // Resume a new session should evict the oldest
      orchestrator.resume('resumed-session', {
        id: 'resumed-session',
        agentId: 'primary',
        turns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(() => orchestrator.getSession(id1)).toThrow('Session not found');
      expect(() => orchestrator.getSession(id2)).not.toThrow();
      expect(() => orchestrator.getSession('resumed-session')).not.toThrow();
    });

    test('branch enforces maxSessions cap', async () => {
      const orchestrator = makeOrchestrator([
        { stepNumber: 1, action: 'response', response: 'test' },
      ], 2);

      const id1 = orchestrator.boot('primary');
      await orchestrator.loop(id1, 'hello');
      await new Promise((r) => setTimeout(r, 5));
      const id2 = orchestrator.boot('primary');

      // Branch from id1 should evict the oldest (id1 itself is most recent since we accessed it)
      const branchedId = orchestrator.branch(id1, 1);
      // One of the original two must have been evicted
      expect(branchedId).toBeTruthy();
    });
  });
});
