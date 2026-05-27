import { nanoid } from 'nanoid';

export function sessionId(): string {
  return `sess_${nanoid(21)}`;
}

export function turnId(): string {
  return `turn_${nanoid(21)}`;
}

export function toolCallId(): string {
  return `tc_${nanoid(21)}`;
}

export function agentId(): string {
  return `agt_${nanoid(21)}`;
}
