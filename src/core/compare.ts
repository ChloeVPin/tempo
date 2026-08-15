export type Comparable = {
  compare(other: never): number;
};

export function compareValues(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBetween<T extends { compare(other: T): number }>(
  value: T,
  start: T,
  end: T,
  inclusivity: '()' | '[]' | '[)' | '(]' = '[)',
): boolean {
  const afterStart = inclusivity[0] === '[' ? value.compare(start) >= 0 : value.compare(start) > 0;
  const beforeEnd = inclusivity[1] === ']' ? value.compare(end) <= 0 : value.compare(end) < 0;
  return afterStart && beforeEnd;
}
