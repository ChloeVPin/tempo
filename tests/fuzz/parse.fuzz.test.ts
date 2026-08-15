import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { TempoError, type ParseResult } from '../../src/errors.js';
import { LocalDate } from '../../src/core/local-date.js';
import { LocalTime } from '../../src/core/local-time.js';
import { LocalDateTime } from '../../src/core/local-datetime.js';
import { Instant } from '../../src/core/instant.js';
import { Duration } from '../../src/core/duration.js';

type TryParseFn = (input: string) => ParseResult<unknown>;

const PARSERS: TryParseFn[] = [
  LocalDate.tryParse,
  LocalTime.tryParse,
  LocalDateTime.tryParse,
  Instant.tryParse,
  Duration.tryParse,
];

/**
 * Every parser must stay bounded (< 50 ms per input across all parsers) and
 * may only fail with a TempoError — never a RangeError, TypeError, or hang.
 */
function expectSafe(input: string): void {
  const started = Date.now();
  for (const parse of PARSERS) {
    try {
      const result = parse(input);
      expect(typeof result.ok).toBe('boolean');
      if (!result.ok) expect(result.reason).toBeTypeOf('string');
    } catch (err) {
      expect(err).toBeInstanceOf(TempoError);
    }
  }
  expect(Date.now() - started).toBeLessThan(50);
}

// Hand-picked cases the random generators are unlikely to produce: mixed
// T/space separators, offsets where none are allowed, extra fraction digits,
// duplicate P/T/designators, huge numbers, out-of-range fields.
const ADVERSARIAL: string[] = [
  '2026-06-01T12:00:00.12345678901234567890', // 20 fraction digits
  '2026-06-01 12:00:00', // space separator (valid for LocalDateTime)
  '2026-06-01 T 12:00:00',
  '2026-06-01T12:00:00Z', // offset in a local-only input
  '2026-06-01T12:00:00+02:00',
  '2026-06-01T12:00:00[America/New_York]',
  'PP1D', // duplicate P
  'PT1HT', // duplicate T
  'P1YT', // T with no time fields
  'P', // bare P
  'PT', // bare PT
  'P1Y1Y', // duplicate designator
  'P1M1M',
  'P1D1D',
  'PT1H1H',
  'P1.5.5D', // double fraction
  'P0000000000000000000000001D', // leading zeros
  'P999999999999999999999999999999999999999999999999D', // exceeds safe integer
  '2026-13-45',
  '2026-02-30T25:61:61',
  '2026-W00-1',
  '１２３４５', // fullwidth digits
  'x'.repeat(1000),
];

describe('parser fuzz', () => {
  it('never hangs or throws unexpected errors on random ascii strings', () => {
    fc.assert(fc.property(fc.string({ maxLength: 512 }), expectSafe), { numRuns: 400 });
  });

  it('never hangs or throws unexpected errors on unicode / control-char strings', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary', maxLength: 128 }), expectSafe), {
      numRuns: 300,
    });
  });

  it('never hangs on strings that splice ISO-like fragments', () => {
    const fragment = fc.constantFrom(
      '2026', '-06', '-01', 'T', ' ', '12', ':00', ':00', '.', '123',
      'Z', '+02:00', '[America/New_York]', 'P', '1', 'Y', 'M', 'D', 'W', 'H', 'S',
    );
    fc.assert(
      fc.property(fc.array(fragment, { minLength: 0, maxLength: 14 }), (parts) => {
        expectSafe(parts.join(''));
      }),
      { numRuns: 400 },
    );
  });

  it('rejects hand-picked adversarial inputs safely', () => {
    for (const input of ADVERSARIAL) expectSafe(input);
  });
});
