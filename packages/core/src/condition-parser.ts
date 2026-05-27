export type ASTNode =
  | { type: 'predicate'; key: string; value: string }
  | { type: 'and'; left: ASTNode; right: ASTNode }
  | { type: 'or'; left: ASTNode; right: ASTNode }
  | { type: 'not'; operand: ASTNode };

export interface ParseResult {
  ast: ASTNode;
}

type Token =
  | { type: 'AND' }
  | { type: 'OR' }
  | { type: 'NOT' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }
  | { type: 'PREDICATE'; key: string; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (input[i] === ' ' || input[i] === '\t') {
      i++;
      continue;
    }

    if (input[i] === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }

    if (input[i] === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }

    // Read a word
    let word = '';
    while (i < input.length && input[i] !== ' ' && input[i] !== '\t' && input[i] !== '(' && input[i] !== ')') {
      word += input[i];
      i++;
    }

    if (word.toUpperCase() === 'AND') {
      tokens.push({ type: 'AND' });
    } else if (word.toUpperCase() === 'OR') {
      tokens.push({ type: 'OR' });
    } else if (word.toUpperCase() === 'NOT') {
      tokens.push({ type: 'NOT' });
    } else if (word.includes(':')) {
      const colonIdx = word.indexOf(':');
      tokens.push({ type: 'PREDICATE', key: word.slice(0, colonIdx), value: word.slice(colonIdx + 1) });
    } else {
      throw new Error(`Unexpected token: ${word}`);
    }
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const result = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}`);
    }
    return result;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (this.pos < this.tokens.length && this.tokens[this.pos].type === 'OR') {
      this.pos++;
      const right = this.parseAnd();
      left = { type: 'or', left, right };
    }

    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();

    while (this.pos < this.tokens.length && this.tokens[this.pos].type === 'AND') {
      this.pos++;
      const right = this.parseNot();
      left = { type: 'and', left, right };
    }

    return left;
  }

  private parseNot(): ASTNode {
    if (this.pos < this.tokens.length && this.tokens[this.pos].type === 'NOT') {
      this.pos++;
      const operand = this.parseNot();
      return { type: 'not', operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    if (this.pos >= this.tokens.length) {
      throw new Error('Unexpected end of input');
    }

    const token = this.tokens[this.pos];

    if (token.type === 'LPAREN') {
      this.pos++;
      const node = this.parseOr();
      if (this.pos >= this.tokens.length || this.tokens[this.pos].type !== 'RPAREN') {
        throw new Error('Missing closing parenthesis');
      }
      this.pos++;
      return node;
    }

    if (token.type === 'PREDICATE') {
      this.pos++;
      return { type: 'predicate', key: token.key, value: token.value };
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }
}

export function parseCondition(input: string): ParseResult {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return { ast: parser.parse() };
}

export function evaluateCondition(ast: ASTNode, context: Record<string, string>): boolean {
  switch (ast.type) {
    case 'predicate':
      return context[ast.key] === ast.value;
    case 'and':
      return evaluateCondition(ast.left, context) && evaluateCondition(ast.right, context);
    case 'or':
      return evaluateCondition(ast.left, context) || evaluateCondition(ast.right, context);
    case 'not':
      return !evaluateCondition(ast.operand, context);
  }
}
