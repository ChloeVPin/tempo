import { Instant } from '../core/instant.js';
import { LocalDate } from '../core/local-date.js';
import { LocalDateTime } from '../core/local-datetime.js';
import { LocalTime } from '../core/local-time.js';
import { Duration } from '../core/duration.js';
import { ZonedDateTime } from '../tz/zoned-datetime.js';
import { TempoError } from '../errors.js';

type TemporalLike = {
  Instant?: { from: (iso: string) => unknown };
  PlainDate?: { from: (iso: string) => unknown };
  PlainTime?: { from: (iso: string) => unknown };
  PlainDateTime?: { from: (iso: string) => unknown };
  ZonedDateTime?: { from: (iso: string) => unknown };
  Duration?: { from: (iso: string) => unknown };
};

export function getTemporal(): TemporalLike | undefined {
  const globalObj = globalThis as { Temporal?: TemporalLike };
  return globalObj.Temporal;
}

export function hasTemporal(): boolean {
  return getTemporal()?.Instant !== undefined;
}

export function toTemporalInstant(value: Instant) {
  const Temporal = getTemporal();
  if (!Temporal?.Instant) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.Instant is not available in this runtime');
  }
  return Temporal.Instant.from(value.toISO());
}

export function toTemporalPlainDate(value: LocalDate) {
  const Temporal = getTemporal();
  if (!Temporal?.PlainDate) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.PlainDate is not available in this runtime');
  }
  return Temporal.PlainDate.from(value.toISO());
}

export function toTemporalPlainTime(value: LocalTime) {
  const Temporal = getTemporal();
  if (!Temporal?.PlainTime) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.PlainTime is not available in this runtime');
  }
  return Temporal.PlainTime.from(value.toISO());
}

export function toTemporalPlainDateTime(value: LocalDateTime) {
  const Temporal = getTemporal();
  if (!Temporal?.PlainDateTime) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.PlainDateTime is not available in this runtime');
  }
  return Temporal.PlainDateTime.from(value.toISO());
}

export function toTemporalZonedDateTime(value: ZonedDateTime) {
  const Temporal = getTemporal();
  if (!Temporal?.ZonedDateTime) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.ZonedDateTime is not available in this runtime');
  }
  return Temporal.ZonedDateTime.from(value.toISO());
}

export function toTemporalDuration(value: Duration) {
  const Temporal = getTemporal();
  if (!Temporal?.Duration) {
    throw new TempoError('OUT_OF_RANGE', 'Temporal.Duration is not available in this runtime');
  }
  return Temporal.Duration.from(value.toISO());
}

export function fromTemporal(value: { toString(): string; [Symbol.toStringTag]?: string }):
  | Instant
  | LocalDate
  | LocalTime
  | LocalDateTime
  | ZonedDateTime
  | Duration {
  const tag = value[Symbol.toStringTag] ?? value.constructor?.name ?? '';
  const iso = value.toString();
  if (tag.includes('Instant')) return Instant.parse(iso);
  if (tag.includes('ZonedDateTime')) return ZonedDateTime.parse(iso);
  if (tag.includes('PlainDateTime')) return LocalDateTime.parse(iso);
  if (tag.includes('PlainDate')) return LocalDate.parse(iso);
  if (tag.includes('PlainTime')) return LocalTime.parse(iso);
  if (tag.includes('Duration')) return Duration.parse(iso);
  throw new TempoError('INCOMPATIBLE_UNIT', `Unsupported Temporal type ${tag}`, { input: iso });
}
