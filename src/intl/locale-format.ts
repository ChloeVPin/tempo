import { utcMillis, type Instant } from '../core/instant.js';
import type { LocalDate } from '../core/local-date.js';
import type { LocalDateTime } from '../core/local-datetime.js';
import type { LocalTime } from '../core/local-time.js';
import type { ZonedDateTime } from '../tz/zoned-datetime.js';
import { TempoError } from '../errors.js';
import { getDateTimeFormat } from './formatter-cache.js';

export type LocaleFormattable = LocalDate | LocalTime | LocalDateTime | Instant | ZonedDateTime;

export function toLocaleString(
  value: LocaleFormattable,
  locale?: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const { date, timeZone } = toDateAndZone(value);
  return getDateTimeFormat(locale, { ...options, timeZone }).format(date);
}

function toDateAndZone(value: LocaleFormattable): { date: Date; timeZone?: string } {
  if ('epochMillis' in value) {
    return {
      date: new Date(value.epochMillis),
      timeZone: 'timeZone' in value ? value.timeZone : 'UTC',
    };
  }
  if ('year' in value) {
    const hour = 'hour' in value ? value.hour : 0;
    const minute = 'minute' in value ? value.minute : 0;
    const second = 'second' in value ? value.second : 0;
    const millisecond = 'millisecond' in value ? value.millisecond : 0;
    // `utcMillis` uses `setUTCFullYear`, which keeps years 0-99 literal; `Date.UTC`
    // would map them to 1900-1999 and format the wrong year (and weekday).
    const ms = utcMillis(value.year, value.month, value.day, hour, minute, second, millisecond);
    if (ms === null) {
      throw new TempoError('INVALID_DATE', 'Value is not representable as UTC millis', {
        input: String(value),
      });
    }
    return { date: new Date(ms), timeZone: 'UTC' };
  }
  return {
    date: new Date(Date.UTC(1970, 0, 1, value.hour, value.minute, value.second, value.millisecond)),
    timeZone: 'UTC',
  };
}
