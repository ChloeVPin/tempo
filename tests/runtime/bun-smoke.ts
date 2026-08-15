/**
 * Bun smoke: proves the kernel's TypeScript source runs under Bun.
 * Run with `bun run tests/runtime/bun-smoke.ts` (no build step needed).
 */
import { Instant, LocalDate, ZonedDateTime } from '../../src/index.js';

const d = LocalDate.parse('2026-06-01').plus({ days: 1 });
if (d.toISO() !== '2026-06-02') throw new Error(`bun smoke: LocalDate gave ${d.toISO()}`);

const z = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York');
if (z.toLocalDateTime().toISO() !== '2026-06-01T12:00:00') {
  throw new Error(`bun smoke: zoned gave ${z.toLocalDateTime().toISO()}`);
}
if (!ZonedDateTime.parse(z.toISO()).equals(z)) throw new Error('bun smoke: zoned round-trip failed');

console.log('bun smoke ok');
