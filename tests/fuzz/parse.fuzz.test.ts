import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { LocalDate } from '../../src/core/local-date.js';
import { Instant } from '../../src/core/instant.js';
import { Duration } from '../../src/core/duration.js';

describe('parser fuzz', () => {
  it('never hangs or throws unexpected errors on random strings', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 80 }), (input) => {
        const started = Date.now();
        const results = [LocalDate.tryParse(input), Instant.tryParse(input), Duration.tryParse(input)];
        expect(Date.now() - started).toBeLessThan(50);
        for (const result of results) {
          expect(typeof result.ok).toBe('boolean');
          if (!result.ok) expect(result.reason).toBeTypeOf('string');
        }
      }),
      { numRuns: 200 },
    );
  });
});
