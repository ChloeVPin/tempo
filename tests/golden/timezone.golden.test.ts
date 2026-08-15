import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

const cases: Array<{ instant: string; zone: string; local: string; offset: string }> = [
  { instant: '2026-06-01T16:00:00Z', zone: 'America/New_York', local: '2026-06-01T12:00:00', offset: '-04:00' },
  { instant: '2026-01-01T16:00:00Z', zone: 'America/New_York', local: '2026-01-01T11:00:00', offset: '-05:00' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Europe/London', local: '2026-06-01T01:00:00', offset: '+01:00' },
  { instant: '2026-01-01T00:00:00Z', zone: 'Europe/London', local: '2026-01-01T00:00:00', offset: '+00:00' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Asia/Kolkata', local: '2026-06-01T05:30:00', offset: '+05:30' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Asia/Kathmandu', local: '2026-06-01T05:45:00', offset: '+05:45' },
  { instant: '2026-01-15T12:00:00Z', zone: 'Australia/Sydney', local: '2026-01-15T23:00:00', offset: '+11:00' },
  { instant: '2026-07-15T12:00:00Z', zone: 'Australia/Sydney', local: '2026-07-15T22:00:00', offset: '+10:00' },
];

describe('timezone golden table', () => {
  it('records host ICU / node metadata', () => {
    expect(process.version).toMatch(/^v\d+/);
  });

  for (const row of cases) {
    it(`${row.instant} in ${row.zone}`, () => {
      const zdt = Instant.parse(row.instant).toZonedDateTime(row.zone) as ZonedDateTime;
      expect(zdt.toLocalDateTime().toISO()).toBe(row.local);
      expect(zdt.toISO()).toContain(row.offset);
      expect(zdt.toInstant().toISO()).toBe(Instant.parse(row.instant).toISO());
    });
  }
});
