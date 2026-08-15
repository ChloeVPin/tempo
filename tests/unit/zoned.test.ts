import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { TempoError } from '../../src/errors.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

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
});
