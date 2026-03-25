type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

const NUMBER_RE = /^\d+(\.\d+)?$/;
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];
    if (!ch) break;

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if ('+-*/()'.includes(ch)) {
      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch });
      } else {
        tokens.push({ type: 'operator', value: ch as '+' | '-' | '*' | '/' });
      }
      i += 1;
      continue;
    }

    let j = i;
    while (
      j < expression.length &&
      !/\s/.test(expression[j] as string) &&
      !'+-*/()'.includes(expression[j] as string)
    ) {
      j += 1;
    }

    const raw = expression.slice(i, j);
    if (NUMBER_RE.test(raw)) {
      tokens.push({ type: 'number', value: Number(raw) });
    } else if (IDENTIFIER_RE.test(raw)) {
      tokens.push({ type: 'identifier', value: raw.toUpperCase() });
    } else {
      throw new Error(`Invalid token "${raw}" in formula.`);
    }
    i = j;
  }

  return normalizeUnaryMinus(tokens);
}

function normalizeUnaryMinus(tokens: Token[]): Token[] {
  const result: Token[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i] as Token;
    if (current.type !== 'operator' || current.value !== '-') {
      result.push(current);
      continue;
    }

    const prev = result[result.length - 1];
    const unaryContext =
      !prev ||
      (prev.type === 'operator') ||
      (prev.type === 'paren' && prev.value === '(');

    if (!unaryContext) {
      result.push(current);
      continue;
    }

    const next = tokens[i + 1];
    if (!next) {
      throw new Error('Invalid unary minus usage in formula.');
    }

    if (next.type === 'number') {
      result.push({ type: 'number', value: -next.value });
      i += 1;
      continue;
    }

    if (next.type === 'identifier' || (next.type === 'paren' && next.value === '(')) {
      result.push({ type: 'number', value: 0 });
      result.push(current);
      continue;
    }

    throw new Error('Invalid unary minus usage in formula.');
  }

  return result;
}

const PRECEDENCE: Record<'+' | '-' | '*' | '/', number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operators: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'identifier') {
      output.push(token);
      continue;
    }

    if (token.type === 'operator') {
      while (operators.length > 0) {
        const top = operators[operators.length - 1] as Token;
        if (top.type !== 'operator') break;
        if (PRECEDENCE[top.value] < PRECEDENCE[token.value]) break;
        output.push(operators.pop() as Token);
      }
      operators.push(token);
      continue;
    }

    if (token.type === 'paren' && token.value === '(') {
      operators.push(token);
      continue;
    }

    if (token.type === 'paren' && token.value === ')') {
      let found = false;
      while (operators.length > 0) {
        const top = operators.pop() as Token;
        if (top.type === 'paren' && top.value === '(') {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) {
        throw new Error('Mismatched parentheses in formula.');
      }
    }
  }

  while (operators.length > 0) {
    const token = operators.pop() as Token;
    if (token.type === 'paren') {
      throw new Error('Mismatched parentheses in formula.');
    }
    output.push(token);
  }

  return output;
}

export const extractFormulaIdentifiers = (expression: string): string[] => {
  if (!expression.trim()) return [];
  const tokens = tokenize(expression);
  const identifiers = tokens
    .filter((t) => t.type === 'identifier')
    .map((t) => (t as { type: 'identifier'; value: string }).value);
  return Array.from(new Set(identifiers));
};

export const evaluateFormula = (
  expression: string,
  context: Record<string, number>,
): number => {
  if (!expression.trim()) {
    throw new Error('Formula expression cannot be empty.');
  }

  const rpn = toRpn(tokenize(expression));
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value);
      continue;
    }

    if (token.type === 'identifier') {
      if (!(token.value in context)) {
        throw new Error(`Unknown identifier "${token.value}" in formula.`);
      }
      stack.push(context[token.value] as number);
      continue;
    }

    if (token.type === 'operator') {
      const right = stack.pop();
      const left = stack.pop();
      if (left == null || right == null) {
        throw new Error('Invalid formula. Could not evaluate expression.');
      }

      switch (token.value) {
        case '+':
          stack.push(left + right);
          break;
        case '-':
          stack.push(left - right);
          break;
        case '*':
          stack.push(left * right);
          break;
        case '/':
          if (right === 0) {
            throw new Error('Division by zero in formula.');
          }
          stack.push(left / right);
          break;
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid formula. Could not evaluate expression.');
  }
  return stack[0] as number;
};
