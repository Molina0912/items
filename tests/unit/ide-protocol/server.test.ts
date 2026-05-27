import { describe, test, expect } from 'bun:test';
import { IDEServer, registerDefaultMethods } from '@expo/ide-protocol';

describe('IDEServer', () => {
  test('starts and stops', () => {
    const server = new IDEServer();
    expect(server.isRunning()).toBe(false);
    server.start();
    expect(server.isRunning()).toBe(true);
    server.stop();
    expect(server.isRunning()).toBe(false);
  });

  test('handles valid JSON-RPC request', async () => {
    const server = new IDEServer();
    server.onRequest('test/echo', async (params) => {
      return { echo: params.message };
    });

    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test/echo', params: { message: 'hello' } })
    );
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { echo: 'hello' },
    });
  });

  test('returns parse error for invalid JSON', async () => {
    const server = new IDEServer();
    const response = await server.handleMessage('not json{{{');
    expect(response!.error!.code).toBe(-32700);
    expect(response!.error!.message).toBe('Parse error');
  });

  test('returns method not found for unregistered method', async () => {
    const server = new IDEServer();
    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'unknown/method' })
    );
    expect(response!.error!.code).toBe(-32601);
  });

  test('returns error when handler throws', async () => {
    const server = new IDEServer();
    server.onRequest('test/fail', async () => {
      throw new Error('handler error');
    });

    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test/fail' })
    );
    expect(response!.error!.code).toBe(-32603);
    expect(response!.error!.message).toBe('handler error');
  });

  test('sendNotification creates notification message', () => {
    const server = new IDEServer();
    const notification = server.sendNotification('progress', { percent: 50 });
    expect(notification).toEqual({
      jsonrpc: '2.0',
      method: 'progress',
      params: { percent: 50 },
    });
  });

  test('lists registered methods', () => {
    const server = new IDEServer();
    server.onRequest('session/start', async () => ({}));
    server.onRequest('tools/list', async () => ({}));
    const methods = server.getRegisteredMethods();
    expect(methods).toContain('session/start');
    expect(methods).toContain('tools/list');
  });
});

describe('registerDefaultMethods', () => {
  test('registers all built-in methods', () => {
    const server = new IDEServer();
    registerDefaultMethods(server);
    const methods = server.getRegisteredMethods();
    expect(methods).toContain('session/start');
    expect(methods).toContain('session/message');
    expect(methods).toContain('session/end');
    expect(methods).toContain('tools/list');
    expect(methods).toContain('tools/call');
    expect(methods).toContain('config/get');
    expect(methods).toContain('config/set');
    expect(methods).toContain('status/get');
  });

  test('session/start creates a session', async () => {
    const server = new IDEServer();
    registerDefaultMethods(server);
    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'session/start', params: { id: 'test-session' } })
    );
    expect(response!.result.sessionId).toBe('test-session');
    expect(response!.result.status).toBe('started');
  });

  test('config/set and config/get work together', async () => {
    const server = new IDEServer();
    registerDefaultMethods(server);

    await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'config/set', params: { key: 'theme', value: 'dark' } })
    );

    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'config/get', params: { key: 'theme' } })
    );
    expect(response!.result.value).toBe('dark');
  });

  test('status/get returns running status', async () => {
    const server = new IDEServer();
    registerDefaultMethods(server);
    const response = await server.handleMessage(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'status/get' })
    );
    expect(response!.result.status).toBe('running');
  });
});
