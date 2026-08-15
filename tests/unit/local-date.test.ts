import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { TempoError } from '../../src/errors.js';

describe('LocalDate', () => {
  it('parses and formats ISO dates', () => {
    const d = LocalDate.parse('2026-06-01');
    expect(d.year).toBe(2026);
    expect(d.month).toBe(6);
    expect(d.day).toBe(1);
    expect(d.toISO()).toBe('2026-06-01');
    expect(LocalDate.parse(d.toISO()).equals(d)).toBe(true);
  });

  it('rejects invalid calendar dates', () => {
    expect(() => LocalDate.parse('2026-02-30')).toThrow(TempoError);
    expect(() => LocalDate.parse('2025-02-29')).toThrow(TempoError);
    expect(() => LocalDate.parse('2026-04-31')).toThrow(TempoError);
    expect(() => LocalDate.parse('01/02/2026')).toThrow(TempoError);
    expect(LocalDate.tryParse('2026-02-30').ok).toBe(false);
  });

  it('constrains month-end arithmetic by default', () => {
    expect(LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO()).toBe('2026-02-28');
    expect(LocalDate.of(2024, 2, 29).plus({ years: 1 }).toISO()).toBe('2025-02-28');
  });

  it('rejects overflow when asked', () => {
    expect(() => LocalDate.of(2026, 1, 31).plus({ months: 1 }, { overflow: 'reject' })).toThrow(
      TempoError,
    );
  });

  it('adds days as a group', () => {
    const d = LocalDate.of(2026, 6, 1);
    expect(d.plus({ days: 10 }).minus({ days: 10 }).equals(d)).toBe(true);
    expect(d.until(d.plus({ days: 40 }), 'day')).toBe(40);
  });

  it('computes start and end of units', () => {
    const d = LocalDate.of(2026, 6, 15);
    expect(d.startOf('month').toISO()).toBe('2026-06-01');
    expect(d.endOf('month').toISO()).toBe('2026-06-30');
    expect(d.startOf('year').toISO()).toBe('2026-01-01');
    expect(d.endOf('year').toISO()).toBe('2026-12-31');
    expect(d.startOf('week').dayOfWeek()).toBe(1);
    expect(d.endOf('week').dayOfWeek()).toBe(7);
  });

  it('compares and tests ranges', () => {
    const a = LocalDate.of(2026, 1, 1);
    const b = LocalDate.of(2026, 1, 10);
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isSame(LocalDate.parse('2026-01-01'))).toBe(true);
    expect(LocalDate.of(2026, 1, 5).isBetween(a, b)).toBe(true);
    expect(a.isBetween(a, b, '[)')).toBe(true);
    expect(b.isBetween(a, b, '[)')).toBe(false);
  });

  it('parses ISO week dates', () => {
    expect(LocalDate.parse('2026-W01-4').toISO()).toBe('2026-01-01');
  });

  it('is immutable', () => {
    const d = LocalDate.of(2026, 1, 1);
    const next = d.plus({ days: 1 });
    expect(d.toISO()).toBe('2026-01-01');
    expect(next.toISO()).toBe('2026-01-02');
  });
});
