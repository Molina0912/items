import { describe, test, expect } from 'bun:test';
import { AgentRegistry } from '@expo/agents';

describe('AgentRegistry', () => {
  test('auto-registers built-in agents', () => {
    const registry = new AgentRegistry();
    expect(registry.has('primary')).toBe(true);
    expect(registry.has('subagent')).toBe(true);
  });

  test('can register a custom agent', () => {
    const registry = new AgentRegistry(false);
    registry.register({
      name: 'custom',
      role: 'hidden',
      model: 'gpt-4',
      systemPrompt: 'You are custom.',
      tools: ['bash'],
      maxSteps: 10,
      description: 'A custom agent',
    });
    expect(registry.has('custom')).toBe(true);
  });

  test('get returns registered agent', () => {
    const registry = new AgentRegistry();
    const agent = registry.get('primary');
    expect(agent.name).toBe('primary');
    expect(agent.role).toBe('primary');
    expect(agent.maxSteps).toBe(100);
  });

  test('get throws for unknown agent', () => {
    const registry = new AgentRegistry();
    expect(() => registry.get('nonexistent')).toThrow('Agent not found: nonexistent');
  });

  test('has returns false for unknown agent', () => {
    const registry = new AgentRegistry();
    expect(registry.has('nonexistent')).toBe(false);
  });

  test('list returns all registered agents', () => {
    const registry = new AgentRegistry();
    const agents = registry.list();
    expect(agents.length).toBe(2);
    expect(agents.map((a) => a.name).sort()).toEqual(['primary', 'subagent']);
  });

  test('can create registry without built-ins', () => {
    const registry = new AgentRegistry(false);
    expect(registry.list().length).toBe(0);
  });

  test('primary agent has all tools wildcard', () => {
    const registry = new AgentRegistry();
    const primary = registry.get('primary');
    expect(primary.tools).toContain('*');
  });

  test('subagent has limited tools and steps', () => {
    const registry = new AgentRegistry();
    const sub = registry.get('subagent');
    expect(sub.maxSteps).toBe(25);
    expect(sub.tools.length).toBeGreaterThan(0);
    expect(sub.tools).not.toContain('*');
  });
});
