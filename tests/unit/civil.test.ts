import { describe, expect, it } from 'vitest';
import {
  civilFromDays,
  daysFromCivil,
  daysInMonth,
  isLeapYear,
  isoDayOfWeek,
  isoWeekFields,
} from '../../src/core/civil.js';

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

  it('computes ISO week-year around the 2025/2026 boundary', () => {
    expect(isoWeekFields(2025, 12, 29)).toEqual({ weekYear: 2026, week: 1, weekday: 1 });
    expect(isoWeekFields(2026, 1, 1)).toEqual({ weekYear: 2026, week: 1, weekday: 4 });
    expect(isoWeekFields(2026, 1, 4)).toEqual({ weekYear: 2026, week: 1, weekday: 7 });
  });
});
