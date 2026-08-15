import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  formatISO,
  getUnixTime,
  isLeapYear,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { Instant } from '../../src/core/instant.js';
import { LocalDate } from '../../src/core/local-date.js';

// date-fns has no IANA zone support and works on host-local Dates, so the
// comparison stays on date-only calendar math and UTC instants — the
// non-ambiguous layer (docs/TESTING.md priority 4).

const isoDate = (d: Date): string => formatISO(d, { representation: 'date' });

describe('differential vs date-fns', () => {
  it('parses ISO dates identically', () => {
    for (const iso of ['2026-06-01', '2024-02-29', '1999-12-31', '2100-02-28']) {
      expect(isoDate(parseISO(iso))).toBe(LocalDate.parse(iso).toISO());
    }
  });

  it('agrees on calendar arithmetic (constrain month-end)', () => {
    expect(isoDate(addDays(parseISO('2026-06-01'), 40))).toBe(
      LocalDate.of(2026, 6, 1).plus({ days: 40 }).toISO(),
    );
    expect(isoDate(addMonths(parseISO('2026-01-31'), 1))).toBe(
      LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO(),
    );
    expect(isoDate(addYears(parseISO('2024-02-29'), 1))).toBe(
      LocalDate.of(2024, 2, 29).plus({ years: 1 }).toISO(),
    );
  });

  it('agrees on instant epoch milliseconds', () => {
    for (const iso of ['2026-06-01T12:00:00Z', '2026-06-01T14:00:00+02:00', '2026-01-01T00:00:00-05:00']) {
      expect(parseISO(iso).getTime()).toBe(Instant.parse(iso).epochMillis);
    }
  });

  it('agrees on unix seconds', () => {
    expect(getUnixTime(parseISO('2026-01-01T00:00:00Z'))).toBe(
      Instant.parse('2026-01-01T00:00:00Z').toEpochSeconds(),
    );
  });

  it('agrees on leap years', () => {
    const cases: Array<[number, boolean]> = [
      [2024, true],
      [1900, false],
      [2000, true],
      [2100, false],
    ];
    for (const [year, expected] of cases) {
      expect(isLeapYear(parseISO(`${year}-06-01`))).toBe(expected);
      expect(LocalDate.of(year, 1, 1).isLeapYear()).toBe(expected);
    }
  });

  it('agrees on calendar-day differences', () => {
    expect(differenceInCalendarDays(parseISO('2026-07-11'), parseISO('2026-06-01'))).toBe(
      LocalDate.parse('2026-06-01').until(LocalDate.parse('2026-07-11'), 'day'),
    );
  });

  it('agrees on start/end of month', () => {
    expect(isoDate(startOfMonth(parseISO('2026-06-15')))).toBe(
      LocalDate.of(2026, 6, 15).startOf('month').toISO(),
    );
    expect(isoDate(endOfMonth(parseISO('2026-06-15')))).toBe(
      LocalDate.of(2026, 6, 15).endOf('month').toISO(),
    );
    expect(isoDate(endOfMonth(parseISO('2024-02-15')))).toBe(
      LocalDate.of(2024, 2, 15).endOf('month').toISO(),
    );
  });
});
