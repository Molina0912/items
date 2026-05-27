import type { ProcessPolicy } from './types.js';

export class ProcessGuard {
  private policy: ProcessPolicy;

  constructor(policy: ProcessPolicy) {
    this.policy = policy;
  }

  canExecute(command: string): boolean {
    const executable = command.split(/\s+/)[0];
    if (this.policy.denyCommands && this.policy.denyCommands.includes(executable)) {
      return false;
    }
    return this.policy.allowCommands.includes(executable) || this.policy.allowCommands.includes('*');
  }

  assertExecute(command: string): void {
    if (!this.canExecute(command)) {
      throw new Error(`Process execution denied: ${command}`);
    }
  }

  isWithinLimits(): boolean {
    // Stub for actual resource monitoring
    return true;
  }

  getMaxProcesses(): number | undefined {
    return this.policy.maxProcesses;
  }

  getMaxMemoryMB(): number | undefined {
    return this.policy.maxMemoryMB;
  }
}
