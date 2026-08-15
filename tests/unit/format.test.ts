import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { format } from '../../src/format/format.js';
import { Instant } from '../../src/core/instant.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

describe('format', () => {
  it('formats civil dates with Java/Temporal tokens', () => {
    const d = LocalDate.of(2026, 6, 1);
    expect(format(d, 'yyyy-MM-dd')).toBe('2026-06-01');
    expect(format(d, 'dd/MM/yyyy')).toBe('01/06/2026');
    expect(format(d, "yyyy-MM-dd 'ok'")).toBe('2026-06-01 ok');
  });

  it('formats times and offsets', () => {
    const zdt = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    expect(format(zdt, 'HH:mm XXX')).toBe('12:00 -04:00');
    expect(format(LocalDateTime.of(2026, 1, 1, 0, 5), 'hh:mm a', { locale: 'en-US' })).toBe(
      '12:05 AM',
    );
  });

  it('localizes the day-period token instead of hard-coding AM/PM', () => {
    const morning = LocalDateTime.of(2026, 1, 1, 0, 5);
    const afternoon = LocalDateTime.of(2026, 1, 1, 13, 5);
    expect(format(morning, 'a', { locale: 'en-US' })).toBe('AM');
    expect(format(afternoon, 'a', { locale: 'en-US' })).toBe('PM');
    expect(format(morning, 'aa', { locale: 'en-US' })).toBe('AM');
    // A locale whose day periods are not the Latin letters proves it is
    // actually localized, not a constant.
    expect(format(morning, 'a', { locale: 'zh-CN' })).not.toBe('AM');
    expect(format(afternoon, 'a', { locale: 'zh-CN' })).not.toBe('PM');
  });

  it('formats weekdays for years 0-99 without Date.UTC 1900 drift', () => {
    const weekday = (year: number, name: string) => {
      const zdt = LocalDateTime.of(year, 1, 1, 0, 0).toZonedDateTime('UTC') as ZonedDateTime;
      expect(format(zdt, 'EEEE', { locale: 'en-US' })).toBe(name);
    };
    weekday(0, 'Saturday');
    weekday(50, 'Saturday');
    weekday(99, 'Thursday');
    // Controls already correct before the fix:
    weekday(100, 'Friday');
    weekday(1970, 'Thursday');
  });
});
