import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Logger } from '@expo/core';

describe('Logger', () => {
  let logs: string[];
  let originalLog: typeof console.log;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;

  beforeEach(() => {
    logs = [];
    originalLog = console.log;
    originalWarn = console.warn;
    originalError = console.error;
    console.log = (...args: any[]) => logs.push(args.join(' '));
    console.warn = (...args: any[]) => logs.push(args.join(' '));
    console.error = (...args: any[]) => logs.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  test('respects log level - debug not shown at info level', () => {
    const logger = new Logger({ level: 'info' });
    logger.debug('hidden');
    expect(logs).toHaveLength(0);
  });

  test('respects log level - info shown at info level', () => {
    const logger = new Logger({ level: 'info' });
    logger.info('visible');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('visible');
  });

  test('shows all levels when set to debug', () => {
    const logger = new Logger({ level: 'debug' });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(logs).toHaveLength(4);
  });

  test('JSON output mode', () => {
    const logger = new Logger({ level: 'info', json: true });
    logger.info('test message');
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test message');
    expect(parsed.timestamp).toBeDefined();
  });

  test('context injection', () => {
    const logger = new Logger({ level: 'info', json: true, context: { service: 'test' } });
    logger.info('hello');
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context.service).toBe('test');
  });

  test('child logger inherits and merges context', () => {
    const logger = new Logger({ level: 'info', json: true, context: { service: 'parent' } });
    const child = logger.child({ requestId: '123' });
    child.info('child message');
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context.service).toBe('parent');
    expect(parsed.context.requestId).toBe('123');
  });

  test('warn and error use appropriate console methods', () => {
    const logger = new Logger({ level: 'debug' });
    logger.warn('warning');
    logger.error('error');
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('warning');
    expect(logs[1]).toContain('error');
  });
});
