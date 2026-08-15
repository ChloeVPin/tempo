import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { format } from '../../src/format/format.js';
import { Instant } from '../../src/core/instant.js';
import { ZonedDateTime } from '../../src/tz/zoned-datetime.js';

describe('format', () => {
  it('formats civil dates with Java/Temporal tokens', () => {
    const d = LocalDate.of(2026, 6, 1);
    expect(format(d, 'yyyy-MM-dd')).toBe('2026-06-01');
    expect(format(d, 'dd/MM/yyyy')).toBe('01/06/2026');
    expect(format(d, "yyyy-MM-dd 'ok'")).toBe('2026-06-01 ok');
  });

  it('formats times and offsets', () => {
    const zdt = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York') as ZonedDateTime;
    expect(format(zdt, 'HH:mm XXX')).toBe('12:00 -04:00');
    expect(format(LocalDateTime.of(2026, 1, 1, 0, 5), 'hh:mm a')).toBe('12:05 AM');
  });
});
