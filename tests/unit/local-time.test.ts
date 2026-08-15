import { describe, expect, it } from 'vitest';
import { LocalTime } from '../../src/core/local-time.js';
import { TempoError } from '../../src/errors.js';
import { useFixedClock } from '../../src/clock.js';

describe('LocalTime', () => {
  it('parses ISO times', () => {
    expect(LocalTime.parse('09:30').toISO()).toBe('09:30:00');
    expect(LocalTime.parse('09:30:01.5').toISO()).toBe('09:30:01.500');
  });

  it('rejects invalid fields', () => {
    expect(() => LocalTime.of(24)).toThrow(TempoError);
    expect(() => LocalTime.parse('9:30')).toThrow(TempoError);
  });

  it('wraps around midnight', () => {
    expect(LocalTime.of(23, 30).plus({ hours: 1 }).toISO()).toBe('00:30:00');
    expect(LocalTime.of(0, 15).minus({ minutes: 30 }).toISO()).toBe('23:45:00');
  });

  it('supports startOf / endOf', () => {
    const t = LocalTime.of(13, 45, 12, 3);
    expect(t.startOf('hour').toISO()).toBe('13:00:00');
    expect(t.endOf('minute').toISO()).toBe('13:45:59.999');
  });

  it('now follows the fixed clock', () => {
    const instant = Date.UTC(2026, 5, 1, 15, 30, 45, 123);
    const restore = useFixedClock(instant);
    try {
      expect(LocalTime.now('UTC').toISO()).toBe('15:30:45.123');
      // The no-zone branch uses the host time zone; mirror its derivation.
      const host = new Date(instant);
      expect(LocalTime.now().hour).toBe(host.getHours());
      expect(LocalTime.now().minute).toBe(host.getMinutes());
    } finally {
      restore();
    }
  });
});
