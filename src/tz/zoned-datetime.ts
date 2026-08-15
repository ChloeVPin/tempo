import { nowMs } from '../clock.js';
import { Instant, parseInstantFields } from '../core/instant.js';
import { LocalDate } from '../core/local-date.js';
import { LocalDateTime } from '../core/local-datetime.js';
import { LocalTime } from '../core/local-time.js';
import { Duration } from '../core/duration.js';
import { registerZonedFactory } from '../core/instant.js';
import { registerLocalZonedFactory } from '../core/local-datetime.js';
import { TempoError, type ParseResult, unwrapParse } from '../errors.js';
import type {
  ArithmeticOptions,
  DateTimeUnit,
  DurationLike,
  Overflow,
  WithDateTimeFields,
  ZoneOptions,
} from '../types.js';
import { resolveLocalInstant } from './disambiguate.js';
import { formatOffset } from './offset.js';
import { intlTimeZoneProvider } from './intl-provider.js';
import type { TimeZoneProvider } from './types.js';

let provider: TimeZoneProvider = intlTimeZoneProvider;

export function getTimeZoneProvider(): TimeZoneProvider {
  return provider;
}

export function setTimeZoneProvider(next: TimeZoneProvider): () => void {
  const previous = provider;
  provider = next;
  return () => {
    provider = previous;
  };
}

export class ZonedDateTime {
  readonly epochMillis: number;
  readonly timeZone: string;
  readonly offsetMs: number;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;

  private constructor(
    readonly instant: Instant,
    timeZone: string,
    offsetMs: number,
    readonly local: LocalDateTime,
  ) {
    this.epochMillis = instant.epochMillis;
    this.timeZone = timeZone;
    this.offsetMs = offsetMs;
    this.year = local.year;
    this.month = local.month;
    this.day = local.day;
    this.hour = local.hour;
    this.minute = local.minute;
    this.second = local.second;
    this.millisecond = local.millisecond;
  }

  static fromInstant(instant: Instant, timeZone: string): ZonedDateTime {
    const offsetMs = provider.getOffsetMs(instant.epochMillis, timeZone);
    const localMs = instant.epochMillis + offsetMs;
    const date = new Date(localMs);
    const local = LocalDateTime.of(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    );
    return new ZonedDateTime(instant, timeZone, offsetMs, local);
  }

  static fromLocal(
    local: LocalDateTime,
    timeZone: string,
    options: ZoneOptions = {},
  ): ZonedDateTime {
    const epochMs = resolveLocalInstant(
      local,
      timeZone,
      provider,
      options.disambiguation ?? 'compatible',
    );
    return ZonedDateTime.fromInstant(Instant.ofEpochMillis(epochMs), timeZone);
  }

  static now(timeZone: string = provider.guess()): ZonedDateTime {
    return ZonedDateTime.fromInstant(Instant.ofEpochMillis(nowMs()), timeZone);
  }

  static parse(input: string, options: ZoneOptions = {}): ZonedDateTime {
    return unwrapParse(ZonedDateTime.tryParse(input, options));
  }

  static tryParse(input: string, options: ZoneOptions = {}): ParseResult<ZonedDateTime> {
    if (typeof input !== 'string') {
      return { ok: false, reason: 'INVALID_PARSE', message: 'Expected a string', input: String(input) };
    }
    const parsed = parseInstantFields(input);
    if (!parsed.ok) return parsed;
    const zone = parsed.value.zone;
    try {
      if (zone) {
        const instant = Instant.ofEpochMillis(parsed.value.epochMillis);
        return { ok: true, value: ZonedDateTime.fromInstant(instant, zone) };
      }
      const local = LocalDateTime.parse(stripZone(input));
      const offsetId = offsetIdFromMs(parsed.value.offsetMs);
      return { ok: true, value: ZonedDateTime.fromLocal(local, offsetId, options) };
    } catch (err) {
      const message = err instanceof TempoError ? err.message : 'Invalid zoned date-time';
      const reason = err instanceof TempoError ? err.code : 'INVALID_PARSE';
      return { ok: false, reason, message, input };
    }
  }

  static compare(a: ZonedDateTime, b: ZonedDateTime): number {
    return Instant.compare(a.instant, b.instant);
  }

  get date(): LocalDate {
    return this.local.date;
  }

  get time(): LocalTime {
    return this.local.time;
  }

  with(
    fields: WithDateTimeFields,
    options: ZoneOptions & { overflow?: Overflow } = {},
  ): ZonedDateTime {
    const local = this.local.with(fields, options.overflow ?? 'constrain');
    return ZonedDateTime.fromLocal(local, this.timeZone, options);
  }

  withTimeZone(timeZone: string): ZonedDateTime {
    return ZonedDateTime.fromInstant(this.instant, timeZone);
  }

  inTimeZone(timeZone: string): ZonedDateTime {
    return this.withTimeZone(timeZone);
  }

  plus(amount: Duration | DurationLike, options: ArithmeticOptions & ZoneOptions = {}): ZonedDateTime {
    const d = Duration.from(amount);
    if (d.hasDateUnits()) {
      const local = this.local.plus(d, options);
      return ZonedDateTime.fromLocal(local, this.timeZone, options);
    }
    return ZonedDateTime.fromInstant(this.instant.plus(d), this.timeZone);
  }

  minus(amount: Duration | DurationLike, options: ArithmeticOptions & ZoneOptions = {}): ZonedDateTime {
    return this.plus(Duration.from(amount).negated(), options);
  }

  startOf(unit: DateTimeUnit, options: ZoneOptions = {}): ZonedDateTime {
    if (unit === 'day' || unit === 'week' || unit === 'month' || unit === 'year') {
      return firstValidOn(this.local.date.startOf(unit === 'day' ? 'day' : unit), this.timeZone, options);
    }
    return ZonedDateTime.fromLocal(this.local.startOf(unit), this.timeZone, options);
  }

  endOf(unit: DateTimeUnit, options: ZoneOptions = {}): ZonedDateTime {
    return ZonedDateTime.fromLocal(this.local.endOf(unit), this.timeZone, {
      disambiguation: options.disambiguation ?? 'earlier',
    });
  }

  until(other: ZonedDateTime, unit: DateTimeUnit = 'millisecond'): number {
    if (unit === 'year' || unit === 'month' || unit === 'week' || unit === 'day') {
      return this.local.until(other.withTimeZone(this.timeZone).local, unit);
    }
    return this.instant.until(other.instant, unit);
  }

  toInstant(): Instant {
    return this.instant;
  }

  toLocalDateTime(): LocalDateTime {
    return this.local;
  }

  toLocalDate(): LocalDate {
    return this.local.date;
  }

  toLocalTime(): LocalTime {
    return this.local.time;
  }

  toJSDate(): Date {
    return this.instant.toJSDate();
  }

  isDST(): boolean {
    const monthAgo = this.instant.minus({ days: 180 });
    const monthAhead = this.instant.plus({ days: 180 });
    const here = this.offsetMs;
    const a = provider.getOffsetMs(monthAgo.epochMillis, this.timeZone);
    const b = provider.getOffsetMs(monthAhead.epochMillis, this.timeZone);
    const standard = Math.min(a, b, here);
    return here > standard;
  }

  compare(other: ZonedDateTime): number {
    return ZonedDateTime.compare(this, other);
  }

  isBefore(other: ZonedDateTime | Instant): boolean {
    const ms = other instanceof Instant ? other.epochMillis : other.epochMillis;
    return this.epochMillis < ms;
  }

  isAfter(other: ZonedDateTime | Instant): boolean {
    const ms = other instanceof Instant ? other.epochMillis : other.epochMillis;
    return this.epochMillis > ms;
  }

  isSame(other: ZonedDateTime | Instant): boolean {
    const ms = other instanceof Instant ? other.epochMillis : other.epochMillis;
    return this.epochMillis === ms;
  }

  equals(other: ZonedDateTime): boolean {
    return this.epochMillis === other.epochMillis && this.timeZone === other.timeZone;
  }

  toISO(): string {
    const offset = formatOffset(this.offsetMs);
    return `${this.local.toISO()}${offset}[${this.timeZone}]`;
  }

  toJSON(): string {
    return this.toISO();
  }

  toString(): string {
    return this.toISO();
  }
}

function firstValidOn(date: LocalDate, timeZone: string, options: ZoneOptions): ZonedDateTime {
  const midnight = LocalDateTime.combine(date, LocalTime.midnight());
  try {
    return ZonedDateTime.fromLocal(midnight, timeZone, {
      disambiguation: options.disambiguation ?? 'later',
    });
  } catch (err) {
    if (err instanceof TempoError && err.code === 'TIMEZONE_GAP') {
      return ZonedDateTime.fromLocal(midnight, timeZone, { disambiguation: 'later' });
    }
    throw err;
  }
}

function stripZone(input: string): string {
  return input.replace(/\[.*\]$/u, '').replace(/(Z|[+-]\d{2}(?::?\d{2})?(?::?\d{2})?)$/u, '');
}

function offsetIdFromMs(offsetMs: number): string {
  if (offsetMs === 0) return 'UTC';
  return formatOffset(offsetMs);
}

registerZonedFactory((instant, timeZone) => ZonedDateTime.fromInstant(instant, timeZone));
registerLocalZonedFactory((local, timeZone, options) =>
  ZonedDateTime.fromLocal(local, timeZone, options),
);
