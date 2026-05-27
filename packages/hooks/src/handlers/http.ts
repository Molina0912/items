import type { HookContext, HookResult } from '../types.js';

export interface HttpHookInput {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * HttpHookHandler sends an HTTP request (webhook) as a hook action.
 * Stubbed for now - full integration comes in later features.
 */
export async function httpHookHandler(
  input: HttpHookInput,
  _context: HookContext
): Promise<HookResult> {
  // Stub: return the request that would be sent
  return {
    modified: false,
    data: {
      url: input.url,
      method: input.method ?? 'POST',
      headers: input.headers,
      body: input.body,
      status: 'stub',
    },
  };
}
