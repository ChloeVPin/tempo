import { describe, expect, it } from 'vitest';
import { Instant } from '../../src/core/instant.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';
import { intlLocalAt } from '../helpers/intl-history.js';

interface GoldenRow {
  instant: string;
  zone: string;
  local: string;
  offset: string;
  /** false = skip on hosts whose ICU lacks historical tz data (never a library failure) */
  history?: boolean;
}

// Baseline offset rows.
const cases: GoldenRow[] = [
  { instant: '2026-06-01T16:00:00Z', zone: 'America/New_York', local: '2026-06-01T12:00:00', offset: '-04:00' },
  { instant: '2026-01-01T16:00:00Z', zone: 'America/New_York', local: '2026-01-01T11:00:00', offset: '-05:00' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Europe/London', local: '2026-06-01T01:00:00', offset: '+01:00' },
  { instant: '2026-01-01T00:00:00Z', zone: 'Europe/London', local: '2026-01-01T00:00:00', offset: '+00:00' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Asia/Kolkata', local: '2026-06-01T05:30:00', offset: '+05:30' },
  { instant: '2026-06-01T00:00:00Z', zone: 'Asia/Kathmandu', local: '2026-06-01T05:45:00', offset: '+05:45' },
  { instant: '2026-01-15T12:00:00Z', zone: 'Australia/Sydney', local: '2026-01-15T23:00:00', offset: '+11:00' },
  { instant: '2026-07-15T12:00:00Z', zone: 'Australia/Sydney', local: '2026-07-15T22:00:00', offset: '+10:00' },
];

// Direct-Intl probes (independent of the library) for the pre-2026 rows.
const SAO_PAULO_2018 = intlLocalAt('2018-11-04T03:00:00Z', 'America/Sao_Paulo') === '2018-11-04T01:00:00';
const APIA_2011 = intlLocalAt('2011-12-30T10:00:00Z', 'Pacific/Apia') === '2011-12-31T00:00:00';

// DST transition boundaries: each pair straddles one switch, 2026 unless noted.
const transitionCases: GoldenRow[] = [
  // America/New_York — spring forward 2026-03-08 02:00 -> 03:00
  { instant: '2026-03-08T06:59:59Z', zone: 'America/New_York', local: '2026-03-08T01:59:59', offset: '-05:00' },
  { instant: '2026-03-08T07:00:00Z', zone: 'America/New_York', local: '2026-03-08T03:00:00', offset: '-04:00' },
  // America/New_York — fall back 2026-11-01 02:00 -> 01:00
  { instant: '2026-11-01T05:59:59Z', zone: 'America/New_York', local: '2026-11-01T01:59:59', offset: '-04:00' },
  { instant: '2026-11-01T06:59:59Z', zone: 'America/New_York', local: '2026-11-01T01:59:59', offset: '-05:00' },
  // Europe/London — spring forward 2026-03-29 01:00 UTC -> 02:00 BST
  { instant: '2026-03-29T00:59:59Z', zone: 'Europe/London', local: '2026-03-29T00:59:59', offset: '+00:00' },
  { instant: '2026-03-29T01:00:00Z', zone: 'Europe/London', local: '2026-03-29T02:00:00', offset: '+01:00' },
  // Europe/London — fall back 2026-10-25 02:00 BST -> 01:00 GMT
  { instant: '2026-10-25T00:59:59Z', zone: 'Europe/London', local: '2026-10-25T01:59:59', offset: '+01:00' },
  { instant: '2026-10-25T01:00:00Z', zone: 'Europe/London', local: '2026-10-25T01:00:00', offset: '+00:00' },
  // Europe/Paris — spring forward 2026-03-29 02:00 -> 03:00 (01:00 UTC)
  { instant: '2026-03-29T00:59:59Z', zone: 'Europe/Paris', local: '2026-03-29T01:59:59', offset: '+01:00' },
  { instant: '2026-03-29T01:00:00Z', zone: 'Europe/Paris', local: '2026-03-29T03:00:00', offset: '+02:00' },
  // Europe/Paris — fall back 2026-10-25 03:00 -> 02:00 (01:00 UTC)
  { instant: '2026-10-25T00:59:59Z', zone: 'Europe/Paris', local: '2026-10-25T02:59:59', offset: '+02:00' },
  { instant: '2026-10-25T01:00:00Z', zone: 'Europe/Paris', local: '2026-10-25T02:00:00', offset: '+01:00' },
  // Australia/Sydney — DST ends 2026-04-05 03:00 AEDT -> 02:00 AEST (16:00 UTC)
  { instant: '2026-04-04T15:59:59Z', zone: 'Australia/Sydney', local: '2026-04-05T02:59:59', offset: '+11:00' },
  { instant: '2026-04-04T16:00:00Z', zone: 'Australia/Sydney', local: '2026-04-05T02:00:00', offset: '+10:00' },
  // Australia/Sydney — DST starts 2026-10-04 02:00 AEST -> 03:00 AEDT (16:00 UTC)
  { instant: '2026-10-03T15:59:59Z', zone: 'Australia/Sydney', local: '2026-10-04T01:59:59', offset: '+10:00' },
  { instant: '2026-10-03T16:00:00Z', zone: 'Australia/Sydney', local: '2026-10-04T03:00:00', offset: '+11:00' },
  // Pacific/Auckland — DST ends 2026-04-05 03:00 NZDT -> 02:00 NZST (14:00 UTC)
  { instant: '2026-04-04T13:59:59Z', zone: 'Pacific/Auckland', local: '2026-04-05T02:59:59', offset: '+13:00' },
  { instant: '2026-04-04T14:00:00Z', zone: 'Pacific/Auckland', local: '2026-04-05T02:00:00', offset: '+12:00' },
  // Pacific/Auckland — DST starts 2026-09-27 02:00 NZST -> 03:00 NZDT (14:00 UTC)
  { instant: '2026-09-26T13:59:59Z', zone: 'Pacific/Auckland', local: '2026-09-27T01:59:59', offset: '+12:00' },
  { instant: '2026-09-26T14:00:00Z', zone: 'Pacific/Auckland', local: '2026-09-27T03:00:00', offset: '+13:00' },
  // America/Sao_Paulo — Brazil abolished DST in 2019; UTC-3 year-round in 2026
  { instant: '2026-01-15T12:00:00Z', zone: 'America/Sao_Paulo', local: '2026-01-15T09:00:00', offset: '-03:00' },
  { instant: '2026-07-15T12:00:00Z', zone: 'America/Sao_Paulo', local: '2026-07-15T09:00:00', offset: '-03:00' },
  // America/Sao_Paulo — last DST: spring forward 2018-11-04 00:00 -> 01:00 (03:00 UTC). Historical: needs ICU tzdata.
  { instant: '2018-11-04T02:59:59Z', zone: 'America/Sao_Paulo', local: '2018-11-03T23:59:59', offset: '-03:00', history: SAO_PAULO_2018 },
  { instant: '2018-11-04T03:00:00Z', zone: 'America/Sao_Paulo', local: '2018-11-04T01:00:00', offset: '-02:00', history: SAO_PAULO_2018 },
  // Australia/Eucla — non-hour offset +08:45
  { instant: '2026-06-01T00:00:00Z', zone: 'Australia/Eucla', local: '2026-06-01T08:45:00', offset: '+08:45' },
  // Pacific/Apia — Samoa skipped 2011-12-30 entirely (date-line move, UTC-10 -> +14). Historical: needs ICU tzdata.
  { instant: '2011-12-30T09:59:59Z', zone: 'Pacific/Apia', local: '2011-12-29T23:59:59', offset: '-10:00', history: APIA_2011 },
  { instant: '2011-12-30T10:00:00Z', zone: 'Pacific/Apia', local: '2011-12-31T00:00:00', offset: '+14:00', history: APIA_2011 },
];

function checkRow(row: GoldenRow): () => void {
  return () => {
    const zdt = Instant.parse(row.instant).toZonedDateTime(row.zone) as ZonedDateTime;
    expect(zdt.toLocalDateTime().toISO()).toBe(row.local);
    expect(zdt.toISO()).toContain(row.offset);
    expect(zdt.toInstant().toISO()).toBe(Instant.parse(row.instant).toISO());
  };
}

describe('timezone golden table', () => {
  it('records host ICU / node metadata', () => {
    expect(process.version).toMatch(/^v\d+/);
    expect(process.versions.icu).toMatch(/^\d+/);
  });

  for (const row of cases) {
    it(`${row.instant} in ${row.zone}`, checkRow(row));
  }

  for (const row of transitionCases) {
    const skipped = row.history === false;
    const title = skipped
      ? `${row.instant} in ${row.zone} (skipped: host ICU lacks tzdata history; icu ${process.versions.icu})`
      : `${row.instant} in ${row.zone}`;
    it.skipIf(skipped)(title, checkRow(row));
  }

  it.skipIf(!APIA_2011)(`Pacific/Apia skipped the whole day 2011-12-30 (icu ${process.versions.icu})`, () => {
    const before = Instant.parse('2011-12-30T09:59:59Z').toZonedDateTime('Pacific/Apia') as ZonedDateTime;
    const after = Instant.parse('2011-12-30T10:00:00Z').toZonedDateTime('Pacific/Apia') as ZonedDateTime;
    // One UTC second later is two local calendar days later: the date-line jump.
    expect(before.toLocalDate().toISO()).toBe('2011-12-29');
    expect(after.toLocalDate().toISO()).toBe('2011-12-31');
    expect(after.epochMillis - before.epochMillis).toBe(1000);
  });
});
