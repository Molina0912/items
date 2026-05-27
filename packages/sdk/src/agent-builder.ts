import type { AgentConfig } from '@expo/core';

export interface AgentDefinition {
  name: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  config: AgentConfig;
}

class AgentBuilder {
  private _name: string;
  private _model = '';
  private _systemPrompt = '';
  private _tools: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  model(model: string): this {
    this._model = model;
    return this;
  }

  systemPrompt(prompt: string): this {
    this._systemPrompt = prompt;
    return this;
  }

  tools(tools: string[]): AgentDefinition {
    this._tools = tools;
    return this.build();
  }

  private build(): AgentDefinition {
    return {
      name: this._name,
      model: this._model,
      systemPrompt: this._systemPrompt,
      tools: this._tools,
      config: {
        id: '',
        name: this._name,
        model: this._model,
        systemPrompt: this._systemPrompt,
        tools: this._tools,
      },
    };
  }
}

export function agent(name: string): AgentBuilder {
  return new AgentBuilder(name);
}
