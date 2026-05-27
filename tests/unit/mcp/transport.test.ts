import { describe, test, expect } from 'bun:test';
import { StdioTransport, HttpTransport, SSETransport } from '@expo/mcp';
import type { MCPMessage, EventSourceLike } from '@expo/mcp';
import type { SpawnedProcess } from '@expo/mcp';

describe('StdioTransport', () => {
  test('sends JSON-RPC messages as line-delimited JSON', async () => {
    const written: string[] = [];
    const mockProcess: SpawnedProcess = {
      stdin: { write(data: string) { written.push(data); } },
      stdout: { on() {} },
      stderr: { on() {} },
      on() {},
      kill() {},
    };

    const transport = new StdioTransport({
      command: 'test',
      args: [],
      spawn: () => mockProcess,
    });

    await transport.start();

    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' },
    };

    await transport.send(message);
    expect(written).toHaveLength(1);
    expect(written[0]).toEndWith('\n');
    const parsed = JSON.parse(written[0].trim());
    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.id).toBe(1);
    expect(parsed.method).toBe('initialize');
  });

  test('receives and parses JSON-RPC messages from stdout', async () => {
    let stdoutCb: ((data: Buffer) => void) | null = null;
    const mockProcess: SpawnedProcess = {
      stdin: { write() {} },
      stdout: { on(_event: string, cb: (data: Buffer) => void) { stdoutCb = cb; } },
      stderr: { on() {} },
      on() {},
      kill() {},
    };

    const transport = new StdioTransport({
      command: 'test',
      args: [],
      spawn: () => mockProcess,
    });

    const received: MCPMessage[] = [];
    transport.onMessage((msg) => received.push(msg));

    await transport.start();

    const response: MCPMessage = { jsonrpc: '2.0', id: 1, result: { tools: [] } };
    stdoutCb!(Buffer.from(JSON.stringify(response) + '\n'));

    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(1);
    expect(received[0].result).toEqual({ tools: [] });
  });

  test('handles partial messages across chunks', async () => {
    let stdoutCb: ((data: Buffer) => void) | null = null;
    const mockProcess: SpawnedProcess = {
      stdin: { write() {} },
      stdout: { on(_event: string, cb: (data: Buffer) => void) { stdoutCb = cb; } },
      stderr: { on() {} },
      on() {},
      kill() {},
    };

    const transport = new StdioTransport({
      command: 'test',
      args: [],
      spawn: () => mockProcess,
    });

    const received: MCPMessage[] = [];
    transport.onMessage((msg) => received.push(msg));

    await transport.start();

    const response = JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} });
    // Split the message across two chunks
    stdoutCb!(Buffer.from(response.substring(0, 10)));
    expect(received).toHaveLength(0);
    stdoutCb!(Buffer.from(response.substring(10) + '\n'));
    expect(received).toHaveLength(1);
  });

  test('closes transport by killing process', async () => {
    let killed = false;
    const mockProcess: SpawnedProcess = {
      stdin: { write() {} },
      stdout: { on() {} },
      stderr: { on() {} },
      on() {},
      kill() { killed = true; },
    };

    const transport = new StdioTransport({
      command: 'test',
      args: [],
      spawn: () => mockProcess,
    });

    await transport.start();
    await transport.close();
    expect(killed).toBe(true);
  });
});

describe('HttpTransport', () => {
  test('sends POST requests with JSON-RPC messages', async () => {
    let lastRequest: { url: string; options: RequestInit } | null = null;

    const mockFetch = async (url: string | URL | Request, options?: RequestInit) => {
      lastRequest = { url: url as string, options: options! };
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const transport = new HttpTransport({
      url: 'http://localhost:3000/mcp',
      headers: { 'X-Api-Key': 'test-key' },
      fetchFn: mockFetch as typeof fetch,
    });

    const message: MCPMessage = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };
    await transport.send(message);

    expect(lastRequest).not.toBeNull();
    expect(lastRequest!.url).toBe('http://localhost:3000/mcp');
    expect(lastRequest!.options.method).toBe('POST');
    const headers = lastRequest!.options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Api-Key']).toBe('test-key');
  });

  test('dispatches response to message handler', async () => {
    const mockFetch = async () => {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const transport = new HttpTransport({
      url: 'http://localhost:3000/mcp',
      fetchFn: mockFetch as typeof fetch,
    });

    const received: MCPMessage[] = [];
    transport.onMessage((msg) => received.push(msg));

    await transport.send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(received).toHaveLength(1);
    expect(received[0].result).toEqual({ tools: [] });
  });

  test('throws on HTTP error', async () => {
    const mockFetch = async () => {
      return new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    };

    const transport = new HttpTransport({
      url: 'http://localhost:3000/mcp',
      fetchFn: mockFetch as typeof fetch,
    });

    await expect(
      transport.send({ jsonrpc: '2.0', id: 1, method: 'test' })
    ).rejects.toThrow('HTTP transport error: 500');
  });
});

describe('SSETransport', () => {
  test('sends POST requests to message endpoint', async () => {
    let lastUrl: string | null = null;

    const mockFetch = async (url: string | URL | Request) => {
      lastUrl = url as string;
      return new Response(null, { status: 202 });
    };

    const mockEventSource: EventSourceLike = {
      onmessage: null,
      onerror: null,
      close() {},
    };

    const transport = new SSETransport({
      url: 'http://localhost:3000/sse',
      fetchFn: mockFetch as typeof fetch,
      createEventSource: () => mockEventSource,
    });

    await transport.start();
    await transport.send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(lastUrl).toBe('http://localhost:3000/message');
  });

  test('receives messages from SSE events', async () => {
    const mockEventSource: EventSourceLike = {
      onmessage: null,
      onerror: null,
      close() {},
    };

    const mockFetch = async () => new Response(null, { status: 202 });

    const transport = new SSETransport({
      url: 'http://localhost:3000/sse',
      fetchFn: mockFetch as typeof fetch,
      createEventSource: () => mockEventSource,
    });

    const received: MCPMessage[] = [];
    transport.onMessage((msg) => received.push(msg));

    await transport.start();

    // Simulate SSE event
    mockEventSource.onmessage!({
      data: JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [] } }),
    });

    expect(received).toHaveLength(1);
    expect(received[0].result).toEqual({ tools: [] });
  });

  test('close terminates SSE connection', async () => {
    let closed = false;
    const mockEventSource: EventSourceLike = {
      onmessage: null,
      onerror: null,
      close() { closed = true; },
    };

    const transport = new SSETransport({
      url: 'http://localhost:3000/sse',
      fetchFn: (async () => new Response(null, { status: 202 })) as typeof fetch,
      createEventSource: () => mockEventSource,
    });

    await transport.start();
    await transport.close();
    expect(closed).toBe(true);
  });
});
