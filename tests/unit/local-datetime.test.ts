import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { LocalTime } from '../../src/core/local-time.js';

describe('LocalDateTime', () => {
  it('parses combined ISO values', () => {
    const dt = LocalDateTime.parse('2026-06-01T09:30:00');
    expect(dt.date.toISO()).toBe('2026-06-01');
    expect(dt.time.toISO()).toBe('09:30:00');
    expect(dt.toISO()).toBe('2026-06-01T09:30:00');
  });

  it('carries time overflow into the date', () => {
    const dt = LocalDateTime.parse('2026-06-01T23:30:00').plus({ hours: 2 });
    expect(dt.toISO()).toBe('2026-06-02T01:30:00');
  });

  it('combines date and time', () => {
    const dt = LocalDateTime.combine(LocalDate.of(2026, 1, 2), LocalTime.of(3, 4, 5));
    expect(dt.equals(LocalDateTime.of(2026, 1, 2, 3, 4, 5))).toBe(true);
  });
});
