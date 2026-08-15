/** Map common Moment tokens onto Tempo/Java tokens. */
export function mapMomentPattern(pattern: string): string {
  let out = '';
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end === -1) {
        out += `'${pattern.slice(i)}'`;
        break;
      }
      out += `'${pattern.slice(i + 1, end).replace(/'/g, "''")}'`;
      i = end + 1;
      continue;
    }
    const rest = pattern.slice(i);
    const mapped = matchToken(rest);
    if (mapped) {
      out += mapped.tempo;
      i += mapped.consumed;
      continue;
    }
    out += quoteIfNeeded(pattern[i]!);
    i += 1;
  }
  return out;
}

function matchToken(rest: string): { tempo: string; consumed: number } | null {
  const table: Array<[string, string]> = [
    ['YYYY', 'yyyy'],
    ['YY', 'yy'],
    ['Y', 'y'],
    ['MMMM', 'MMMM'],
    ['MMM', 'MMM'],
    ['MM', 'MM'],
    ['M', 'M'],
    ['DD', 'dd'],
    ['D', 'd'],
    ['dddd', 'EEEE'],
    ['ddd', 'EEE'],
    ['HH', 'HH'],
    ['H', 'H'],
    ['hh', 'hh'],
    ['h', 'h'],
    ['mm', 'mm'],
    ['m', 'm'],
    ['ss', 'ss'],
    ['s', 's'],
    ['SSS', 'SSS'],
    ['A', 'a'],
    ['a', 'a'],
    ['ZZ', 'XX'],
    ['Z', 'XXX'],
  ];
  for (const [moment, tempo] of table) {
    if (rest.startsWith(moment)) return { tempo, consumed: moment.length };
  }
  return null;
}

function quoteIfNeeded(ch: string): string {
  if (/[A-Za-z]/u.test(ch)) return `'${ch}'`;
  return ch;
}
