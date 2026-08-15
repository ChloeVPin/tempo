import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { TempoError } from '../../src/errors.js';

describe('Instant', () => {
  it('parses RFC 3339', () => {
    const i = Instant.parse('2026-06-01T12:00:00Z');
    expect(i.toISO()).toBe('2026-06-01T12:00:00.000Z');
    expect(Instant.parse('2026-06-01T14:00:00+02:00').equals(i)).toBe(true);
  });

  it('rejects dates without an offset', () => {
    expect(() => Instant.parse('2026-06-01T12:00:00')).toThrow(TempoError);
    expect(() => Instant.parse('not a date')).toThrow(TempoError);
  });

  it('adds time units only', () => {
    const i = Instant.parse('2026-06-01T00:00:00Z');
    expect(i.plus({ hours: 2 }).toISO()).toBe('2026-06-01T02:00:00.000Z');
    expect(() => i.plus({ months: 1 })).toThrow(TempoError);
  });

  it('round-trips through Date', () => {
    const i = Instant.ofEpochMillis(1_714_000_000_000);
    expect(Instant.fromJSDate(i.toJSDate()).equals(i)).toBe(true);
  });

  it('orders instants', () => {
    const a = Instant.parse('2026-01-01T00:00:00Z');
    const b = Instant.parse('2026-01-01T00:00:01Z');
    expect(a.isBefore(b)).toBe(true);
    expect(a.until(b, 'second')).toBe(1);
  });
});
