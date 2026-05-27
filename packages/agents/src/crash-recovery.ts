import type { SessionState } from '@expo/core';

export interface IncompleteSession {
  id: string;
  agentId: string;
  lastActivity: string;
  turnCount: number;
}

export function detectIncompleteSession(sessions: SessionState[]): IncompleteSession[] {
  const incomplete: IncompleteSession[] = [];

  for (const session of sessions) {
    const lastTurn = session.turns[session.turns.length - 1];
    if (lastTurn && !lastTurn.completedAt) {
      incomplete.push({
        id: session.id,
        agentId: session.agentId,
        lastActivity: session.updatedAt,
        turnCount: session.turns.length,
      });
    }
  }

  return incomplete;
}

export function offerResume(incomplete: IncompleteSession[]): IncompleteSession | null {
  if (incomplete.length === 0) {
    return null;
  }

  // Return the most recently active incomplete session
  return incomplete.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))[0];
}
