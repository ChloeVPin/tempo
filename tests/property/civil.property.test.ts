import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { civilFromDays, daysFromCivil, isValidDate } from '../../src/core/civil.js';
import { LocalDate } from '../../src/core/local-date.js';

const civilArb = fc
  .tuple(
    fc.integer({ min: -2000, max: 4000 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 31 }),
  )
  .filter(([y, m, d]) => isValidDate(y, m, d));

describe('civil properties', () => {
  it('daysFromCivil ∘ civilFromDays is identity', () => {
    fc.assert(
      fc.property(fc.integer({ min: -200_000, max: 200_000 }), (day) => {
        const c = civilFromDays(day);
        expect(daysFromCivil(c.year, c.month, c.day)).toBe(day);
      }),
      { numRuns: 200 },
    );
  });

  it('ISO parse/format round-trips valid dates', () => {
    fc.assert(
      fc.property(civilArb, ([y, m, d]) => {
        const date = LocalDate.of(y, m, d);
        expect(LocalDate.parse(date.toISO()).equals(date)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('day arithmetic is invertible', () => {
    fc.assert(
      fc.property(civilArb, fc.integer({ min: -400, max: 400 }), ([y, m, d], n) => {
        const date = LocalDate.of(y, m, d);
        const moved = date.plus({ days: n });
        expect(moved.minus({ days: n }).equals(date)).toBe(true);
        expect(date.until(moved, 'day')).toBe(n);
      }),
      { numRuns: 150 },
    );
  });

  it('month arithmetic never produces an invalid day', () => {
    fc.assert(
      fc.property(civilArb, fc.integer({ min: -48, max: 48 }), ([y, m, d], n) => {
        const result = LocalDate.of(y, m, d).plus({ months: n });
        expect(result.day).toBeLessThanOrEqual(result.daysInMonth());
      }),
      { numRuns: 150 },
    );
  });

  it('comparison is a total order', () => {
    fc.assert(
      fc.property(civilArb, civilArb, (a, b) => {
        const left = LocalDate.of(...a);
        const right = LocalDate.of(...b);
        const cmp = left.compare(right);
        expect(right.compare(left)).toBe(-cmp || 0);
        if (cmp === 0) expect(left.equals(right)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
