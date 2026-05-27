import { JsonlLog } from './jsonl.js';

export interface TurnEntry {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: unknown[];
  timestamp: string;
}

export class TurnLog {
  private log: JsonlLog<TurnEntry>;

  constructor(path: string) {
    this.log = new JsonlLog<TurnEntry>(path);
  }

  append(entry: TurnEntry): void {
    this.log.append(entry);
  }

  replay(sessionId?: string): TurnEntry[] {
    if (sessionId) {
      return this.log.replay((entry) => entry.sessionId === sessionId);
    }
    return this.log.replay();
  }

  rotate(maxLines: number): void {
    this.log.rotate(maxLines);
  }
}
