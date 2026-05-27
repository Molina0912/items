import type { Permission, PermissionMode } from './types.js';

/**
 * Get the default permission for a given mode when no rule matches.
 * - auto: allow (permissive by default)
 * - interactive: ask (prompt the user)
 * - strict: deny (secure by default)
 */
export function getModeDefaults(mode: PermissionMode): Permission {
  switch (mode) {
    case 'auto':
      return 'allow';
    case 'interactive':
      return 'ask';
    case 'strict':
      return 'deny';
  }
}

/**
 * Apply mode logic after rule evaluation.
 * If a rule matched, use its result. If no rule matched, use the mode default.
 */
export function applyMode(mode: PermissionMode, evaluationResult: Permission | null): Permission {
  if (evaluationResult !== null) {
    return evaluationResult;
  }
  return getModeDefaults(mode);
}
