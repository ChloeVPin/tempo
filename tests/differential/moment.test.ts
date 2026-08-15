import { describe, expect, it } from 'vitest';
import momentJs from 'moment';
import momentTimezone from 'moment-timezone';
import { moment } from '../../src/compat/moment.js';

describe('Moment compat differential', () => {
  it('matches Moment for UTC parsing, formatting, and ISO output', () => {
    const input = '2026-06-01T16:23:45.678Z';
    const tempo = moment(input);
    const oracle = momentJs.utc(input);

    expect(tempo.format('YYYY-MM-DD HH:mm:ss.SSS Z')).toBe(
      oracle.format('YYYY-MM-DD HH:mm:ss.SSS Z'),
    );
    expect(tempo.toISOString()).toBe(oracle.toISOString());
    expect(tempo.valueOf()).toBe(oracle.valueOf());
  });

  it('matches constrained month-end arithmetic without mutating the input', () => {
    const input = '2024-01-31T12:00:00.000Z';
    const tempo = moment(input);
    const oracle = momentJs.utc(input).add(1, 'month');

    expect(tempo.add(1, 'month').toISOString()).toBe(oracle.toISOString());
    expect(tempo.toISOString()).toBe(input);
  });

  it('matches add, subtract, and diff for unambiguous time arithmetic', () => {
    const input = '2026-06-03T12:00:00.000Z';
    const tempo = moment(input);
    const oracle = momentJs.utc(input);

    expect(tempo.add(36, 'hours').toISOString()).toBe(oracle.clone().add(36, 'hours').toISOString());
    expect(tempo.subtract(2, 'days').toISOString()).toBe(oracle.clone().subtract(2, 'days').toISOString());

    const other = '2026-06-01T00:00:00.000Z';
    expect(tempo.diff(other, 'day')).toBe(oracle.diff(momentJs.utc(other), 'day'));
    expect(tempo.diff(other, 'hour', true)).toBe(oracle.diff(momentJs.utc(other), 'hour', true));
  });

  it('matches startOf and endOf for UTC calendar units', () => {
    const input = '2026-06-15T12:34:56.789Z';
    const tempo = moment(input);
    const oracle = momentJs.utc(input);

    for (const unit of ['day', 'month', 'year'] as const) {
      expect(tempo.startOf(unit).toISOString()).toBe(oracle.clone().startOf(unit).toISOString());
      expect(tempo.endOf(unit).toISOString()).toBe(oracle.clone().endOf(unit).toISOString());
    }
  });

  it('matches timezone conversion away from transitions', () => {
    const input = '2026-06-01T16:00:00.000Z';
    const tempo = moment(input).tz('America/New_York');
    const oracle = momentTimezone.utc(input).tz('America/New_York');

    expect(tempo.format('YYYY-MM-DD HH:mm:ss Z')).toBe(oracle.format('YYYY-MM-DD HH:mm:ss Z'));
    expect(tempo.utcOffset()).toBe(oracle.utcOffset());
    expect(tempo.valueOf()).toBe(oracle.valueOf());
  });

  it('matches fixed offset conversion and epoch helpers', () => {
    const input = '2026-01-01T00:00:00.000Z';
    const tempo = moment(input).utcOffset(330);
    const oracle = momentJs.utc(input).utcOffset(330);

    expect(tempo.format('YYYY-MM-DD HH:mm:ss Z')).toBe(oracle.format('YYYY-MM-DD HH:mm:ss Z'));
    expect(tempo.unix()).toBe(oracle.unix());
    expect(tempo.valueOf()).toBe(oracle.valueOf());
  });
});
