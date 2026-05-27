import type { IDEServer } from './server.js';

export interface MethodContext {
  sessions: Map<string, { id: string; startedAt: number }>;
  config: Map<string, unknown>;
}

export function createDefaultContext(): MethodContext {
  return {
    sessions: new Map(),
    config: new Map(),
  };
}

export function registerDefaultMethods(server: IDEServer, context?: MethodContext): MethodContext {
  const ctx = context ?? createDefaultContext();

  server.onRequest('session/start', async (params) => {
    const p = params as Record<string, unknown> | undefined;
    const id = (p?.id as string) ?? `session-${Date.now()}`;
    ctx.sessions.set(id, { id, startedAt: Date.now() });
    return { sessionId: id, status: 'started' };
  });

  server.onRequest('session/message', async (params) => {
    const p = params as Record<string, unknown> | undefined;
    const sessionId = p?.sessionId as string | undefined;
    if (!sessionId || !ctx.sessions.has(sessionId)) {
      throw new Error('Invalid session');
    }
    return { received: true, sessionId };
  });

  server.onRequest('session/end', async (params) => {
    const p = params as Record<string, unknown> | undefined;
    const sessionId = p?.sessionId as string | undefined;
    if (sessionId && ctx.sessions.has(sessionId)) {
      ctx.sessions.delete(sessionId);
    }
    return { status: 'ended', sessionId };
  });

  server.onRequest('tools/list', async () => {
    return { tools: [] };
  });

  server.onRequest('tools/call', async (params) => {
    const p = params as Record<string, unknown> | undefined;
    const toolName = p?.name as string | undefined;
    if (!toolName) {
      throw new Error('Tool name required');
    }
    return { result: null, tool: toolName };
  });

  server.onRequest('config/get', async (params) => {
    const p = params as Record<string, unknown> | undefined;
    const key = p?.key as string | undefined;
    if (!key) {
      throw new Error('Config key required');
    }
    return { key, value: ctx.config.get(key) ?? null };
  });

  server.onRequest('config/set', async (params) => {
    const p = (params ?? {}) as Record<string, unknown>;
    const key = p.key as string | undefined;
    const value = p.value;
    if (!key) {
      throw new Error('Config key required');
    }
    ctx.config.set(key, value);
    return { key, value, updated: true };
  });

  server.onRequest('status/get', async () => {
    return {
      status: 'running',
      sessions: ctx.sessions.size,
      uptime: Date.now(),
    };
  });

  return ctx;
}
