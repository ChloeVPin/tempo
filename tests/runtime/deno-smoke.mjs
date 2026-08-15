/**
 * Deno smoke: proves the built ESM bundle runs under Deno.
 * Run with `deno run tests/runtime/deno-smoke.mjs` after `npm run build`.
 * (.mjs so the TypeScript check in CI never has to resolve a missing dist/)
 */
import { Instant, LocalDate, ZonedDateTime } from '../../dist/index.js';

const d = LocalDate.parse('2026-06-01').plus({ days: 1 });
if (d.toISO() !== '2026-06-02') throw new Error(`deno smoke: LocalDate gave ${d.toISO()}`);

const z = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York');
if (z.toLocalDateTime().toISO() !== '2026-06-01T12:00:00') {
  throw new Error(`deno smoke: zoned gave ${z.toLocalDateTime().toISO()}`);
}
if (!ZonedDateTime.parse(z.toISO()).equals(z)) throw new Error('deno smoke: zoned round-trip failed');

console.log('deno smoke ok');
