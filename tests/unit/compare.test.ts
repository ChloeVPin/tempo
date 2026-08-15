import { describe, expect, it } from 'vitest';
import { compareValues, isBetween } from '../../src/core/compare.js';
import { LocalDate } from '../../src/core/local-date.js';

describe('compare helpers', () => {
  it('orders numbers', () => {
    expect(compareValues(1, 2)).toBe(-1);
    expect(compareValues(2, 1)).toBe(1);
    expect(compareValues(2, 2)).toBe(0);
  });

  it('tests inclusivity ranges', () => {
    const a = LocalDate.of(2026, 1, 1);
    const b = LocalDate.of(2026, 1, 10);
    const mid = LocalDate.of(2026, 1, 5);
    expect(isBetween(mid, a, b)).toBe(true);
    expect(isBetween(a, a, b, '[)')).toBe(true);
    expect(isBetween(b, a, b, '[)')).toBe(false);
    expect(isBetween(a, a, b, '[]')).toBe(true);
    expect(isBetween(b, a, b, '[]')).toBe(true);
    expect(isBetween(a, a, b, '(]')).toBe(false);
    expect(isBetween(b, a, b, '(]')).toBe(true);
    expect(isBetween(LocalDate.of(2025, 12, 31), a, b, '[]')).toBe(false);
  });
});
