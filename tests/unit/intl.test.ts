import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { Instant } from '../../src/core/instant.js';
import { toLocaleString } from '../../src/intl/locale-format.js';
import { useFixedClock } from '../../src/clock.js';

describe('intl locale formatting', () => {
  it('formats a local date with a locale', () => {
    const text = toLocaleString(LocalDate.of(2026, 6, 1), 'en-US', { dateStyle: 'medium' });
    expect(text).toMatch(/2026/);
  });

  it('formats a zoned instant in UTC', () => {
    const text = toLocaleString(Instant.parse('2026-06-01T12:00:00Z'), 'en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    expect(text).toMatch(/12/);
  });

  it('formats a local date-time', () => {
    const text = toLocaleString(LocalDateTime.of(2026, 1, 2, 3, 4), 'en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    expect(text.length).toBeGreaterThan(0);
  });

  it('formats civil years 0-99 literally, not 1900-1999', () => {
    expect(toLocaleString(LocalDate.of(50, 1, 1), 'en-US', { year: 'numeric' })).toBe('50');
    expect(toLocaleString(LocalDate.of(99, 1, 1), 'en-US', { year: 'numeric' })).toBe('99');
    expect(toLocaleString(LocalDateTime.of(50, 1, 1, 12, 0), 'en-US', { year: 'numeric' })).toBe(
      '50',
    );
  });
});

describe('clock', () => {
  it('makes today and now deterministic', () => {
    const restore = useFixedClock(Date.UTC(2026, 5, 1, 15, 0, 0));
    try {
      expect(Instant.now().toISO()).toBe('2026-06-01T15:00:00.000Z');
    } finally {
      restore();
    }
  });
});
