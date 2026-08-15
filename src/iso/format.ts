import type { Instant } from '../core/instant.js';
import type { LocalDate } from '../core/local-date.js';
import type { LocalDateTime } from '../core/local-datetime.js';
import type { LocalTime } from '../core/local-time.js';
import type { Duration } from '../core/duration.js';
import type { ZonedDateTime } from '../tz/zoned-datetime.js';

export function toISO(
  value: LocalDate | LocalTime | LocalDateTime | Instant | ZonedDateTime | Duration,
): string {
  return value.toISO();
}
