import { describe, expect, it } from 'vitest';
import * as Tempo from '../../src/index.js';
import { Instant } from '../../src/core/instant.js';
import { LocalDate } from '../../src/core/local-date.js';
import { TempoError } from '../../src/errors.js';

describe('Interval', () => {
  it('is exported from the main package', () => {
    expect(Tempo).toHaveProperty('Interval');
  });

  it('uses half-open containment and allows an empty interval', () => {
    const start = Instant.parse('2026-06-01T00:00:00Z');
    const end = start.plus({ days: 1 });
    const interval = Tempo.Interval.of(start, end);

    expect(interval.start).toBe(start);
    expect(interval.end).toBe(end);
    expect(interval.contains(start)).toBe(true);
    expect(interval.contains(end)).toBe(false);
    expect(interval.contains(start.plus({ hours: 12 }))).toBe(true);
    const empty = Tempo.Interval.of(start, start);
    expect(empty.isEmpty()).toBe(true);
    expect(empty.contains(start)).toBe(false);
  });

  it('rejects an end before the start with a stable error code', () => {
    const start = Instant.parse('2026-06-02T00:00:00Z');
    const end = start.minus({ days: 1 });

    expect(() => Tempo.Interval.of(start, end)).toThrowError(TempoError);
    try {
      Tempo.Interval.of(start, end);
    } catch (error) {
      expect(error).toMatchObject({ code: 'INVALID_INTERVAL' });
    }
  });

  it('computes overlap, abutment, intersection, and union', () => {
    const day = (n: number) => Instant.parse(`2026-06-${String(n).padStart(2, '0')}T00:00:00Z`);
    const a = Tempo.Interval.of(day(1), day(4));
    const b = Tempo.Interval.of(day(3), day(6));
    const c = Tempo.Interval.of(day(4), day(7));
    const d = Tempo.Interval.of(day(8), day(9));

    expect(a.overlaps(b)).toBe(true);
    expect(a.intersection(b)?.equals(Tempo.Interval.of(day(3), day(4)))).toBe(true);
    expect(a.union(b)?.equals(Tempo.Interval.of(day(1), day(6)))).toBe(true);
    expect(a.abuts(c)).toBe(true);
    expect(a.overlaps(c)).toBe(false);
    expect(a.union(c)?.equals(Tempo.Interval.of(day(1), day(7)))).toBe(true);
    expect(a.intersection(c)).toBeNull();
    expect(a.union(d)).toBeNull();
  });

  it('works with LocalDate endpoints without converting them to instants', () => {
    const start = LocalDate.of(2026, 6, 1);
    const end = LocalDate.of(2026, 6, 8);
    const interval = Tempo.Interval.of(start, end);

    expect(interval.contains(LocalDate.of(2026, 6, 7))).toBe(true);
    expect(interval.contains(end)).toBe(false);
  });

  it('rejects endpoints that do not produce an ordered comparison', () => {
    const incomparable = { compare: () => Number.NaN };

    expect(() => Tempo.Interval.of(incomparable, incomparable)).toThrowError(TempoError);
  });

  it('provides a LocalDate-focused DateRange factory', () => {
    const range = Tempo.DateRange.of(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 8));

    expect(range.contains(LocalDate.of(2026, 6, 7))).toBe(true);
    expect(range.contains(LocalDate.of(2026, 6, 8))).toBe(false);
  });
});
