import type { NetworkPolicy } from './types.js';

export class NetworkGuard {
  private policy: NetworkPolicy;

  constructor(policy: NetworkPolicy) {
    this.policy = policy;
  }

  isDomainAllowed(domain: string): boolean {
    if (this.policy.denyDomains && this.policy.denyDomains.includes(domain)) {
      return false;
    }
    return this.policy.allowDomains.includes(domain) || this.policy.allowDomains.includes('*');
  }

  canConnect(host: string, port?: number): boolean {
    if (!this.isDomainAllowed(host)) {
      return false;
    }
    if (port !== undefined && this.policy.allowPorts && this.policy.allowPorts.length > 0) {
      return this.policy.allowPorts.includes(port);
    }
    return true;
  }

  assertConnect(host: string, port?: number): void {
    if (!this.canConnect(host, port)) {
      const target = port ? `${host}:${port}` : host;
      throw new Error(`Network access denied: ${target}`);
    }
  }
}
