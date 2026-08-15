import { nowMs } from '../clock.js';
import { TempoError, type ParseResult, unwrapParse } from '../errors.js';
import type {
  ArithmeticOptions,
  DateTimeUnit,
  DurationLike,
  LocalDateTimeLike,
  Overflow,
  WithDateTimeFields,
  ZoneOptions,
} from '../types.js';
import { addToDate, LocalDate } from './local-date.js';
import { LocalTime } from './local-time.js';
import { Duration } from './duration.js';
import { Instant, utcMillis } from './instant.js';
import type { ZonedDateTime } from '../tz/zoned-datetime.js';
import { MILLIS_PER_DAY } from './range.js';

export class LocalDateTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;

  private constructor(
    readonly date: LocalDate,
    readonly time: LocalTime,
  ) {
    this.year = date.year;
    this.month = date.month;
    this.day = date.day;
    this.hour = time.hour;
    this.minute = time.minute;
    this.second = time.second;
    this.millisecond = time.millisecond;
  }

  static of(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    overflow: Overflow = 'reject',
  ): LocalDateTime {
    return new LocalDateTime(
      LocalDate.of(year, month, day, overflow),
      LocalTime.of(hour, minute, second, millisecond),
    );
  }

  static from(fields: LocalDateTimeLike, overflow: Overflow = 'reject'): LocalDateTime {
    return LocalDateTime.of(
      fields.year,
      fields.month,
      fields.day,
      fields.hour,
      fields.minute,
      fields.second,
      fields.millisecond,
      overflow,
    );
  }

  static combine(date: LocalDate, time: LocalTime = LocalTime.midnight()): LocalDateTime {
    return new LocalDateTime(date, time);
  }

  static now(timeZone?: string): LocalDateTime {
    if (timeZone === undefined) {
      const d = new Date(nowMs());
      return LocalDateTime.of(
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
      );
    }
    return LocalDateTime.combine(LocalDate.today(timeZone), LocalTime.now(timeZone));
  }

  static parse(input: string): LocalDateTime {
    return unwrapParse(LocalDateTime.tryParse(input));
  }

  static tryParse(input: string): ParseResult<LocalDateTime> {
    return parseLocalDateTime(input);
  }

  static compare(a: LocalDateTime, b: LocalDateTime): number {
    const date = a.date.compare(b.date);
    return date !== 0 ? date : a.time.compare(b.time);
  }

  with(fields: WithDateTimeFields, overflow: Overflow = 'constrain'): LocalDateTime {
    return LocalDateTime.of(
      fields.year ?? this.year,
      fields.month ?? this.month,
      fields.day ?? this.day,
      fields.hour ?? this.hour,
      fields.minute ?? this.minute,
      fields.second ?? this.second,
      fields.millisecond ?? this.millisecond,
      overflow,
    );
  }

  plus(amount: Duration | DurationLike, options: ArithmeticOptions = {}): LocalDateTime {
    const d = Duration.from(amount);
    const overflow = options.overflow ?? 'constrain';
    const date = addToDate(this.date, Duration.of({
      years: d.years,
      months: d.months,
      weeks: d.weeks,
      days: d.days,
    }), overflow);
    const timeMs =
      d.hours * 3_600_000 + d.minutes * 60_000 + d.seconds * 1000 + d.milliseconds + this.time.toMsOfDay();
    const dayShift = Math.floor(timeMs / MILLIS_PER_DAY);
    const msOfDay = ((timeMs % MILLIS_PER_DAY) + MILLIS_PER_DAY) % MILLIS_PER_DAY;
    return LocalDateTime.combine(date.plus({ days: dayShift }), LocalTime.fromMsOfDay(msOfDay));
  }

  minus(amount: Duration | DurationLike, options: ArithmeticOptions = {}): LocalDateTime {
    return this.plus(Duration.from(amount).negated(), options);
  }

  startOf(unit: DateTimeUnit): LocalDateTime {
    switch (unit) {
      case 'year':
      case 'month':
      case 'week':
      case 'day':
        return LocalDateTime.combine(this.date.startOf(unit), LocalTime.midnight());
      case 'hour':
      case 'minute':
      case 'second':
      case 'millisecond':
        return LocalDateTime.combine(this.date, this.time.startOf(unit));
    }
  }

  endOf(unit: DateTimeUnit): LocalDateTime {
    switch (unit) {
      case 'year':
      case 'month':
      case 'week':
      case 'day':
        return LocalDateTime.combine(this.date.endOf(unit), LocalTime.of(23, 59, 59, 999));
      case 'hour':
      case 'minute':
      case 'second':
      case 'millisecond':
        return LocalDateTime.combine(this.date, this.time.endOf(unit));
    }
  }

  until(other: LocalDateTime, unit: DateTimeUnit = 'millisecond'): number {
    if (unit === 'year' || unit === 'month' || unit === 'week' || unit === 'day') {
      return this.date.until(other.date, unit);
    }
    const ms = other.toNaiveUtcMillis() - this.toNaiveUtcMillis();
    switch (unit) {
      case 'millisecond':
        return ms;
      case 'second':
        return Math.trunc(ms / 1000);
      case 'minute':
        return Math.trunc(ms / 60_000);
      case 'hour':
        return Math.trunc(ms / 3_600_000);
    }
  }

  /** Treat the civil fields as if they were UTC. Used by timezone conversion. */
  toNaiveUtcMillis(): number {
    const ms = utcMillis(
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
      this.millisecond,
    );
    if (ms === null) {
      throw new TempoError('INVALID_DATE', 'LocalDateTime is not representable as UTC millis', {
        input: this.toISO(),
      });
    }
    return ms;
  }

  toZonedDateTime(timeZone: string, options: ZoneOptions = {}): ZonedDateTime {
    return zonedFromLocal(this, timeZone, options);
  }

  toInstant(timeZone: string, options: ZoneOptions = {}): Instant {
    return this.toZonedDateTime(timeZone, options).toInstant();
  }

  compare(other: LocalDateTime): number {
    return LocalDateTime.compare(this, other);
  }

  isBefore(other: LocalDateTime): boolean {
    return this.compare(other) < 0;
  }

  isAfter(other: LocalDateTime): boolean {
    return this.compare(other) > 0;
  }

  isSame(other: LocalDateTime): boolean {
    return this.compare(other) === 0;
  }

  isSameOrBefore(other: LocalDateTime): boolean {
    return this.compare(other) <= 0;
  }

  isSameOrAfter(other: LocalDateTime): boolean {
    return this.compare(other) >= 0;
  }

  equals(other: LocalDateTime | LocalDateTimeLike): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day &&
      this.hour === other.hour &&
      this.minute === other.minute &&
      this.second === other.second &&
      this.millisecond === other.millisecond
    );
  }

  toISO(): string {
    return `${this.date.toISO()}T${this.time.toISO()}`;
  }

  toJSON(): string {
    return this.toISO();
  }

  toString(): string {
    return this.toISO();
  }
}

type LocalFactory = (local: LocalDateTime, timeZone: string, options: ZoneOptions) => ZonedDateTime;

let localFactory: LocalFactory | undefined;

export function registerLocalZonedFactory(factory: LocalFactory): void {
  localFactory = factory;
}

function zonedFromLocal(
  local: LocalDateTime,
  timeZone: string,
  options: ZoneOptions,
): ZonedDateTime {
  if (!localFactory) {
    throw new TempoError('UNKNOWN_TIMEZONE', 'ZonedDateTime module is not loaded');
  }
  return localFactory(local, timeZone, options);
}

function parseLocalDateTime(input: string): ParseResult<LocalDateTime> {
  if (typeof input !== 'string') {
    return { ok: false, reason: 'INVALID_PARSE', message: 'Expected a string', input: String(input) };
  }
  const match =
    /^([+-]?\d{4,})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/u.exec(input);
  if (!match) {
    return {
      ok: false,
      reason: 'INVALID_PARSE',
      message: 'Expected ISO local date-time YYYY-MM-DDTHH:mm[:ss[.SSS]]',
      input,
    };
  }
  try {
    const frac = match[7] ?? '';
    return {
      ok: true,
      value: LocalDateTime.of(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        match[6] === undefined ? 0 : Number(match[6]),
        frac === '' ? 0 : Number(frac.padEnd(3, '0').slice(0, 3)),
        'reject',
      ),
    };
  } catch (err) {
    const message = err instanceof TempoError ? err.message : 'Invalid local date-time';
    const reason = err instanceof TempoError ? err.code : 'INVALID_DATE';
    return { ok: false, reason, message, input };
  }
}
