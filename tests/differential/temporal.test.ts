import { describe, expect, it } from 'vitest';
import { TempoError } from '../../src/errors.js';
import { Instant } from '../../src/core/instant.js';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

interface TemporalLike {
  PlainDate: {
    from(input: string): {
      toString(): string;
      add(duration: { months?: number; years?: number }): { toString(): string };
    };
  };
  PlainDateTime: {
    from(input: string): { toString(options?: { fractionalSecondDigits?: number }): string };
  };
  Instant: {
    from(input: string): { epochMilliseconds: number };
  };
  ZonedDateTime: {
    from(
      input: string,
      options?: { disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject' },
    ): { epochMilliseconds: number };
  };
}

const temporal = (globalThis as unknown as { Temporal?: TemporalLike }).Temporal;
const hasTemporal = temporal !== undefined;

function ours(
  localIso: string,
  zone: string,
  disambiguation: 'compatible' | 'earlier' | 'later',
): number {
  return ZonedDateTime.fromLocal(LocalDateTime.parse(localIso), zone, { disambiguation }).epochMillis;
}

describe.skipIf(!hasTemporal)('differential vs Temporal', () => {
  it('parses ISO dates identically', () => {
    const t = temporal as TemporalLike;
    for (const iso of ['2026-06-01', '2024-02-29', '2025-12-29', '1999-12-31']) {
      expect(t.PlainDate.from(iso).toString()).toBe(LocalDate.parse(iso).toISO());
    }
  });

  it('parses ISO date-times identically', () => {
    const t = temporal as TemporalLike;
    expect(t.PlainDateTime.from('2026-06-01T12:00:00').toString()).toBe(
      LocalDateTime.parse('2026-06-01T12:00:00').toISO(),
    );
    expect(t.PlainDateTime.from('2026-06-01T12:00:00.500').toString({ fractionalSecondDigits: 3 })).toBe(
      LocalDateTime.parse('2026-06-01T12:00:00.500').toISO(),
    );
  });

  it('parses instants to the same epoch millisecond', () => {
    const t = temporal as TemporalLike;
    for (const iso of [
      '2026-06-01T12:00:00Z',
      '2026-06-01T14:00:00+02:00',
      '2026-01-01T00:00:00-05:00',
      '2026-06-01T12:00:00.500Z',
    ]) {
      expect(t.Instant.from(iso).epochMilliseconds).toBe(Instant.parse(iso).epochMillis);
    }
  });

  it('constrains month-end calendar arithmetic identically', () => {
    const t = temporal as TemporalLike;
    expect(t.PlainDate.from('2026-01-31').add({ months: 1 }).toString()).toBe(
      LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO(),
    );
    expect(t.PlainDate.from('2024-02-29').add({ years: 1 }).toString()).toBe(
      LocalDate.of(2024, 2, 29).plus({ years: 1 }).toISO(),
    );
  });

  it('resolves the NY spring-forward gap with the same policies', () => {
    const t = temporal as TemporalLike;
    const local = '2026-03-08T02:30:00';
    const zone = 'America/New_York';
    for (const disambiguation of ['compatible', 'earlier', 'later'] as const) {
      expect(t.ZonedDateTime.from(`${local}[${zone}]`, { disambiguation }).epochMilliseconds).toBe(
        ours(local, zone, disambiguation),
      );
    }
    expect(() => t.ZonedDateTime.from(`${local}[${zone}]`, { disambiguation: 'reject' })).toThrow();
    expect(() =>
      ZonedDateTime.fromLocal(LocalDateTime.parse(local), zone, { disambiguation: 'reject' }),
    ).toThrow(TempoError);
  });

  it('resolves the NY fall-back overlap with the same policies', () => {
    const t = temporal as TemporalLike;
    const local = '2026-11-01T01:30:00';
    const zone = 'America/New_York';
    for (const disambiguation of ['compatible', 'earlier', 'later'] as const) {
      expect(t.ZonedDateTime.from(`${local}[${zone}]`, { disambiguation }).epochMilliseconds).toBe(
        ours(local, zone, disambiguation),
      );
    }
    expect(() => t.ZonedDateTime.from(`${local}[${zone}]`, { disambiguation: 'reject' })).toThrow();
  });
});
