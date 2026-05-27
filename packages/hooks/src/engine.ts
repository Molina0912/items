import type { HookEvent, HookHandler, HookContext, HookResult } from './types.js';
import { matchHandlers } from './matcher.js';
import { dispatchToHandlers } from './dispatch.js';

/**
 * HookEngine manages registration and dispatching of hook handlers.
 */
export class HookEngine {
  private handlers: Map<string, HookHandler> = new Map();

  /**
   * Register a hook handler.
   */
  register(handler: HookHandler): void {
    this.handlers.set(handler.name, handler);
  }

  /**
   * Unregister a handler by name.
   */
  unregister(name: string): void {
    this.handlers.delete(name);
  }

  /**
   * Dispatch an event to all matching handlers.
   */
  async dispatch(event: HookEvent, context: HookContext): Promise<HookResult[]> {
    const allHandlers = Array.from(this.handlers.values());
    const matched = matchHandlers(allHandlers, event, context);
    const results = await dispatchToHandlers(matched, context);

    // Remove once handlers that fired
    for (const handler of matched) {
      if (handler.once) {
        this.handlers.delete(handler.name);
      }
    }

    return results;
  }

  /**
   * List registered handlers, optionally filtered by event.
   */
  listHandlers(event?: HookEvent): HookHandler[] {
    const all = Array.from(this.handlers.values());
    if (!event) {
      return all;
    }
    return all.filter((h) => {
      if (Array.isArray(h.event)) {
        return h.event.includes(event);
      }
      return h.event === event;
    });
  }

  /**
   * Remove all registered handlers.
   */
  clear(): void {
    this.handlers.clear();
  }
}
