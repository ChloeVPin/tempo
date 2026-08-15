import type { Instant } from '../core/instant.js';
import type { LocalDate } from '../core/local-date.js';
import type { LocalDateTime } from '../core/local-datetime.js';
import type { LocalTime } from '../core/local-time.js';
import type { ZonedDateTime } from '../tz/zoned-datetime.js';
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
  if ('hour' in value && 'year' in value) {
    return {
      date: new Date(
        Date.UTC(
          value.year,
          value.month - 1,
          value.day,
          value.hour,
          value.minute,
          value.second,
          value.millisecond,
        ),
      ),
      timeZone: 'UTC',
    };
  }
  if ('year' in value) {
    return {
      date: new Date(Date.UTC(value.year, value.month - 1, value.day)),
      timeZone: 'UTC',
    };
  }
  return {
    date: new Date(Date.UTC(1970, 0, 1, value.hour, value.minute, value.second, value.millisecond)),
    timeZone: 'UTC',
  };
}
