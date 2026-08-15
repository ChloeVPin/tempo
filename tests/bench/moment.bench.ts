import { bench, describe } from 'vitest';
import momentJs from 'moment';
import { LocalDate } from '../../src/core/local-date.js';
import { Instant } from '../../src/core/instant.js';
import { format } from '../../src/format/format.js';

const dateInput = '2026-06-01';
const instantInput = '2026-06-01T12:00:00.000Z';

/**
 * Comparison only: Moment remains an oracle for the compat adapter, not core
 * correctness. Run with `npm run bench` and compare within the same process.
 */
describe('Tempo vs Moment', () => {
  bench('Tempo LocalDate.parse', () => {
    LocalDate.parse(dateInput);
  });

  bench('Moment utc date parse', () => {
    momentJs.utc(dateInput);
  });

  bench('Tempo LocalDate plus day', () => {
    LocalDate.parse(dateInput).plus({ days: 1 });
  });

  bench('Moment utc plus day', () => {
    momentJs.utc(dateInput).add(1, 'day');
  });

  bench('Tempo Instant.parse', () => {
    Instant.parse(instantInput);
  });

  bench('Moment utc instant parse', () => {
    momentJs.utc(instantInput);
  });

  bench('Tempo LocalDate format', () => {
    format(LocalDate.parse(dateInput), 'yyyy-MM-dd');
  });

  bench('Moment date format', () => {
    momentJs.utc(dateInput).format('YYYY-MM-DD');
  });
});
