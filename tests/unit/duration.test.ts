import { describe, expect, it } from 'vitest';
import { Duration } from '../../src/core/duration.js';
import { TempoError } from '../../src/errors.js';

describe('Duration', () => {
  it('parses ISO durations', () => {
    const d = Duration.parse('P1Y2M3DT4H5M6.789S');
    expect(d.years).toBe(1);
    expect(d.months).toBe(2);
    expect(d.days).toBe(3);
    expect(d.hours).toBe(4);
    expect(d.minutes).toBe(5);
    expect(d.seconds).toBe(6);
    expect(d.milliseconds).toBe(789);
    expect(Duration.parse(d.toISO()).equals(d)).toBe(true);
  });

  it('parses week durations and negatives', () => {
    expect(Duration.parse('P2W').weeks).toBe(2);
    expect(Duration.parse('-PT90M').minutes).toBe(-90);
    expect(Duration.parse('PT0S').isZero()).toBe(true);
  });

  it('totals time units and rejects calendar-only totals', () => {
    expect(Duration.of({ hours: 2, minutes: 30 }).total('minute')).toBe(150);
    expect(() => Duration.of({ months: 1 }).total('day')).toThrow(TempoError);
  });

  it('rejects junk', () => {
    expect(Duration.tryParse('2 hours').ok).toBe(false);
    expect(Duration.tryParse('P').ok).toBe(false);
  });
});
