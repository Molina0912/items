import { sessionId as generateSessionId, turnId as generateTurnId } from '@expo/core';
import type { Message, SessionState, Turn } from '@expo/core';
import type { AgentRunner } from './runner.js';
import type { AgentRegistry } from './registry.js';

export interface SessionInfo {
  id: string;
  agentName: string;
  state: SessionState;
  isComplete: boolean;
  lastAccessedAt: string;
}

export interface SessionOrchestratorOptions {
  maxSessions?: number;
}

export class SessionOrchestrator {
  private sessions: Map<string, SessionInfo> = new Map();
  private runner: AgentRunner;
  private registry: AgentRegistry;
  private maxSessions: number;

  constructor(runner: AgentRunner, registry: AgentRegistry, options?: SessionOrchestratorOptions) {
    this.runner = runner;
    this.registry = registry;
    this.maxSessions = options?.maxSessions ?? 100;
  }

  private evictOldest(): void {
    let oldest: SessionInfo | null = null;
    for (const session of this.sessions.values()) {
      if (!oldest || session.lastAccessedAt < oldest.lastAccessedAt) {
        oldest = session;
      }
    }
    if (oldest) {
      this.sessions.delete(oldest.id);
    }
  }

  boot(agentName: string): string {
    if (this.sessions.size >= this.maxSessions) {
      this.evictOldest();
    }

    const id = generateSessionId();
    const now = new Date().toISOString();
    const state: SessionState = {
      id,
      agentId: agentName,
      turns: [],
      createdAt: now,
      updatedAt: now,
    };

    const info: SessionInfo = {
      id,
      agentName,
      state,
      isComplete: false,
      lastAccessedAt: now,
    };

    this.sessions.set(id, info);
    return id;
  }

  async loop(sessionId: string, input: string): Promise<string> {
    const session = this.getSession(sessionId);
    session.lastAccessedAt = new Date().toISOString();

    const userMessage: Message = {
      id: generateTurnId(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const allMessages = this.getMessages(session);
    allMessages.push(userMessage);

    const turn: Turn = {
      id: generateTurnId(),
      sessionId,
      messages: [userMessage],
      toolCalls: [],
      startedAt: new Date().toISOString(),
    };

    let finalResponse = '';

    const generator = this.runner.run(session.agentName, allMessages);

    for await (const stepResult of generator) {
      if (!stepResult.continue && stepResult.response) {
        finalResponse = stepResult.response;
        turn.messages.push({
          id: generateTurnId(),
          role: 'assistant',
          content: stepResult.response,
          timestamp: new Date().toISOString(),
        });
      }
    }

    turn.completedAt = new Date().toISOString();
    session.state.turns.push(turn);
    session.state.updatedAt = new Date().toISOString();

    return finalResponse;
  }

  persist(sessionId: string): SessionState {
    const session = this.getSession(sessionId);
    // Return the current state for external persistence
    return { ...session.state };
  }

  resume(sessionId: string, state: SessionState): void {
    if (!this.sessions.has(sessionId) && this.sessions.size >= this.maxSessions) {
      this.evictOldest();
    }

    const info: SessionInfo = {
      id: sessionId,
      agentName: state.agentId,
      state,
      isComplete: false,
      lastAccessedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, info);
  }

  continue(): string | null {
    // Find the most recent session that is not complete
    let latest: SessionInfo | null = null;

    for (const session of this.sessions.values()) {
      if (!session.isComplete) {
        if (!latest || session.state.updatedAt > latest.state.updatedAt) {
          latest = session;
        }
      }
    }

    return latest?.id ?? null;
  }

  branch(sessionId: string, fromTurn: number): string {
    const session = this.getSession(sessionId);

    if (this.sessions.size >= this.maxSessions) {
      this.evictOldest();
    }

    const newId = generateSessionId();
    const now = new Date().toISOString();

    const branchedTurns = session.state.turns.slice(0, fromTurn);
    const newState: SessionState = {
      id: newId,
      agentId: session.agentName,
      turns: branchedTurns,
      createdAt: now,
      updatedAt: now,
      metadata: { branchedFrom: sessionId, branchedAtTurn: fromTurn },
    };

    const newSession: SessionInfo = {
      id: newId,
      agentName: session.agentName,
      state: newState,
      isComplete: false,
      lastAccessedAt: now,
    };

    this.sessions.set(newId, newSession);
    return newId;
  }

  getSession(sessionId: string): SessionInfo {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.lastAccessedAt = new Date().toISOString();
    return session;
  }

  private getMessages(session: SessionInfo): Message[] {
    const messages: Message[] = [];
    for (const turn of session.state.turns) {
      messages.push(...turn.messages);
    }
    return messages;
  }
}
