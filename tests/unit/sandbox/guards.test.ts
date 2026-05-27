import { describe, test, expect } from 'bun:test';
import { FSGuard, NetworkGuard, ProcessGuard } from '@expo/sandbox';
import type { FSPolicy, NetworkPolicy, ProcessPolicy } from '@expo/sandbox';

describe('FSGuard', () => {
  const policy: FSPolicy = {
    allowRead: ['/home/user/project/**', '/tmp/**'],
    allowWrite: ['/home/user/project/src/**', '/tmp/**'],
    denyRead: ['/home/user/project/.env'],
    denyWrite: ['/home/user/project/node_modules/**'],
  };

  test('allows reading from allowed paths', () => {
    const guard = new FSGuard(policy);
    expect(guard.canRead('/home/user/project/src/index.ts')).toBe(true);
    expect(guard.canRead('/tmp/test.txt')).toBe(true);
  });

  test('denies reading from denied paths', () => {
    const guard = new FSGuard(policy);
    expect(guard.canRead('/home/user/project/.env')).toBe(false);
  });

  test('denies reading from non-allowed paths', () => {
    const guard = new FSGuard(policy);
    expect(guard.canRead('/etc/passwd')).toBe(false);
  });

  test('allows writing to allowed paths', () => {
    const guard = new FSGuard(policy);
    expect(guard.canWrite('/home/user/project/src/new-file.ts')).toBe(true);
  });

  test('denies writing to denied paths', () => {
    const guard = new FSGuard(policy);
    expect(guard.canWrite('/home/user/project/node_modules/pkg/index.js')).toBe(false);
  });

  test('assertRead throws for denied paths', () => {
    const guard = new FSGuard(policy);
    expect(() => guard.assertRead('/etc/passwd')).toThrow('Read access denied');
  });

  test('assertWrite throws for denied paths', () => {
    const guard = new FSGuard(policy);
    expect(() => guard.assertWrite('/etc/shadow')).toThrow('Write access denied');
  });
});

describe('NetworkGuard', () => {
  const policy: NetworkPolicy = {
    allowDomains: ['api.example.com', 'cdn.example.com'],
    denyDomains: ['malware.bad.com'],
    allowPorts: [80, 443, 8080],
  };

  test('allows connection to allowed domain', () => {
    const guard = new NetworkGuard(policy);
    expect(guard.canConnect('api.example.com', 443)).toBe(true);
  });

  test('denies connection to denied domain', () => {
    const guard = new NetworkGuard(policy);
    expect(guard.canConnect('malware.bad.com', 443)).toBe(false);
  });

  test('denies connection to unknown domain', () => {
    const guard = new NetworkGuard(policy);
    expect(guard.canConnect('unknown.domain.com', 443)).toBe(false);
  });

  test('denies connection on disallowed port', () => {
    const guard = new NetworkGuard(policy);
    expect(guard.canConnect('api.example.com', 3306)).toBe(false);
  });

  test('isDomainAllowed checks allowlist', () => {
    const guard = new NetworkGuard(policy);
    expect(guard.isDomainAllowed('api.example.com')).toBe(true);
    expect(guard.isDomainAllowed('random.com')).toBe(false);
  });

  test('assertConnect throws for denied host', () => {
    const guard = new NetworkGuard(policy);
    expect(() => guard.assertConnect('evil.com', 443)).toThrow('Network access denied');
  });
});

describe('ProcessGuard', () => {
  const policy: ProcessPolicy = {
    allowCommands: ['node', 'npm', 'git', 'ls'],
    denyCommands: ['rm', 'sudo'],
    maxProcesses: 10,
    maxMemoryMB: 512,
  };

  test('allows execution of allowed commands', () => {
    const guard = new ProcessGuard(policy);
    expect(guard.canExecute('node index.js')).toBe(true);
    expect(guard.canExecute('git status')).toBe(true);
  });

  test('denies execution of denied commands', () => {
    const guard = new ProcessGuard(policy);
    expect(guard.canExecute('rm -rf /')).toBe(false);
    expect(guard.canExecute('sudo apt install')).toBe(false);
  });

  test('denies execution of unknown commands', () => {
    const guard = new ProcessGuard(policy);
    expect(guard.canExecute('curl http://evil.com')).toBe(false);
  });

  test('assertExecute throws for denied command', () => {
    const guard = new ProcessGuard(policy);
    expect(() => guard.assertExecute('rm -rf /')).toThrow('Process execution denied');
  });

  test('isWithinLimits returns true (stub)', () => {
    const guard = new ProcessGuard(policy);
    expect(guard.isWithinLimits()).toBe(true);
  });

  test('reports resource limits', () => {
    const guard = new ProcessGuard(policy);
    expect(guard.getMaxProcesses()).toBe(10);
    expect(guard.getMaxMemoryMB()).toBe(512);
  });
});
