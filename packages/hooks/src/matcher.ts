import type { HookEvent, HookHandler, HookContext } from './types.js';
import { parseCondition, evaluateCondition } from '@expo/core';

/**
 * Match handlers that should fire for a given event and context.
 * Filters by event match and optional condition string.
 * Returns handlers sorted by priority (higher first).
 */
export function matchHandlers(
  handlers: HookHandler[],
  event: HookEvent,
  context: HookContext
): HookHandler[] {
  const matched = handlers.filter((handler) => {
    // Check event match
    if (!matchesEvent(handler, event)) {
      return false;
    }

    // Check condition if present
    if (handler.condition) {
      if (!evaluateHandlerCondition(handler.condition, context)) {
        return false;
      }
    }

    return true;
  });

  // Sort by priority (higher priority first), default priority is 0
  return matched.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function matchesEvent(handler: HookHandler, event: HookEvent): boolean {
  if (Array.isArray(handler.event)) {
    return handler.event.includes(event);
  }
  return handler.event === event;
}

function evaluateHandlerCondition(condition: string, context: HookContext): boolean {
  try {
    const { ast } = parseCondition(condition);
    // Build flat string context from the payload
    const flatContext: Record<string, string> = {};
    for (const [key, value] of Object.entries(context.payload)) {
      if (typeof value === 'string') {
        flatContext[key] = value;
      } else if (value !== null && value !== undefined) {
        flatContext[key] = String(value);
      }
    }
    flatContext['event'] = context.event;
    flatContext['sessionId'] = context.sessionId;
    return evaluateCondition(ast, flatContext);
  } catch {
    // If condition parsing fails, do not match
    return false;
  }
}
