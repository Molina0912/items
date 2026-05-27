import type { Permission, PermissionMode, PermissionQuery, PermissionRule } from './types.js';
import { globMatch } from './glob.js';
import { getModeDefaults } from './modes.js';

export class PermissionEvaluator {
  private rules: PermissionRule[];
  private mode: PermissionMode;

  constructor(rules: PermissionRule[], mode: PermissionMode) {
    this.rules = rules;
    this.mode = mode;
  }

  /**
   * Evaluate a permission query against the rules.
   * Returns the action from the first matching rule, or the mode default if no match.
   */
  evaluate(query: PermissionQuery): Permission {
    // Sort rules by specificity (more specific first)
    const sorted = this.getSortedRules(query.scope);

    for (const rule of sorted) {
      if (this.matches(rule, query)) {
        return rule.action;
      }
    }

    // No rule matched - return mode default
    return getModeDefaults(this.mode);
  }

  private getSortedRules(scope: string): PermissionRule[] {
    // Filter rules that match the scope
    const matching = this.rules.filter(
      (rule) => !rule.scope || rule.scope === scope
    );

    // Sort by specificity: rules without wildcards first, then by pattern length
    return [...matching].sort((a, b) => {
      const aSpecificity = this.getSpecificity(a.pattern);
      const bSpecificity = this.getSpecificity(b.pattern);
      return bSpecificity - aSpecificity;
    });
  }

  private getSpecificity(pattern: string): number {
    let score = pattern.length;
    // Patterns with ** are least specific
    if (pattern.includes('**')) {
      score -= 100;
    }
    // Patterns with * are less specific
    if (pattern.includes('*') && !pattern.includes('**')) {
      score -= 50;
    }
    // Patterns with ? are slightly less specific
    if (pattern.includes('?')) {
      score -= 25;
    }
    return score;
  }

  private matches(rule: PermissionRule, query: PermissionQuery): boolean {
    // Scope must match if specified on the rule
    if (rule.scope && rule.scope !== query.scope) {
      return false;
    }

    // Match pattern against the resource
    return globMatch(rule.pattern, query.resource);
  }
}
