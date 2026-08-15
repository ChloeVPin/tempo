# Work packages

Do these in order unless the user names a different goal. Each package is one logical PR/commit series. Do not start WP4 features before WP1–WP2 correctness work unless asked.

After finishing a package: tick it here, tick the matching line in `docs/ROADMAP.md`, update `docs/STATUS.md`, push, wait for public CI.

---

## WP1 — Timezone and civil hardening (Phase 1, first)

**Status: done** (2026-08-15). See `tests/golden/timezone.golden.test.ts` (26 transition rows + 8 baseline; ICU-history-guarded `Pacific/Apia` and 2018 `America/Sao_Paulo`), `tests/unit/civil-walk.test.ts` (73,414-day walk), `tests/unit/zoned.test.ts` (London gap/overlap + São Paulo midnight-gap `startOf('day')`).

**Goal:** stop being “looks right on 8 goldens” and become hard to lie about.

**Do**

1. Expand `tests/golden/timezone.golden.test.ts`:
   - Keep the existing 8 rows.
   - Add DST transitions for `America/New_York`, `Europe/London`, `Europe/Paris`, `Australia/Sydney`, `Pacific/Auckland`, `America/Sao_Paulo`.
   - Add non-hour: `Asia/Kolkata`, `Asia/Kathmandu`, `Australia/Eucla` if Intl knows it.
   - Add one historical political change if Intl on CI has the data: `Pacific/Apia` around 2011-12-30 (Samoa skipped a day). If ICU on the runner lacks history, skip with a comment and record Node/ICU version — do not fake the golden.
2. Add `tests/unit/civil-walk.test.ts`: every day from `1900-01-01` through `2100-12-31` (`daysFromCivil` ↔ `civilFromDays`, valid, `LocalDate.parse(toISO())` round-trip). This is ~73k days; keep it a single tight loop, not 73k `it()`s.
3. Add `Europe/London` spring-forward / fall-back unit cases next to the NY ones in `tests/unit/zoned.test.ts`.
4. Test `ZonedDateTime.startOf('day')` on a date whose midnight does not exist if you can find one in Intl (or document that no CI zone has a midnight gap).

**Do not**

- Bundle tzdata.
- Change disambiguation defaults.

**Done when**

- `npm test` includes the walk and extra goldens.
- NY 2026 gap/overlap invariants still hold (`docs/INVARIANTS.md`).
- CI green on Node 20/22/24.

---

## WP2 — Parser and Temporal differential (Phase 1)

**Status: done** (2026-08-15). Fuzz grew to 4 suites (ascii ≤512, unicode/control via `unit: 'binary'`, ISO-fragment splicing, fixed adversarial list) — TempoError-only throws, <50 ms/input. `tests/differential/temporal.test.ts` is skip-safe and passes 6/6 against pinned `@js-temporal/polyfill@0.5.1` via the `temporal-diff` CI job (`vitest.temporal.config.ts`).

**Goal:** parsers stay bounded; semantics match Temporal where Temporal exists.

**Do**

1. Strengthen `tests/fuzz/parse.fuzz.test.ts`: longer strings, unicode, mixed `T`/` `, extra fraction digits, duplicate `P`/`T`. Assert no throw other than `TempoError` and runtime < 50 ms per input.
2. Add `tests/differential/temporal.test.ts` that **skips** when `typeof Temporal === 'undefined'`. Where present, compare:
   - ISO date/datetime/instant parse
   - `plus({ months: 1 })` on month-end
   - NY gap `compatible` / `earlier` / `later` / `reject`
3. Optionally add a CI job that installs `@js-temporal/polyfill` and runs the differential file with the polyfill injected. Pin the polyfill version.
4. Replace per-type regex with a shared scanner **only if** you can prove (bench + fuzz) it is not slower and not larger. Not required.

**Done when**

- Fuzz still finishes quickly in CI.
- Differential file exists and is skip-safe.
- No `Date.parse` introduced.

---

## WP3 — Coverage and dead code (Phase 1)

**Status: done** (2026-08-15). Unused paths now tested (`today`, `min`/`max`, `LocalTime.now`, `Duration.negated`/`abs`, `with`/`isDST`/`endOf`, `setTimeZoneProvider`, `parseOffset`, `compare.ts` `isBetween` — kept, it is exported from the barrel). `temporal/interop.ts` tested against a fake `globalThis.Temporal`. Thresholds raised 68/58/65 → 74/62/72; `compare.ts` and `src/temporal/**` removed from coverage excludes. `as ZonedDateTime` casts removed from `compat/moment.ts`.

**Goal:** coverage means something.

**Do**

1. Tests for unused paths: `LocalDate.today`, `min`/`max`, `LocalTime.now`, `Duration.negated`/`abs`, `ZonedDateTime.with` / `isDST` / `endOf`, `setTimeZoneProvider`, `parseOffset`, `compare.ts` `isBetween` **or** delete the unused helper.
2. Tests for `src/temporal/interop.ts` using a tiny fake `globalThis.Temporal` (do not require native).
3. Raise `vitest.config.ts` thresholds toward lines 80 / functions 70 / branches 70 as tests land. Do not raise first and then skip tests.
4. Remove leftover `as ZonedDateTime` casts in `src/compat/moment.ts` if types already resolve.

**Done when**

- Thresholds go up in the same PR as the tests that justify them.
- `src/core/compare.ts` is either tested or deleted.

---

## WP4 — Runtime matrix (Phase 1)

**Status: done** (2026-08-15). `tests/runtime/bun-smoke.ts` (Bun runs TS source; verified on bun 1.3.14), `tests/runtime/deno-smoke.mjs` (Deno imports built ESM), `tests/runtime/browser-smoke.mjs` (Playwright + system Chrome; verified locally). CI jobs `bun-smoke`, `deno-smoke`, `playwright-smoke`, all `fail-fast: false`, each documenting what it proves.

**Goal:** prove the kernel on more than Node.

**Do**

1. CI smoke: Bun (`bun test` or `bun ./node_modules/vitest/vitest.mjs run` on a small file set).
2. CI smoke: Deno (import the built ESM).
3. Playwright Chromium: parse/format/zoned NY June 2026 only.
4. Keep jobs `fail-fast: false`.

**Done when**

- Workflow file documents what each job proves.
- A Node-only failure still fails the required `test` job.

---

## WP5 — Size and module graph (Phase 1 / 1.0 prep)

**Status: done** (2026-08-15). `format` / `toLocaleString` / `relativeTime` removed from the main barrel — use the subpath entries. Main barrel 10.4 → 8.9 kB min+gzip (7.8 kB brotli). Full gzip table recorded in `docs/ROADMAP.md`; size-limit gates gzip (10 kB index / 6 kB format).

**Goal:** default import closer to the design budget (core 4–6 kB gzip).

**Do**

1. Measure min+gzip (not just brotli) for `dist/index.js`, `format`, `tz`, `compat`.
2. Decide whether `format` / `toLocaleString` / `relativeTime` stay on the main barrel. If you remove them, it is a breaking change for `0.x` — update `docs/API.md` and README.
3. Do not import `compat` or `temporal` from `src/index.ts`.

**Done when**

- Numbers are written in `docs/ROADMAP.md` or CHANGELOG.
- Size-limit still passes.

---

## WP6 — 1.0 API freeze candidates (Phase 2)

**Status: API freeze audit complete** (2026-08-15). The exact runtime export surface is locked by `tests/unit/public-api.test.ts`; the Interval, custom parser, Duration, fixed-offset, clock, and migration decisions are documented. npm publication remains an explicit release step.

Only after WP1–WP2.

Locked decisions:

1. [x] Generic `Interval<T>` (`start`, `end`) with half-open `[start, end)` default; `DateRange.of(...)` for `LocalDate`.
2. [x] Strict numeric LocalDate custom token **parser** (`parse(input, 'dd/MM/yyyy')`) — uses tokens from `src/format/tokens.ts`; locale-sensitive parsing remains deferred.
3. [x] Keep `Duration` as mixed fields through 1.0. Revisit `Period` only if Temporal interop or real usage demonstrates a need.
4. [x] Keep offset zones as `ZonedDateTime` with fixed-offset IDs; defer a distinct `OffsetDateTime` until real usage requires it.
5. Publish `tempo-js@1.0.0` after API freeze + changelog. **Deferred:** publishing remains a separate, explicit user request.

**Done when**

- `docs/DESIGN.md` open questions are answered in writing.
- CHANGELOG has a 1.0 readiness section.
- npm publish is a separate, explicit user request.

---

## Out of scope until someone asks

Locale-sensitive parsing, RRULE, non-Gregorian calendars, BigInt nanos, holiday plugins, date-picker helpers, full Moment plugin surface, embedded tzdata packages.

---

## If you are asked to “just finish Tempo”

That means: complete the documented hardening and API-freeze work, then stop before npm publication or embedded tzdata. Those are explicit release/product decisions, not work to invent silently.
