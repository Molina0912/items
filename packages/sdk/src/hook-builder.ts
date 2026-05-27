import { parseCondition, evaluateCondition } from '@expo/core';
import type { ASTNode } from '@expo/core';

export interface HookDefinition {
  event: string;
  condition?: ASTNode;
  conditionRaw?: string;
  handler: (context: Record<string, unknown>) => Promise<void> | void;
}

class HookBuilder {
  private _event: string;
  private _condition?: ASTNode;
  private _conditionRaw?: string;

  constructor(event: string) {
    this._event = event;
  }

  when(condition: string): this {
    this._conditionRaw = condition;
    this._condition = parseCondition(condition).ast;
    return this;
  }

  do(handler: (context: Record<string, unknown>) => Promise<void> | void): HookDefinition {
    return {
      event: this._event,
      condition: this._condition,
      conditionRaw: this._conditionRaw,
      handler,
    };
  }
}

export function hook(event: string): HookBuilder {
  return new HookBuilder(event);
}
