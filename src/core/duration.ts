import { TempoError, type ParseResult, unwrapParse } from '../errors.js';
import type { DurationLike } from '../types.js';
import { MILLIS_PER_DAY, MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from './range.js';

const KEYS = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
] as const;

export class Duration {
  readonly years: number;
  readonly months: number;
  readonly weeks: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;

  private constructor(fields: Required<DurationLike>) {
    this.years = fields.years;
    this.months = fields.months;
    this.weeks = fields.weeks;
    this.days = fields.days;
    this.hours = fields.hours;
    this.minutes = fields.minutes;
    this.seconds = fields.seconds;
    this.milliseconds = fields.milliseconds;
  }

  static zero(): Duration {
    return Duration.of({});
  }

  static of(fields: DurationLike): Duration {
    return new Duration({
      years: intField('years', fields.years),
      months: intField('months', fields.months),
      weeks: intField('weeks', fields.weeks),
      days: intField('days', fields.days),
      hours: intField('hours', fields.hours),
      minutes: intField('minutes', fields.minutes),
      seconds: intField('seconds', fields.seconds),
      milliseconds: intField('milliseconds', fields.milliseconds),
    });
  }

  static from(input: Duration | DurationLike): Duration {
    if (input instanceof Duration) return input;
    return Duration.of(input);
  }

  static parse(input: string): Duration {
    return unwrapParse(Duration.tryParse(input));
  }

  static tryParse(input: string): ParseResult<Duration> {
    return parseDuration(input);
  }

  get sign(): -1 | 0 | 1 {
    for (const key of KEYS) {
      const v = this[key];
      if (v > 0) return 1;
      if (v < 0) return -1;
    }
    return 0;
  }

  isZero(): boolean {
    return this.sign === 0;
  }

  negated(): Duration {
    return Duration.of({
      years: -this.years,
      months: -this.months,
      weeks: -this.weeks,
      days: -this.days,
      hours: -this.hours,
      minutes: -this.minutes,
      seconds: -this.seconds,
      milliseconds: -this.milliseconds,
    });
  }

  abs(): Duration {
    return this.sign < 0 ? this.negated() : this;
  }

  plus(other: Duration | DurationLike): Duration {
    const d = Duration.from(other);
    return Duration.of({
      years: this.years + d.years,
      months: this.months + d.months,
      weeks: this.weeks + d.weeks,
      days: this.days + d.days,
      hours: this.hours + d.hours,
      minutes: this.minutes + d.minutes,
      seconds: this.seconds + d.seconds,
      milliseconds: this.milliseconds + d.milliseconds,
    });
  }

  minus(other: Duration | DurationLike): Duration {
    return this.plus(Duration.from(other).negated());
  }

  /** True when any calendar unit (years, months, weeks, days) is non-zero. */
  hasDateUnits(): boolean {
    return this.years !== 0 || this.months !== 0 || this.weeks !== 0 || this.days !== 0;
  }

  /** True when any time unit is non-zero. */
  hasTimeUnits(): boolean {
    return this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0;
  }

  /**
   * Total time-unit duration in the requested unit.
   * Calendar units other than days/weeks are rejected because months and years vary.
   */
  total(unit: 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'): number {
    if (this.years !== 0 || this.months !== 0) {
      throw new TempoError(
        'INCOMPATIBLE_UNIT',
        'Cannot total a duration that contains years or months',
        { input: this.toISO() },
      );
    }
    const ms =
      this.weeks * 7 * MILLIS_PER_DAY +
      this.days * MILLIS_PER_DAY +
      this.hours * MILLIS_PER_HOUR +
      this.minutes * MILLIS_PER_MINUTE +
      this.seconds * MILLIS_PER_SECOND +
      this.milliseconds;
    switch (unit) {
      case 'millisecond':
        return ms;
      case 'second':
        return ms / MILLIS_PER_SECOND;
      case 'minute':
        return ms / MILLIS_PER_MINUTE;
      case 'hour':
        return ms / MILLIS_PER_HOUR;
      case 'day':
        return ms / MILLIS_PER_DAY;
      case 'week':
        return ms / (7 * MILLIS_PER_DAY);
    }
  }

  toISO(): string {
    if (this.isZero()) return 'PT0S';
    const sign = this.sign < 0 ? '-' : '';
    const y = abs(this.years);
    const mo = abs(this.months);
    const w = abs(this.weeks);
    const d = abs(this.days);
    const h = abs(this.hours);
    const mi = abs(this.minutes);
    const s = abs(this.seconds);
    const ms = abs(this.milliseconds);
    let out = `${sign}P`;
    if (y) out += `${y}Y`;
    if (mo) out += `${mo}M`;
    if (w) out += `${w}W`;
    if (d) out += `${d}D`;
    if (h || mi || s || ms) {
      out += 'T';
      if (h) out += `${h}H`;
      if (mi) out += `${mi}M`;
      if (s || ms) {
        out += ms ? `${s}.${String(ms).padStart(3, '0').replace(/0+$/, '')}S` : `${s}S`;
      }
    }
    return out;
  }

  toJSON(): string {
    return this.toISO();
  }

  toString(): string {
    return this.toISO();
  }

  equals(other: Duration | DurationLike): boolean {
    const d = Duration.from(other);
    return (
      this.years === d.years &&
      this.months === d.months &&
      this.weeks === d.weeks &&
      this.days === d.days &&
      this.hours === d.hours &&
      this.minutes === d.minutes &&
      this.seconds === d.seconds &&
      this.milliseconds === d.milliseconds
    );
  }
}

function intField(name: string, value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isInteger(value)) {
    throw new TempoError('INVALID_DURATION', `Duration.${name} must be an integer`, { input: value });
  }
  return value;
}

function abs(n: number): number {
  return n < 0 ? -n : n;
}

function parseDuration(input: string): ParseResult<Duration> {
  if (typeof input !== 'string' || input.length === 0) {
    return {
      ok: false,
      reason: 'INVALID_PARSE',
      message: 'Duration string must be non-empty',
      input: String(input),
    };
  }

  let i = 0;
  let negative = false;
  if (input[i] === '-') {
    negative = true;
    i += 1;
  } else if (input[i] === '+') {
    i += 1;
  }
  if (input[i] !== 'P') {
    return {
      ok: false,
      reason: 'INVALID_PARSE',
      message: 'Duration must start with P',
      input,
      index: i,
    };
  }
  i += 1;

  const fields = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  };
  let seenAny = false;
  let inTime = false;
  let seenWeek = false;
  const seen = new Set<string>();

  const readNumber = (): { whole: number; frac: number; fracDigits: number } | null => {
    const start = i;
    while (i < input.length && input[i]! >= '0' && input[i]! <= '9') i += 1;
    if (i === start) return null;
    const whole = Number(input.slice(start, i));
    let frac = 0;
    let fracDigits = 0;
    if (input[i] === '.' || input[i] === ',') {
      i += 1;
      const fracStart = i;
      while (i < input.length && input[i]! >= '0' && input[i]! <= '9') i += 1;
      if (i === fracStart) return null;
      fracDigits = i - fracStart;
      frac = Number(input.slice(fracStart, i));
    }
    if (!Number.isSafeInteger(whole)) return null;
    return { whole, frac, fracDigits };
  };

  while (i < input.length) {
    if (input[i] === 'T') {
      if (inTime) {
        return { ok: false, reason: 'INVALID_PARSE', message: 'Duplicate T in duration', input, index: i };
      }
      inTime = true;
      i += 1;
      continue;
    }
    const num = readNumber();
    if (!num) {
      return { ok: false, reason: 'INVALID_PARSE', message: 'Expected number in duration', input, index: i };
    }
    const designator = input[i];
    if (!designator) {
      return { ok: false, reason: 'INVALID_PARSE', message: 'Missing duration designator', input, index: i };
    }
    i += 1;
    if (num.fracDigits > 0 && i < input.length) {
      return {
        ok: false,
        reason: 'INVALID_PARSE',
        message: 'Only the last duration field may have a fraction',
        input,
        index: i - 1,
      };
    }

    const apply = (key: keyof typeof fields, scaleToMs?: number) => {
      if (seen.has(key)) {
        throw new ParseSignal('Duplicate duration field');
      }
      seen.add(key);
      seenAny = true;
      const value = num.whole;
      if (num.fracDigits > 0) {
        if (key === 'milliseconds') {
          throw new ParseSignal('Fractional milliseconds are not supported');
        }
        if (scaleToMs !== undefined) {
          const fracMs = Math.round((num.frac / 10 ** num.fracDigits) * scaleToMs);
          fields.milliseconds += fracMs;
        } else if (key === 'weeks') {
          const fracDays = (num.frac / 10 ** num.fracDigits) * 7;
          const extraDays = Math.round(fracDays);
          fields.days += extraDays;
        } else if (key === 'days') {
          const extraMs = Math.round((num.frac / 10 ** num.fracDigits) * MILLIS_PER_DAY);
          fields.milliseconds += extraMs;
        } else {
          throw new ParseSignal(`Fractional ${key} are not supported`);
        }
      }
      fields[key] += value;
    };

    try {
      if (!inTime) {
        if (designator === 'Y') apply('years');
        else if (designator === 'M') apply('months');
        else if (designator === 'W') {
          seenWeek = true;
          apply('weeks');
        } else if (designator === 'D') apply('days');
        else {
          return {
            ok: false,
            reason: 'INVALID_PARSE',
            message: `Unexpected duration designator ${designator}`,
            input,
            index: i - 1,
          };
        }
      } else if (designator === 'H') apply('hours', MILLIS_PER_HOUR);
      else if (designator === 'M') apply('minutes', MILLIS_PER_MINUTE);
      else if (designator === 'S') apply('seconds', MILLIS_PER_SECOND);
      else {
        return {
          ok: false,
          reason: 'INVALID_PARSE',
          message: `Unexpected time designator ${designator}`,
          input,
          index: i - 1,
        };
      }
    } catch (err) {
      if (err instanceof ParseSignal) {
        return { ok: false, reason: 'INVALID_PARSE', message: err.message, input, index: i - 1 };
      }
      throw err;
    }

    if (seenWeek && (seen.has('years') || seen.has('months') || seen.has('days'))) {
      // ISO 8601 allows weeks alone or combined in some profiles; Tempo allows weeks with other date units.
    }
  }

  if (!seenAny) {
    return { ok: false, reason: 'INVALID_PARSE', message: 'Duration contains no fields', input };
  }
  if (inTime && !fields.hours && !fields.minutes && !fields.seconds && !fields.milliseconds && !seen.has('hours') && !seen.has('minutes') && !seen.has('seconds')) {
    return { ok: false, reason: 'INVALID_PARSE', message: 'Duration time part is empty', input };
  }

  const signed = negative
    ? {
        years: -fields.years,
        months: -fields.months,
        weeks: -fields.weeks,
        days: -fields.days,
        hours: -fields.hours,
        minutes: -fields.minutes,
        seconds: -fields.seconds,
        milliseconds: -fields.milliseconds,
      }
    : fields;

  return { ok: true, value: Duration.of(signed) };
}

class ParseSignal extends Error {}
