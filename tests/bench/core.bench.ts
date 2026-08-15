import { bench, describe } from 'vitest';
import { LocalDate } from '../../src/core/local-date.js';
import { Instant } from '../../src/core/instant.js';

describe('core benches', () => {
  bench('LocalDate.parse', () => {
    LocalDate.parse('2026-06-01');
  });

  bench('LocalDate.plus days', () => {
    LocalDate.of(2026, 6, 1).plus({ days: 1 });
  });

  bench('Instant.parse', () => {
    Instant.parse('2026-06-01T12:00:00Z');
  });
});
