import { describe, expect, it } from 'vitest';
import {
  civilFromDays,
  constrainDate,
  daysFromCivil,
  daysInMonth,
  isLeapYear,
  isValidDate,
  isoDayOfWeek,
  isoWeekFields,
  requireValidDate,
} from '../../src/core/civil.js';
import { LocalDate } from '../../src/core/local-date.js';
import { TempoError } from '../../src/errors.js';

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (err) {
    return err instanceof TempoError ? err.code : `not a TempoError: ${String(err)}`;
  }
}

function errorOf(fn: () => unknown): TempoError {
  try {
    fn();
  } catch (err) {
    if (err instanceof TempoError) return err;
    throw err;
  }
  throw new Error('expected a TempoError');
}

describe('civil calendar', () => {
  it('knows leap years including century rules', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2400)).toBe(true);
    expect(isLeapYear(0)).toBe(true);
  });

  it('knows month lengths', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 13)).toBe(0);
  });

  it('maps 1970-01-01 to epoch day 0', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(civilFromDays(0)).toEqual({ year: 1970, month: 1, day: 1 });
    expect(daysFromCivil(1969, 12, 31)).toBe(-1);
    expect(daysFromCivil(1970, 1, 2)).toBe(1);
  });

  it('round-trips a sample of dates', () => {
    const samples: Array<[number, number, number]> = [
      [1, 1, 1],
      [1582, 10, 15],
      [1900, 2, 28],
      [2000, 2, 29],
      [2026, 8, 14],
      [9999, 12, 31],
      [-1, 12, 31],
      [0, 2, 29],
      [-400, 2, 29],
      [-401, 12, 31],
    ];
    for (const [y, m, d] of samples) {
      const day = daysFromCivil(y, m, d);
      expect(civilFromDays(day)).toEqual({ year: y, month: m, day: d });
    }
  });

  it('treats the unix epoch as Thursday / ISO 4', () => {
    expect(isoDayOfWeek(0)).toBe(4);
  });

  it('computes day-of-year and quarter', () => {
    expect(LocalDate.of(2026, 1, 1).dayOfYear()).toBe(1);
    expect(LocalDate.of(2026, 12, 31).dayOfYear()).toBe(365);
    expect(LocalDate.of(2024, 12, 31).dayOfYear()).toBe(366); // leap year
    expect(LocalDate.of(2026, 3, 1).dayOfYear()).toBe(60);
    expect(LocalDate.of(2026, 1, 1).quarter()).toBe(1);
    expect(LocalDate.of(2026, 3, 31).quarter()).toBe(1);
    expect(LocalDate.of(2026, 4, 1).quarter()).toBe(2);
    expect(LocalDate.of(2026, 12, 31).quarter()).toBe(4);
  });

  it('computes ISO week-year around the 2025/2026 boundary', () => {
    expect(isoWeekFields(2025, 12, 29)).toEqual({ weekYear: 2026, week: 1, weekday: 1 });
    expect(isoWeekFields(2026, 1, 1)).toEqual({ weekYear: 2026, week: 1, weekday: 4 });
    expect(isoWeekFields(2026, 1, 4)).toEqual({ weekYear: 2026, week: 1, weekday: 7 });
  });

  it('rejects invalid and non-integer dates', () => {
    expect(isValidDate(2026.5, 1, 1)).toBe(false);
    expect(isValidDate(2026, 1.5, 1)).toBe(false);
    expect(isValidDate(2026, 1, 1.5)).toBe(false);
    expect(isValidDate(2026, 0, 1)).toBe(false);
    expect(isValidDate(2026, 13, 1)).toBe(false);
    expect(isValidDate(2026, 1, 0)).toBe(false);
    expect(isValidDate(2026, 2, 30)).toBe(false);
    expect(isValidDate(2026, 1, 32)).toBe(false);
    expect(isValidDate(9_999_999, 1, 1)).toBe(false);
    // Boundary days: month 1/12, day 1/last must stay valid.
    expect(isValidDate(2026, 1, 15)).toBe(true);
    expect(isValidDate(2026, 12, 15)).toBe(true);
    expect(isValidDate(2026, 6, 1)).toBe(true);
    expect(isValidDate(2026, 6, 30)).toBe(true);
  });

  it('requireValidDate throws stable codes and carries the input', () => {
    expect(codeOf(() => requireValidDate(2026.5, 1, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => requireValidDate(2026, 0, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => requireValidDate(2026, 13, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => requireValidDate(2026, 1, 0))).toBe('INVALID_MONTH_DAY');
    expect(codeOf(() => requireValidDate(2026, 2, 30))).toBe('INVALID_MONTH_DAY');
    expect(codeOf(() => requireValidDate(9_999_999, 1, 1))).toBe('OUT_OF_RANGE');
    const err = errorOf(() => requireValidDate(2026, 2, 30));
    expect(err.message).toContain('Day 30 is out of range for 2026-02');
    expect(err.input).toEqual({ year: 2026, month: 2, day: 30 });
    const intErr = errorOf(() => requireValidDate(2026.5, 1, 1));
    expect(intErr.message).toContain('Date fields must be integers');
    expect(intErr.input).toEqual({ year: 2026.5, month: 1, day: 1 });
    const monthErr = errorOf(() => requireValidDate(2026, 0, 1));
    expect(monthErr.message).toContain('Month 0 is out of range 1-12');
    expect(monthErr.input).toEqual({ year: 2026, month: 0, day: 1 });
    const rangeErr = errorOf(() => requireValidDate(9_999_999, 1, 1));
    expect(rangeErr.message).toContain('is out of range');
    expect(rangeErr.input).toEqual({ year: 9_999_999, month: 1, day: 1 });
  });

  it('constrains out-of-range months and days', () => {
    expect(constrainDate(2026, 0, 15)).toEqual({ year: 2026, month: 1, day: 15 });
    expect(constrainDate(2026, 13, 15)).toEqual({ year: 2026, month: 12, day: 15 });
    expect(constrainDate(2026, 6, 0)).toEqual({ year: 2026, month: 6, day: 1 });
    expect(constrainDate(2026, 6, 32)).toEqual({ year: 2026, month: 6, day: 30 });
    expect(constrainDate(2024, 2, 30)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(codeOf(() => constrainDate(2026.5, 1, 1))).toBe('INVALID_DATE');
  });

  it('validates ISO week construction', () => {
    // Week 53 of 2026 exists (Jan 1 is a Thursday); 2027 has only 52 weeks.
    expect(LocalDate.ofIsoWeek(2026, 1, 1).toISO()).toBe('2025-12-29');
    expect(LocalDate.ofIsoWeek(2026, 1, 7).toISO()).toBe('2026-01-04');
    expect(LocalDate.ofIsoWeek(2026, 53, 1).toISO()).toBe('2026-12-28');
    expect(codeOf(() => LocalDate.ofIsoWeek(2026.5, 1, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => LocalDate.ofIsoWeek(2026, 0, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => LocalDate.ofIsoWeek(2026, 54, 1))).toBe('INVALID_DATE');
    expect(codeOf(() => LocalDate.ofIsoWeek(2026, 1, 0))).toBe('INVALID_DATE');
    expect(codeOf(() => LocalDate.ofIsoWeek(2026, 1, 8))).toBe('INVALID_DATE');
    expect(codeOf(() => LocalDate.ofIsoWeek(2027, 53, 1))).toBe('INVALID_DATE');
    const intWeek = errorOf(() => LocalDate.ofIsoWeek(2026.5, 1, 1));
    expect(intWeek.message).toContain('ISO week fields must be integers');
    expect(intWeek.input).toEqual({ weekYear: 2026.5, week: 1, weekday: 1 });
    const weekdayWeek = errorOf(() => LocalDate.ofIsoWeek(2026, 1, 8));
    expect(weekdayWeek.message).toContain('ISO weekday 8 is out of range 1-7');
    expect(weekdayWeek.input).toEqual({ weekYear: 2026, week: 1, weekday: 8 });
    const weekdayZero = errorOf(() => LocalDate.ofIsoWeek(2026, 1, 0));
    expect(weekdayZero.message).toContain('ISO weekday 0 is out of range 1-7');
    const weekNum = errorOf(() => LocalDate.ofIsoWeek(2026, 54, 1));
    expect(weekNum.message).toContain('ISO week 54 is out of range 1-53');
    expect(weekNum.input).toEqual({ weekYear: 2026, week: 54, weekday: 1 });
    const weekZero = errorOf(() => LocalDate.ofIsoWeek(2026, 0, 1));
    expect(weekZero.message).toContain('ISO week 0 is out of range 1-53');
    const missingWeek = errorOf(() => LocalDate.ofIsoWeek(2027, 53, 1));
    expect(missingWeek.message).toContain('ISO week 2027-W53 does not exist');
    expect(missingWeek.input).toEqual({ weekYear: 2027, week: 53, weekday: 1 });
  });

  it('formats years beyond four digits and negative years', () => {
    expect(LocalDate.of(0, 1, 1).toISO()).toBe('0000-01-01');
    expect(LocalDate.of(-1, 12, 31).toISO()).toBe('-0001-12-31');
    expect(LocalDate.of(-9999, 1, 1).toISO()).toBe('-9999-01-01');
    expect(LocalDate.of(-10000, 1, 1).toISO()).toBe('-10000-01-01');
    expect(LocalDate.of(9999, 12, 31).toISO()).toBe('9999-12-31');
    expect(LocalDate.of(10000, 1, 1).toISO()).toBe('+10000-01-01');
    for (const iso of ['0000-01-01', '-0001-12-31', '-9999-01-01', '-10000-01-01', '+10000-01-01']) {
      expect(LocalDate.parse(iso).toISO()).toBe(iso);
    }
  });
});
