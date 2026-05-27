export interface LSPServerConfig {
  name: string;
  language: string;
  command: string;
  args?: string[];
  initializationOptions?: unknown;
  rootUri?: string;
}

export type LSPClientState = 'disconnected' | 'starting' | 'ready' | 'error';

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface Position {
  line: number;
  character: number;
}

export interface DiagnosticRange {
  start: Position;
  end: Position;
}

export interface Diagnostic {
  range: DiagnosticRange;
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
  code?: string | number;
}

export interface DocumentChange {
  uri: string;
  version: number;
  text: string;
}

export interface LSPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface LSPTransportInterface {
  start(): Promise<void>;
  send(message: LSPMessage): Promise<void>;
  onMessage(cb: (message: LSPMessage) => void): void;
  close(): Promise<void>;
}

export interface SpawnedProcess {
  stdin: { write(data: string): void };
  stdout: { on(event: string, cb: (data: Buffer) => void): void };
  stderr: { on(event: string, cb: (data: Buffer) => void): void };
  on(event: string, cb: (...args: unknown[]) => void): void;
  kill(): void;
  pid?: number;
}
