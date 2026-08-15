export type TokenKind =
  | 'year'
  | 'month'
  | 'day'
  | 'weekday'
  | 'hour24'
  | 'hour12'
  | 'minute'
  | 'second'
  | 'millisecond'
  | 'dayPeriod'
  | 'offset'
  | 'zone'
  | 'literal';

export interface FormatToken {
  readonly kind: TokenKind;
  readonly text: string;
  readonly length: number;
}

const TOKEN_PATTERN =
  /yyyy|uuuu|yyyyy|yy|y|MMMM|MMM|MM|M|dd|d|EEEE|EEE|E|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|aaa|aa|a|XXXXX|XXXX|XXX|XX|X|zzzz|zzz|z|'[^']*(?:''[^']*)*'/uy;

export function tokenize(pattern: string): FormatToken[] {
  const tokens: FormatToken[] = [];
  let i = 0;
  while (i < pattern.length) {
    TOKEN_PATTERN.lastIndex = i;
    const match = TOKEN_PATTERN.exec(pattern);
    if (match && match.index === i) {
      const text = match[0]!;
      if (text.startsWith("'")) {
        tokens.push({
          kind: 'literal',
          text: text.slice(1, -1).replace(/''/g, "'"),
          length: text.length,
        });
      } else {
        tokens.push({ kind: kindOf(text), text, length: text.length });
      }
      i += text.length;
      continue;
    }
    tokens.push({ kind: 'literal', text: pattern[i]!, length: 1 });
    i += 1;
  }
  return tokens;
}

function kindOf(text: string): TokenKind {
  if (text[0] === 'y' || text[0] === 'u') return 'year';
  if (text[0] === 'M') return 'month';
  if (text[0] === 'd') return 'day';
  if (text[0] === 'E') return 'weekday';
  if (text[0] === 'H') return 'hour24';
  if (text[0] === 'h') return 'hour12';
  if (text[0] === 'm') return 'minute';
  if (text[0] === 's' && text[0] === text[1]) return text === 'ss' ? 'second' : 'millisecond';
  if (text[0] === 's') return text.startsWith('S') ? 'millisecond' : 'second';
  if (text[0] === 'S') return 'millisecond';
  if (text[0] === 'a') return 'dayPeriod';
  if (text[0] === 'X') return 'offset';
  if (text[0] === 'z') return 'zone';
  return 'literal';
}
