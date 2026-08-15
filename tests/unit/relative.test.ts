import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { useFixedClock } from '../../src/clock.js';
import { fromNow } from '../../src/relative/relative-time.js';

describe('relative time', () => {
  it('describes a past instant', () => {
    const restore = useFixedClock(Date.UTC(2026, 5, 1, 12, 0, 0));
    try {
      const past = Instant.parse('2026-06-01T11:00:00Z');
      expect(fromNow(past, { locale: 'en' })).toMatch(/hour/i);
    } finally {
      restore();
    }
  });
});
