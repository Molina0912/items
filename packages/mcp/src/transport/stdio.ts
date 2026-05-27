import type { MCPMessage, MCPTransportInterface } from '../types.js';

export interface StdioTransportOptions {
  command: string;
  args: string[];
  env?: Record<string, string>;
  spawn?: (command: string, args: string[], options: { env?: Record<string, string>; stdio: string[] }) => SpawnedProcess;
}

export interface SpawnedProcess {
  stdin: { write(data: string): void };
  stdout: { on(event: string, cb: (data: Buffer) => void): void };
  stderr: { on(event: string, cb: (data: Buffer) => void): void };
  on(event: string, cb: (...args: unknown[]) => void): void;
  kill(): void;
  pid?: number;
}

export class StdioTransport implements MCPTransportInterface {
  private process: SpawnedProcess | null = null;
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  private buffer = '';
  private readonly command: string;
  private readonly args: string[];
  private readonly env?: Record<string, string>;
  private readonly spawnFn?: StdioTransportOptions['spawn'];

  constructor(options: StdioTransportOptions) {
    this.command = options.command;
    this.args = options.args;
    this.env = options.env;
    this.spawnFn = options.spawn;
  }

  async start(): Promise<void> {
    if (this.spawnFn) {
      this.process = this.spawnFn(this.command, this.args, {
        env: this.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      const { spawn } = await import('node:child_process');
      this.process = spawn(this.command, this.args, {
        env: { ...process.env, ...this.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      }) as unknown as SpawnedProcess;
    }

    this.process.stdout.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this.process) {
      throw new Error('Transport not started');
    }
    const json = JSON.stringify(message);
    this.process.stdin.write(json + '\n');
  }

  onMessage(cb: (message: MCPMessage) => void): void {
    this.messageHandler = cb;
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const message = JSON.parse(trimmed) as MCPMessage;
          this.messageHandler?.(message);
        } catch {
          // Ignore non-JSON lines
        }
      }
    }
  }
}
