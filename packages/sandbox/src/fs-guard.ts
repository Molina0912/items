import type { FSPolicy } from './types.js';

function escapeRegexChar(char: string): string {
  return '\\' + char;
}

function escapeRegexMeta(str: string): string {
  return str.replace(/[.+()[\]{}^$|?\\]/g, escapeRegexChar);
}

function matchPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path === prefix || path.startsWith(prefix + '/');
  }
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    const rest = path.slice(prefix.length + 1);
    return path.startsWith(prefix + '/') && !rest.includes('/');
  }
  if (pattern.includes('*')) {
    // Escape regex metacharacters before converting glob * to regex
    const parts = pattern.split('*');
    const escaped = parts.map(escapeRegexMeta).join('[^/]*');
    const regex = new RegExp('^' + escaped + '$');
    return regex.test(path);
  }
  return path === pattern || path.startsWith(pattern + '/');
}

function matchesAny(path: string, patterns: string[]): boolean {
  return patterns.some((p) => matchPattern(path, p));
}

export class FSGuard {
  private policy: FSPolicy;

  constructor(policy: FSPolicy) {
    this.policy = policy;
  }

  canRead(path: string): boolean {
    if (this.policy.denyRead && matchesAny(path, this.policy.denyRead)) {
      return false;
    }
    return matchesAny(path, this.policy.allowRead);
  }

  canWrite(path: string): boolean {
    if (this.policy.denyWrite && matchesAny(path, this.policy.denyWrite)) {
      return false;
    }
    return matchesAny(path, this.policy.allowWrite);
  }

  assertRead(path: string): void {
    if (!this.canRead(path)) {
      throw new Error(`Read access denied: ${path}`);
    }
  }

  assertWrite(path: string): void {
    if (!this.canWrite(path)) {
      throw new Error(`Write access denied: ${path}`);
    }
  }
}
