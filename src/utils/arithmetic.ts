// Arithmetic-only parser allows a strict CSP without JavaScript evaluation.
export function arithmetic(expression: string): number {
  if (!expression || expression.length > 500 || /[^\d\s+\-*/().]/.test(expression)) throw new Error('Invalid expression');
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()]/g) || [];
  if (tokens.length > 200 || tokens.join('') !== expression.replace(/\s/g, '')) throw new Error('Invalid expression');
  let index = 0;
  const term = (depth: number): number => {
    if (depth > 32) throw new Error('Expression too deep');
    const token = tokens[index++];
    if (token === '+') return term(depth + 1);
    if (token === '-') return -term(depth + 1);
    if (token === '(') { const result = sum(depth + 1); if (tokens[index++] !== ')') throw new Error('Missing parenthesis'); return result; }
    if (!token || !/^\d|^\.\d/.test(token)) throw new Error('Missing number');
    return Number(token);
  };
  const product = (depth: number): number => { let result = term(depth); while (['*', '/'].includes(tokens[index])) { const op = tokens[index++]; const next = term(depth); result = op === '*' ? result * next : result / next; } return result; };
  const sum = (depth: number): number => { let result = product(depth); while (['+', '-'].includes(tokens[index])) { const op = tokens[index++]; const next = product(depth); result = op === '+' ? result + next : result - next; } return result; };
  const result = sum(0);
  if (index !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1e9) throw new Error('Result out of range');
  return Math.round(result * 100) / 100;
}
