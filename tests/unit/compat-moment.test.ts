import { describe, expect, it } from 'vitest';
import { moment } from '../../src/compat/moment.js';

describe('moment compat', () => {
  it('formats and adds without mutating', () => {
    const m = moment('2026-06-01T00:00:00Z');
    const next = m.add(1, 'day');
    expect(m.format('YYYY-MM-DD')).toBe('2026-06-01');
    expect(next.format('YYYY-MM-DD')).toBe('2026-06-02');
    expect(next.diff(m, 'day')).toBe(1);
  });

  it('supports tz conversion', () => {
    const m = moment('2026-06-01T16:00:00Z').tz('America/New_York');
    expect(m.format('YYYY-MM-DD HH:mm')).toBe('2026-06-01 12:00');
  });

  it('exposes unix and toISOString', () => {
    const m = moment('2026-01-01T00:00:00Z');
    expect(m.unix()).toBe(1_767_225_600);
    expect(m.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
