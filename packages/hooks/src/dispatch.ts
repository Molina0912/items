import type { HookHandler, HookContext, HookResult } from './types.js';

const DEFAULT_TIMEOUT = 30_000;

export interface DispatchOptions {
  signal?: AbortSignal;
}

/**
 * Dispatch to matched handlers sequentially by priority order.
 * - Timeout per handler (default 30s, configurable per handler)
 * - Error isolation: one handler failure doesn't stop others
 * - Supports AbortSignal for cancellation
 */
export async function dispatchToHandlers(
  handlers: HookHandler[],
  context: HookContext,
  options?: DispatchOptions
): Promise<HookResult[]> {
  const results: HookResult[] = [];

  for (const handler of handlers) {
    // Check abort signal
    if (options?.signal?.aborted) {
      break;
    }

    const timeout = handler.timeout ?? DEFAULT_TIMEOUT;

    try {
      const result = await executeWithTimeout(handler, context, timeout, options?.signal);
      results.push(result);
    } catch (error) {
      // Error isolation: capture error but continue
      results.push({
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return results;
}

async function executeWithTimeout(
  handler: HookHandler,
  context: HookContext,
  timeout: number,
  signal?: AbortSignal
): Promise<HookResult> {
  return new Promise<HookResult>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Hook handler "${handler.name}" timed out after ${timeout}ms`));
      }
    }, timeout);

    const onAbort = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Hook handler "${handler.name}" was aborted`));
      }
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    handler
      .handler(context)
      .then((result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          resolve(result);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          reject(err);
        }
      });
  });
}
