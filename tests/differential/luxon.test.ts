import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { Instant } from '../../src/core/instant.js';
import { LocalDate } from '../../src/core/local-date.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

// Luxon is a secondary oracle (docs/TESTING.md priority 4). Only
// non-ambiguous cases are compared: no DST gaps/overlaps, no lax parsing,
// no locale output. Behaviors that intentionally differ (parse strictness,
// gap/overlap defaults) are out of scope here.

describe('differential vs Luxon', () => {
  it('parses ISO dates identically', () => {
    for (const iso of ['2026-06-01', '2024-02-29', '1999-12-31', '2100-02-28']) {
      expect(DateTime.fromISO(iso).toISODate()).toBe(LocalDate.parse(iso).toISO());
    }
  });

  it('agrees on calendar arithmetic (constrain month-end)', () => {
    expect(DateTime.fromISO('2026-06-01').plus({ days: 40 }).toISODate()).toBe(
      LocalDate.of(2026, 6, 1).plus({ days: 40 }).toISO(),
    );
    expect(DateTime.fromISO('2026-01-31').plus({ months: 1 }).toISODate()).toBe(
      LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO(),
    );
    expect(DateTime.fromISO('2024-02-29').plus({ years: 1 }).toISODate()).toBe(
      LocalDate.of(2024, 2, 29).plus({ years: 1 }).toISO(),
    );
  });

  it('agrees on instant epoch milliseconds', () => {
    for (const iso of ['2026-06-01T12:00:00Z', '2026-06-01T14:00:00+02:00', '2026-01-01T00:00:00-05:00']) {
      expect(DateTime.fromISO(iso).toMillis()).toBe(Instant.parse(iso).epochMillis);
    }
  });

  it('agrees on ISO weekdays (Monday = 1)', () => {
    expect(DateTime.fromISO('2026-06-01').weekday).toBe(LocalDate.parse('2026-06-01').dayOfWeek());
    expect(DateTime.fromISO('2025-12-29').weekday).toBe(LocalDate.parse('2025-12-29').dayOfWeek());
  });

  it('agrees on day-of-year', () => {
    expect(DateTime.fromISO('2026-06-01').ordinal).toBe(LocalDate.parse('2026-06-01').dayOfYear());
    expect(DateTime.fromISO('2024-12-31').ordinal).toBe(LocalDate.parse('2024-12-31').dayOfYear());
  });

  it('agrees on startOf units', () => {
    expect(DateTime.fromISO('2026-06-15').startOf('month').toISODate()).toBe(
      LocalDate.of(2026, 6, 15).startOf('month').toISO(),
    );
    expect(DateTime.fromISO('2026-06-15').startOf('year').toISODate()).toBe(
      LocalDate.of(2026, 6, 15).startOf('year').toISO(),
    );
  });

  it('agrees on zoned local fields away from transitions', () => {
    const ny = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York');
    const lxNy = DateTime.fromISO('2026-06-01T16:00:00Z').setZone('America/New_York');
    expect(lxNy.offset).toBe(ny.offsetMs / 60_000);
    expect(lxNy.toISODate()).toBe(ny.toLocalDate().toISO());
    expect(lxNy.hour).toBe(ny.hour);

    // Southern hemisphere, standard time.
    const syd = Instant.parse('2026-07-15T12:00:00Z').toZonedDateTime('Australia/Sydney');
    const lxSyd = DateTime.fromISO('2026-07-15T12:00:00Z').setZone('Australia/Sydney');
    expect(lxSyd.offset).toBe(syd.offsetMs / 60_000);
    expect(lxSyd.hour).toBe(syd.hour);
  });

  it('round-trips a zoned value through the shared ISO shape', () => {
    const zdt = ZonedDateTime.parse('2026-06-01T12:00:00-04:00[America/New_York]');
    // Compare instant + wall clock, not the ISO string (Luxon keeps offset
    // seconds and zone id formatting its own way).
    expect(DateTime.fromISO(zdt.toInstant().toISO()).setZone('America/New_York').toMillis()).toBe(
      zdt.epochMillis,
    );
  });
});
