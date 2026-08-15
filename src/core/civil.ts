import { TempoError } from '../errors.js';
import { isEpochDayInRange } from './range.js';

export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Toward-zero integer division, matching the C++ Hinnant algorithms. */
function truncDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month] ?? 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Unix epoch days for a civil date. Month is 1–12.
 * Howard Hinnant, "chrono-Compatible Low-Level Date Algorithms".
 */
export function daysFromCivil(year: number, month: number, day: number): number {
  let y = year;
  if (month <= 2) y -= 1;
  const era = truncDiv(y >= 0 ? y : y - 399, 400);
  const yoe = y - era * 400;
  const doy = truncDiv(153 * (month + (month > 2 ? -3 : 9)) + 2, 5) + day - 1;
  const doe = yoe * 365 + truncDiv(yoe, 4) - truncDiv(yoe, 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverse of {@link daysFromCivil}. */
export function civilFromDays(epochDay: number): CivilDate {
  const z = epochDay + 719468;
  const era = truncDiv(z >= 0 ? z : z - 146096, 146097);
  const doe = z - era * 146097;
  const yoe = truncDiv(doe - truncDiv(doe, 1460) + truncDiv(doe, 36524) - truncDiv(doe, 146096), 365);
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + truncDiv(yoe, 4) - truncDiv(yoe, 100));
  const mp = truncDiv(5 * doy + 2, 153);
  const day = doy - truncDiv(153 * mp + 2, 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  if (month <= 2) year += 1;
  return { year, month, day };
}

export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return isEpochDayInRange(daysFromCivil(year, month, day));
}

export function requireValidDate(year: number, month: number, day: number): CivilDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TempoError('INVALID_DATE', 'Date fields must be integers', {
      input: { year, month, day },
    });
  }
  if (month < 1 || month > 12) {
    throw new TempoError('INVALID_DATE', `Month ${month} is out of range 1-12`, {
      input: { year, month, day },
    });
  }
  const dim = daysInMonth(year, month);
  if (day < 1 || day > dim) {
    throw new TempoError(
      'INVALID_MONTH_DAY',
      `Day ${day} is out of range for ${year}-${pad2(month)} (1-${dim})`,
      { input: { year, month, day } },
    );
  }
  const epochDay = daysFromCivil(year, month, day);
  if (!isEpochDayInRange(epochDay)) {
    throw new TempoError('OUT_OF_RANGE', `Date ${year}-${pad2(month)}-${pad2(day)} is out of range`, {
      input: { year, month, day },
    });
  }
  return { year, month, day };
}

export function constrainDate(year: number, month: number, day: number): CivilDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TempoError('INVALID_DATE', 'Date fields must be integers', {
      input: { year, month, day },
    });
  }
  const y = year;
  let m = month;
  if (m < 1) m = 1;
  if (m > 12) m = 12;
  const dim = daysInMonth(y, m);
  let d = day;
  if (d < 1) d = 1;
  if (d > dim) d = dim;
  return requireValidDate(y, m, d);
}

/** ISO day of week: Monday = 1 … Sunday = 7. Unix epoch is Thursday. */
export function isoDayOfWeek(epochDay: number): number {
  return ((epochDay + 3) % 7 + 7) % 7 + 1;
}

export function dayOfYear(year: number, month: number, day: number): number {
  return daysFromCivil(year, month, day) - daysFromCivil(year, 1, 1) + 1;
}

export function quarterOf(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

/**
 * ISO week-year, week (1–53), and weekday (1–7).
 * Week 1 is the week containing the first Thursday.
 */
export function isoWeekFields(year: number, month: number, day: number): {
  weekYear: number;
  week: number;
  weekday: number;
} {
  const epochDay = daysFromCivil(year, month, day);
  const weekday = isoDayOfWeek(epochDay);
  const thursday = epochDay + (4 - weekday);
  const weekYear = civilFromDays(thursday).year;
  const jan4 = daysFromCivil(weekYear, 1, 4);
  const week1Monday = jan4 - (isoDayOfWeek(jan4) - 1);
  const week = Math.floor((epochDay - week1Monday) / 7) + 1;
  return { weekYear, week, weekday };
}

export function dateFromIsoWeek(weekYear: number, week: number, weekday: number): CivilDate {
  if (!Number.isInteger(weekYear) || !Number.isInteger(week) || !Number.isInteger(weekday)) {
    throw new TempoError('INVALID_DATE', 'ISO week fields must be integers', {
      input: { weekYear, week, weekday },
    });
  }
  if (weekday < 1 || weekday > 7) {
    throw new TempoError('INVALID_DATE', `ISO weekday ${weekday} is out of range 1-7`, {
      input: { weekYear, week, weekday },
    });
  }
  if (week < 1 || week > 53) {
    throw new TempoError('INVALID_DATE', `ISO week ${week} is out of range 1-53`, {
      input: { weekYear, week, weekday },
    });
  }
  const jan4 = daysFromCivil(weekYear, 1, 4);
  const week1Monday = jan4 - (isoDayOfWeek(jan4) - 1);
  const epochDay = week1Monday + (week - 1) * 7 + (weekday - 1);
  const civil = civilFromDays(epochDay);
  const fields = isoWeekFields(civil.year, civil.month, civil.day);
  if (fields.weekYear !== weekYear || fields.week !== week) {
    throw new TempoError('INVALID_DATE', `ISO week ${weekYear}-W${pad2(week)} does not exist`, {
      input: { weekYear, week, weekday },
    });
  }
  return civil;
}

export function pad2(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + (abs < 10 ? `0${abs}` : String(abs));
}

export function pad4(n: number): string {
  if (n >= 0 && n < 10000) return String(n).padStart(4, '0');
  if (n < 0 && n > -10000) return `-${String(Math.abs(n)).padStart(4, '0')}`;
  return n >= 0 ? `+${n}` : String(n);
}
