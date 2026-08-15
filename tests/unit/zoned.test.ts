import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { TempoError } from '../../src/errors.js';
import { ZonedDateTime, setTimeZoneProvider } from '../../src/tz/zoned-datetime.js';
import { formatOffset, isFixedOffsetId, offsetMsFromId, parseOffset } from '../../src/tz/offset.js';
import type { TimeZoneProvider } from '../../src/tz/types.js';
import { intlLocalAt } from '../helpers/intl-history.js';

// Sao Paulo's last DST started 2018-11-04 at midnight; requires ICU tzdata history.
const SAO_PAULO_2018 = intlLocalAt('2018-11-04T03:00:00Z', 'America/Sao_Paulo') === '2018-11-04T01:00:00';

describe('ZonedDateTime', () => {
  it('converts an instant into New York local time', () => {
    const zdt = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    expect(zdt.hour).toBe(12);
    expect(zdt.offsetMs).toBe(-4 * 3_600_000);
    expect(zdt.toInstant().toISO()).toBe('2026-06-01T16:00:00.000Z');
  });

  it('handles a non-hour offset', () => {
    const zdt = Instant.parse('2026-06-01T00:00:00Z').toZonedDateTime('Asia/Kolkata') as ZonedDateTime;
    expect(zdt.hour).toBe(5);
    expect(zdt.minute).toBe(30);
    expect(zdt.offsetMs).toBe(5.5 * 3_600_000);
  });

  it('disambiguates the 2026 US spring-forward gap', () => {
    const local = LocalDateTime.parse('2026-03-08T02:30:00');
    expect(() =>
      ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'reject' }),
    ).toThrow(TempoError);

    const later = ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'later' });
    const earlier = ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'earlier' });
    expect(later.epochMillis).toBeGreaterThan(earlier.epochMillis);
    expect(later.toLocalTime().hour).not.toBe(2);
    expect(earlier.toLocalTime().hour).not.toBe(2);
  });

  it('disambiguates the 2026 US fall-back overlap', () => {
    const local = LocalDateTime.parse('2026-11-01T01:30:00');
    expect(() =>
      ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'reject' }),
    ).toThrow(TempoError);

    const earlier = ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'earlier' });
    const later = ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'later' });
    expect(earlier.offsetMs).toBe(-4 * 3_600_000);
    expect(later.offsetMs).toBe(-5 * 3_600_000);
    expect(later.epochMillis - earlier.epochMillis).toBe(3_600_000);
  });

  it('disambiguates the 2026 London spring-forward gap', () => {
    const local = LocalDateTime.parse('2026-03-29T01:30:00');
    expect(() =>
      ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'reject' }),
    ).toThrow(TempoError);

    const later = ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'later' });
    const earlier = ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'earlier' });
    expect(later.epochMillis).toBeGreaterThan(earlier.epochMillis);
    expect(later.toLocalTime().hour).not.toBe(1);
    expect(earlier.toLocalTime().hour).not.toBe(1);
  });

  it('disambiguates the 2026 London fall-back overlap', () => {
    const local = LocalDateTime.parse('2026-10-25T01:30:00');
    expect(() =>
      ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'reject' }),
    ).toThrow(TempoError);

    const earlier = ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'earlier' });
    const later = ZonedDateTime.fromLocal(local, 'Europe/London', { disambiguation: 'later' });
    expect(earlier.offsetMs).toBe(1 * 3_600_000); // BST
    expect(later.offsetMs).toBe(0); // GMT
    expect(later.epochMillis - earlier.epochMillis).toBe(3_600_000);
  });

  it.skipIf(!SAO_PAULO_2018)(
    'startOf("day") lands on a valid time when midnight is in a gap (icu ' + process.versions.icu + ')',
    () => {
      // Sao Paulo's last DST started 2018-11-04 at 00:00 (clocks 00:00 -> 01:00),
      // so midnight on that date does not exist.
      const day = ZonedDateTime.parse('2018-11-03T10:00:00-03:00[America/Sao_Paulo]');
      const start = day.plus({ days: 1 }).startOf('day');
      expect(start.toLocalDateTime().toISO()).toBe('2018-11-04T01:00:00');
      expect(start.offsetMs).toBe(-2 * 3_600_000);
    },
  );

  it('adds calendar days on the wall clock', () => {
    const zdt = ZonedDateTime.parse('2026-03-07T12:00:00-05:00[America/New_York]');
    const next = zdt.plus({ days: 1 });
    expect(next.hour).toBe(12);
    expect(next.day).toBe(8);
  });

  it('round-trips ISO with a zone', () => {
    const iso = '2026-06-01T12:00:00-04:00[America/New_York]';
    expect(ZonedDateTime.parse(iso).toISO()).toBe(iso);
  });

  it('rejects unknown zones', () => {
    expect(() => Instant.now().toZonedDateTime('Not/AZone')).toThrow(TempoError);
  });

  it('withers local fields in the zone', () => {
    const zdt = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    const at9 = zdt.with({ hour: 9 });
    expect(at9.hour).toBe(9);
    expect(at9.offsetMs).toBe(-4 * 3_600_000);
    expect(at9.toInstant().toISO()).toBe('2026-06-01T13:00:00.000Z');
    expect(zdt.hour).toBe(12); // original unchanged
  });

  it('detects DST via offset comparison', () => {
    const summer = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    const winter = Instant.parse('2026-01-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    expect(summer.isDST()).toBe(true);
    expect(winter.isDST()).toBe(false);
  });

  it('computes endOf units', () => {
    const zdt = ZonedDateTime.parse('2026-06-01T12:00:00-04:00[America/New_York]');
    expect(zdt.endOf('day').toLocalDateTime().toISO()).toBe('2026-06-01T23:59:59.999');
    expect(zdt.endOf('month').toLocalDateTime().toISO()).toBe('2026-06-30T23:59:59.999');
    expect(zdt.endOf('hour').toLocalDateTime().toISO()).toBe('2026-06-01T12:59:59.999');
  });

  it('accepts a custom timezone provider', () => {
    const fake: TimeZoneProvider = {
      getOffsetMs: () => 0,
      getPossibleInstants: (local) => [local.toNaiveUtcMillis()],
      guess: () => 'Fake/Zone',
    };
    const restore = setTimeZoneProvider(fake);
    try {
      const zdt = Instant.parse('2026-06-01T00:00:00Z').toZonedDateTime('Fake/Zone');
      expect(zdt.offsetMs).toBe(0);
      expect(zdt.toLocalDateTime().toISO()).toBe('2026-06-01T00:00:00');
      expect(ZonedDateTime.now().timeZone).toBe('Fake/Zone');
    } finally {
      restore();
    }
  });
});

describe('offset helpers', () => {
  it('parses and formats offsets', () => {
    expect(parseOffset('+05:30')).toBe(5.5 * 3_600_000);
    expect(parseOffset('-08:00')).toBe(-8 * 3_600_000);
    expect(() => parseOffset('bogus')).toThrow(TempoError);
    expect(formatOffset(0)).toBe('+00:00');
    expect(formatOffset(0, 'short')).toBe('+00');
    expect(formatOffset(0, 'basic')).toBe('+0000');
    expect(formatOffset(30_000)).toBe('+00:00:30');
  });

  it('recognizes fixed offset ids', () => {
    expect(isFixedOffsetId('UTC')).toBe(true);
    expect(isFixedOffsetId('GMT')).toBe(true);
    expect(isFixedOffsetId('+05:30')).toBe(true);
    expect(isFixedOffsetId('America/New_York')).toBe(false);
    expect(offsetMsFromId('UTC')).toBe(0);
    expect(offsetMsFromId('+05:30')).toBe(5.5 * 3_600_000);
    expect(offsetMsFromId('Not/AZone')).toBe(null);
  });
});
