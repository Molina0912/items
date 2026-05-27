import type { z } from 'zod';

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema?: z.ZodType<TInput>;
  executeFn: (input: TInput) => Promise<TOutput> | TOutput;
}

class ToolBuilder<TInput = unknown, TOutput = unknown> {
  private _name: string;
  private _description = '';
  private _inputSchema?: z.ZodType<TInput>;
  private _executeFn?: (input: TInput) => Promise<TOutput> | TOutput;

  constructor(name: string) {
    this._name = name;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  input<T>(schema: z.ZodType<T>): ToolBuilder<T, TOutput> {
    (this as any)._inputSchema = schema;
    return this as any;
  }

  execute<R>(fn: (input: TInput) => Promise<R> | R): ToolDefinition<TInput, R> {
    return {
      name: this._name,
      description: this._description,
      inputSchema: this._inputSchema,
      executeFn: fn as any,
    };
  }
}

export function tool(name: string): ToolBuilder {
  return new ToolBuilder(name);
}
