import { afterEach, describe, expect, it } from 'vitest';
import { TempoError } from '../../src/errors.js';
import { Instant } from '../../src/core/instant.js';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalTime } from '../../src/core/local-time.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { Duration } from '../../src/core/duration.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';
import {
  fromTemporal,
  getTemporal,
  hasTemporal,
  toTemporalDuration,
  toTemporalInstant,
  toTemporalPlainDate,
  toTemporalPlainDateTime,
  toTemporalPlainTime,
  toTemporalZonedDateTime,
} from '../../src/temporal/interop.js';

interface FakeFrom {
  readonly [Symbol.toStringTag]: string;
  from(iso: string): { [Symbol.toStringTag]: string; iso: string; toString(): string };
}

interface FakeTemporal {
  Instant: FakeFrom;
  PlainDate: FakeFrom;
  PlainTime: FakeFrom;
  PlainDateTime: FakeFrom;
  ZonedDateTime: FakeFrom;
  Duration: FakeFrom;
}

/** A tiny fake with the shape interop relies on; no native Temporal needed. */
function installFakeTemporal(): FakeTemporal {
  const make = (tag: string): FakeFrom => ({
    [Symbol.toStringTag]: tag,
    from(iso: string) {
      return { [Symbol.toStringTag]: tag, iso, toString: () => iso };
    },
  });
  const fake = {
    Instant: make('Temporal.Instant'),
    PlainDate: make('Temporal.PlainDate'),
    PlainTime: make('Temporal.PlainTime'),
    PlainDateTime: make('Temporal.PlainDateTime'),
    ZonedDateTime: make('Temporal.ZonedDateTime'),
    Duration: make('Temporal.Duration'),
  };
  (globalThis as { Temporal?: unknown }).Temporal = fake;
  return fake;
}

function uninstallFakeTemporal(): void {
  delete (globalThis as { Temporal?: unknown }).Temporal;
}

describe('temporal interop', () => {
  afterEach(() => {
    uninstallFakeTemporal();
  });

  it('reports absence of Temporal', () => {
    expect(hasTemporal()).toBe(false);
    expect(getTemporal()).toBeUndefined();
    expect(() => toTemporalInstant(Instant.parse('2026-06-01T00:00:00Z'))).toThrow(TempoError);
  });

  it('converts core types to Temporal-shaped values', () => {
    installFakeTemporal();
    expect(hasTemporal()).toBe(true);
    expect(toTemporalInstant(Instant.parse('2026-06-01T00:00:00Z'))).toMatchObject({
      iso: '2026-06-01T00:00:00.000Z',
    });
    expect(toTemporalPlainDate(LocalDate.of(2026, 6, 1))).toMatchObject({ iso: '2026-06-01' });
    expect(toTemporalPlainTime(LocalTime.of(12, 30))).toMatchObject({ iso: '12:30:00' });
    expect(toTemporalPlainDateTime(LocalDateTime.of(2026, 6, 1, 12, 30))).toMatchObject({
      iso: '2026-06-01T12:30:00',
    });
    expect(
      toTemporalZonedDateTime(ZonedDateTime.parse('2026-06-01T12:00:00-04:00[America/New_York]')),
    ).toMatchObject({
      iso: '2026-06-01T12:00:00-04:00[America/New_York]',
    });
    expect(toTemporalDuration(Duration.parse('P1D'))).toMatchObject({ iso: 'P1D' });
  });

  it('converts Temporal-shaped values back to core types', () => {
    const fake = installFakeTemporal();
    const back = fromTemporal(fake.PlainDate.from('2026-06-01'));
    expect(back).toBeInstanceOf(LocalDate);
    expect((back as LocalDate).toISO()).toBe('2026-06-01');
  });

  it('rejects unknown Temporal tags', () => {
    expect(() => fromTemporal({ toString: () => 'x', [Symbol.toStringTag]: 'Temporal.Now' })).toThrow(
      TempoError,
    );
  });
});
