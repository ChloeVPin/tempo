# Work packages

Do these in order unless the user names a different goal. Each package is one logical PR/commit series. Do not start WP4 features before WP1–WP2 correctness work unless asked.

After finishing a package: tick it here, tick the matching line in `docs/ROADMAP.md`, update `docs/STATUS.md`, push, wait for public CI.

---

## WP1 — Timezone and civil hardening (Phase 1, first)

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

Only after WP1–WP2.

Pick with the user if still open:

1. `Interval` (`start`, `end`) with half-open default `[start, end)`.
2. Custom token **parser** (`parse(input, 'dd/MM/yyyy')`) — tokens must match `src/format/tokens.ts`.
3. Keep `Duration` as mixed fields **or** split `Period` (years/months/weeks/days) vs time `Duration`. Default recommendation: **split only if** Temporal interop becomes painful; otherwise keep one type through 1.0.
4. Keep offset zones as `ZonedDateTime` (current) unless users need a distinct `OffsetDateTime`.
5. Publish `tempo-js@1.0.0` after API freeze + changelog.

**Done when**

- `docs/DESIGN.md` open questions are answered in writing.
- CHANGELOG has a 1.0 section.
- npm publish is a separate, explicit user request.

---

## Out of scope until someone asks

Locale-sensitive parsing, RRULE, non-Gregorian calendars, BigInt nanos, holiday plugins, date-picker helpers, full Moment plugin surface, embedded tzdata packages.

---

## If you are asked to “just finish Tempo”

That means: WP1 → WP2 → WP3 → WP4, then stop and report. Do not invent WP6 features unprompted.
