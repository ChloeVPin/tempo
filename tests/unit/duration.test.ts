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

  it('serializes fractional time/date fields without corrupting the value', () => {
    const cases: Array<[string, string]> = [
      ['PT0.5H', 'PT30M'],
      ['PT1.5H', 'PT1H30M'],
      ['PT1.5M', 'PT1M30S'],
      ['P0.5D', 'PT12H'],
      ['P1.5D', 'P1DT12H'],
      ['PT0.9995S', 'PT1S'],
      ['PT1.5S', 'PT1.5S'],
      ['-PT0.5H', '-PT30M'],
      ['P0.5W', 'P3DT12H'],
      ['P0.25W', 'P1DT18H'],
    ];
    for (const [input, iso] of cases) {
      const d = Duration.parse(input);
      expect(d.toISO()).toBe(iso);
      expect(JSON.parse(JSON.stringify(d))).toBe(iso);
      expect(Duration.parse(d.toISO()).equals(d)).toBe(true);
    }
    // Direct construction also serializes exactly and keeps the same total value.
    expect(Duration.of({ milliseconds: 1800000 }).toISO()).toBe('PT30M');
    expect(Duration.of({ milliseconds: 1800000 }).total('millisecond')).toBe(1800000);
    expect(Duration.of({ milliseconds: -1500 }).toISO()).toBe('-PT1.5S');
  });

  it('tryParse never throws, even for numerically hostile inputs', () => {
    // A fraction with 400 digits overflows Number; tryParse must report it, not throw.
    const hostile = `P0.${'9'.repeat(400)}D`;
    expect(() => Duration.tryParse(hostile)).not.toThrow();
    expect(Duration.tryParse(hostile).ok).toBe(false);
    expect(Duration.tryParse(`PT0.${'9'.repeat(400)}H`).ok).toBe(false);
  });

  it('supports sign, negation and absolute value', () => {
    const d = Duration.of({ hours: 2, minutes: 30 });
    expect(d.sign).toBe(1);
    expect(d.negated().toISO()).toBe('-PT2H30M');
    expect(d.negated().negated().equals(d)).toBe(true);
    expect(Duration.parse('-PT90M').abs().toISO()).toBe('PT90M');
    expect(Duration.of({ seconds: -1 }).sign).toBe(-1);
    expect(Duration.zero().sign).toBe(0);
    expect(Duration.zero().negated().isZero()).toBe(true);
  });
});
