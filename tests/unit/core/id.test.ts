import { describe, test, expect } from 'bun:test';
import { sessionId, turnId, toolCallId, agentId } from '@expo/core';

describe('ID Generators', () => {
  test('sessionId has correct prefix', () => {
    const id = sessionId();
    expect(id.startsWith('sess_')).toBe(true);
  });

  test('turnId has correct prefix', () => {
    const id = turnId();
    expect(id.startsWith('turn_')).toBe(true);
  });

  test('toolCallId has correct prefix', () => {
    const id = toolCallId();
    expect(id.startsWith('tc_')).toBe(true);
  });

  test('agentId has correct prefix', () => {
    const id = agentId();
    expect(id.startsWith('agt_')).toBe(true);
  });

  test('IDs are unique', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(sessionId());
      ids.add(turnId());
      ids.add(toolCallId());
      ids.add(agentId());
    }
    expect(ids.size).toBe(400);
  });

  test('sessionId has correct length (prefix + 21 chars)', () => {
    const id = sessionId();
    expect(id.length).toBe(5 + 21); // "sess_" + 21
  });

  test('turnId has correct length (prefix + 21 chars)', () => {
    const id = turnId();
    expect(id.length).toBe(5 + 21); // "turn_" + 21
  });

  test('toolCallId has correct length (prefix + 21 chars)', () => {
    const id = toolCallId();
    expect(id.length).toBe(3 + 21); // "tc_" + 21
  });

  test('agentId has correct length (prefix + 21 chars)', () => {
    const id = agentId();
    expect(id.length).toBe(4 + 21); // "agt_" + 21
  });
});
