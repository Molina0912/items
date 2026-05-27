import type { PermissionDecision, PermissionQuery } from './types.js';
import { getModeDefaults } from './modes.js';

/**
 * AskFlow handles prompting the user for permission decisions.
 * In non-interactive contexts, it returns the mode default.
 * Interactive TUI integration will be added later.
 */
export class AskFlow {
  /**
   * Prompt for a permission decision.
   * In non-interactive mode, returns the mode default with 'once' remember.
   */
  prompt(query: PermissionQuery): PermissionDecision {
    // Non-interactive: return the mode default
    const action = getModeDefaults(query.context.mode);
    return {
      action,
      remember: 'once',
    };
  }
}
