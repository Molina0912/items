import type { PermissionRule, PermissionScope, Permission } from './types.js';
import { PermissionScopeSchema, PermissionSchema } from './types.js';

/**
 * Parse a single rule string in format "scope:pattern:action"
 * Examples:
 *   "tool:bash:allow"
 *   "file:/tmp/**:deny"
 *   "network:*.example.com:ask"
 *   "command:rm *:deny"
 */
export function parseRule(ruleString: string): PermissionRule {
  const parts = ruleString.split(':');
  if (parts.length < 3) {
    throw new Error(`Invalid permission rule format: "${ruleString}". Expected "scope:pattern:action"`);
  }

  const scope = parts[0];
  const action = parts[parts.length - 1];
  // Pattern is everything between scope and action (may contain colons, e.g., URLs)
  const pattern = parts.slice(1, parts.length - 1).join(':');

  if (!pattern) {
    throw new Error(`Invalid permission rule format: "${ruleString}". Pattern cannot be empty`);
  }

  const scopeResult = PermissionScopeSchema.safeParse(scope);
  if (!scopeResult.success) {
    throw new Error(`Invalid permission scope "${scope}" in rule "${ruleString}". Must be one of: tool, file, network, command`);
  }

  const actionResult = PermissionSchema.safeParse(action);
  if (!actionResult.success) {
    throw new Error(`Invalid permission action "${action}" in rule "${ruleString}". Must be one of: allow, ask, deny`);
  }

  return {
    pattern,
    action: actionResult.data,
    scope: scopeResult.data,
  };
}

/**
 * Parse an array of rule strings into typed PermissionRule[]
 */
export function parseRules(rules: string[]): PermissionRule[] {
  return rules.map(parseRule);
}
