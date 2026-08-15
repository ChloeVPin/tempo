# Handoff — take over Tempo with no guesswork

**Audience:** a coding agent or human implementing the next phase.  
**Snapshot date:** 2026-08-15  
**Repo:** https://github.com/ChloeVPin/tempo  
**Branch:** `main`  
**HEAD at time of writing:** current API-freeze audit commit (trust `git log`)
**Package:** `@chloevpin/tempo@1.0.0` (published to npm)
**CI:** green through run #20 for the scoped release commit; verify the latest push for future changes

If HEAD has moved, trust `git log` and the tests over any SHA in this file. Trust this file over older prose in `docs/RESEARCH.md`.

---

## 1. Mission (one sentence)

Ship a Temporal-aligned, immutable, TypeScript-first date/time kernel that can replace Moment.js in new code, with an optional adapter for migration — not a faster Moment clone.

## 2. What “done” already means

Phase 1 hardening and the 1.0 API-freeze candidate are implemented and pushed. You can:

```ts
import { LocalDate, Instant, ZonedDateTime, Duration } from '@chloevpin/tempo';

LocalDate.parse('2026-06-01').plus({ days: 1 }).toISO(); // '2026-06-02'
LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO();   // '2026-02-28'
Instant.parse('2026-06-01T16:00:00Z')
  .toZonedDateTime('America/New_York')
  .toISO(); // '2026-06-01T12:00:00-04:00[America/New_York]'
```

Latest local verification:

- 23 test files passed, 1 Temporal differential file skipped; **155 passed / 6 skipped**
- `tsc --noEmit` clean
- ESLint clean
- Coverage **81.28–81.95% lines / ~73.2% functions / 82.69–83.05% branches** across local runs
- Main entry **9.85 kB gzip** (10 kB limit); format entry **1.55 kB gzip** (6 kB limit)
- Stryker on `src/core/civil.ts`: **~89–91% across local runs** (256–263 killed, 5–8 timeouts), zero meaningful survivors in the civil math core; see `docs/TESTING.md`

## 3. What you must not redo

The following already exist. Improve them; do not replace them from scratch.

| Area | Where | Notes |
|---|---|---|
| Civil calendar | `src/core/civil.ts` | Hinnant + `truncDiv`. Property-tested. |
| Core types | `src/core/*.ts` | Immutable classes, private constructors |
| ISO parse/format | methods on each type | There is **no** `src/iso/parse.ts` |
| Overflow | `src/core/overflow.ts` | `constrain` / `reject` |
| Instant | `src/core/instant.ts` | epoch millis |
| ZonedDateTime | `src/tz/zoned-datetime.ts` | Instant + zone is source of truth |
| Intl TZ provider | `src/tz/intl-provider.ts` | cached `formatToParts` |
| DST policy | `src/tz/disambiguate.ts` | Temporal-compatible |
| Token format | `src/format/{tokens,format}.ts` | Java/Temporal tokens |
| Locale format | `src/intl/` | cached `Intl.DateTimeFormat` |
| Relative time | `src/relative/` | `Intl.RelativeTimeFormat` |
| Moment adapter | `src/compat/moment.ts` | immutable subset |
| Temporal interop | `src/temporal/interop.ts` | feature-detected; fake-Temporal tested, polyfill differential runs in CI |
| Public CI | `.github/workflows/ci.yml` | public repo on purpose |

## 4. How the code is actually wired

### 4.1 Package shape

One npm package, subpath exports, ESM + CJS + d.ts via `tsup`.

```text
@chloevpin/tempo                 src/index.ts
@chloevpin/tempo/format          src/format/index.ts
@chloevpin/tempo/tz              src/tz/index.ts
@chloevpin/tempo/intl            src/intl/index.ts
@chloevpin/tempo/relative        src/relative/index.ts
@chloevpin/tempo/compat/moment   src/compat/moment/index.ts
@chloevpin/tempo/temporal        src/temporal/index.ts
```

`"sideEffects": false`. Zero runtime dependencies.

**Barrel (WP5, 2026-08-15):** `format`, `toLocaleString`, and `relativeTime` are **not** re-exported from `src/index.ts` — they live on `@chloevpin/tempo/format`, `@chloevpin/tempo/intl`, `@chloevpin/tempo/relative`. Main barrel is core + tz only (8.9 kB min+gzip). Do not add `compat` or `temporal` to the main barrel, and do not re-add format/intl/relative without a size review.

### 4.2 Factory registration (do not “clean this up” casually)

`Instant` and `LocalDateTime` must not import `ZonedDateTime` at runtime (cycle). They register converters:

- `registerZonedFactory` in `src/core/instant.ts`
- `registerLocalZonedFactory` in `src/core/local-datetime.ts`

`src/tz/zoned-datetime.ts` calls both at module load.

If you import `Instant` **without** ever loading `ZonedDateTime`, `instant.toZonedDateTime()` throws `UNKNOWN_TIMEZONE` / “module is not loaded”. The main barrel imports `ZonedDateTime`, so the public `@chloevpin/tempo` entry is fine.

Type-only `import type { ZonedDateTime }` in instant/local-datetime is intentional.

### 4.3 Clock

`src/clock.ts`:

```ts
useFixedClock(epochMs) // returns restore()
resetClock()
nowMs()
```

All `now()` / `today()` / `fromNow()` must go through this.

### 4.4 Timezone provider

Actual interface (`src/tz/types.ts`):

```ts
interface TimeZoneProvider {
  getOffsetMs(epochMs: number, zone: string): number;
  getPossibleInstants(local: LocalDateTime, zone: string): number[];
  guess(): string;
}
```

Older docs said `getPossibleOffsets`. That name is wrong. Code wins.

Fixed-offset ids (`UTC`, `GMT`, `+05:30`) are handled inside `intl-provider.ts` via `offsetMsFromId`. There is no `fixed-offset.ts`.

### 4.5 Parsing

Parsing is **per type**, mostly **anchored regex**, not a shared scanner. Docs that say “hand-written scanners only” are aspirational. Security rule that still holds: no unbounded / unanchored ReDoS-prone regex, no `eval`, no `Date.parse`.

| Type | Accepts |
|---|---|
| `LocalDate` | `YYYY-MM-DD`, `YYYY-Www-D` |
| `LocalTime` | `HH:mm[:ss[.SSS]]` |
| `LocalDateTime` | `YYYY-MM-DD[T ]HH:mm[:ss[.SSS]]` — **no offset** |
| `Instant` | ISO with `Z` or numeric offset, optional `[Zone]` (zone ignored) |
| `ZonedDateTime` | ISO with offset and/or `[Zone]` |
| `Duration` | ISO-8601 `P…T…` including leading `-` |

Trailing junk is invalid. Whitespace is not trimmed.

## 5. Semantics you must preserve

See `docs/INVARIANTS.md` for executable examples. Summary:

- `daysFromCivil(1970,1,1) === 0`
- Hinnant round-trip including year `0`, year `-1`, year `-400`
- `2026-01-31 + 1 month` → `2026-02-28` under `constrain`
- `2024-02-29 + 1 year` → `2025-02-28` under `constrain`
- ISO week: `2025-12-29` is ISO `2026-W01-1`
- NY spring-forward 2026-03-08T02:30 does not exist; `reject` throws; `earlier`/`later` are distinct instants; `compatible` === `later`
- NY fall-back 2026-11-01T01:30 occurs twice; earlier offset `-04:00`, later `-05:00`, 3600000 ms apart
- `Asia/Kolkata` +05:30, `Asia/Kathmandu` +05:45
- Instant parse requires an offset
- Moment adapter `add` does not mutate; `a.diff(b, 'day')` is `a - b` (Moment sign, not Temporal `until`)

## 6. Known limitations (not bugs unless tests say so)

Treat these as **documented incomplete work**, not surprises.

1. **`OffsetDateTime` is not a class.** Fixed offsets are intentionally `ZonedDateTime` views with id `+HH:mm` / `UTC` through 1.0.
2. **`Period` is not separate from `Duration`.** One `Duration` holds years/months/weeks/days/h/m/s/ms.
3. **Custom parsing is intentionally narrow.** `LocalDate.parse('01/02/2026', 'dd/MM/yyyy')` exists; locale-sensitive names, weekdays, times, offsets, and zones are deferred.
4. **`Interval` / `DateRange` are now implemented** as immutable half-open `[start, end)` ranges; see `src/core/interval.ts`.
5. **`LocalDateTime.until(..., 'day'|'week'|'month'|'year')` uses the date part only** and ignores time-of-day. Time units use naive UTC millis. This is a real semantic gap vs Temporal. Do not “fix” it silently — add tests and document if you change it.
6. **`ZonedDateTime.isDST()` is a heuristic** (compare offset to the min offset ±180 days). Not IANA-authoritative.
7. **`ZonedDateTime.startOf('day')` when midnight is in a gap** tries `later`. Thinly tested. High-risk.
8. **`fromInstant` rebuilds local fields via `new Date(instant + offset)` + `getUTC*`.**** Fine inside the ES Date range; that is the v1 range.
9. **Coverage thresholds** were raised to lines 74 / functions 62 / branches 72 in WP3; `src/temporal/**` and `src/core/compare.ts` are now tested and removed from the excludes. Remaining excludes: `src/**/index.ts`, `src/iso/format.ts`, `src/types.ts`, `src/tz/types.ts`.
10. **Temporal interop is tested locally** with a fake `globalThis.Temporal`; native Temporal is not assumed in CI.
11. **Moment adapter is a subset.** No `isValid() === false` objects, no global locale, no `moment.fn`, no `'01/02/26'` parse. `isValid()` always returns `true` because construction throws instead.
12. **Parser fuzz exists** (`tests/fuzz/parse.fuzz.test.ts`): 4 suites, TempoError-only crash guard plus a whole-property wall-clock DoS budget (the old per-input <50 ms bound flaked under GC).
13. **Phase 1 runtime jobs are present** for Playwright, Bun, and Deno; CI remains the authority for host-specific results.
14. **`scripts/` is empty.** Debug scripts are not part of the product.

## 7. Doc drift that already bit us

`docs/ARCHITECTURE.md` used to list files that were never created (`iso/parse.ts`, `iso/scan.ts`, `format/compiler.ts`, `tz/provider.ts`, `tz/fixed-offset.ts`) and the wrong provider method name. The architecture file has been corrected to match `src/`. **If you add those files later, update STATUS + ARCHITECTURE in the same commit.**

`docs/DESIGN.md` records fixed-offset `ZonedDateTime` as the 1.0 decision; a distinct `OffsetDateTime` remains deferred.

## 8. How to work

```sh
npm install
npm test              # vitest
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run size
npm run bench         # optional, not in CI
```

Commits: conventional, present tense (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).  
Push `main` (or a PR) to GitHub so public Actions runs.  
Update `docs/STATUS.md` and `docs/ROADMAP.md` when a phase item lands.

Do not commit `dist/` or `coverage/` (gitignored).

### Tests you must add when you touch an area

| You change… | Also add… |
|---|---|
| `civil.ts` | unit case + keep `tests/property/civil.property.test.ts` green |
| DST / `disambiguate.ts` / provider | golden or explicit NY + at least one southern-hemisphere zone |
| ISO parse | invalid + valid pair, and fuzz still bounded |
| Overflow | Jan 31 + 1 month, Feb 29 + 1 year, both policies |
| Moment adapter | Moment-sign `diff` and immutability |
| Public API | `docs/API.md` |

Oracles, in order: Temporal → IANA/Intl → CLDR/Intl → Luxon/date-fns → Moment **only** for compat.

## 9. What to do next

The hardening, API-freeze, and 1.0.0 publication work is complete. For ordinary maintenance, start with `git status`, run the verification commands, and preserve the exact export contract. Embedded tzdata remains a separate optional package decision.

## 10. Product / naming facts

- Product: **Tempo**
- GitHub repo: `ChloeVPin/tempo` (public, on purpose, for free CI)
- npm: **`@chloevpin/tempo`** — scoped to avoid npm's unscoped-name similarity restrictions
- License: MIT
- Author in package.json: Chloe Valesquez
- Node: `>=18`; CI matrix 20, 22, 24

## 11. Closed product questions

Already decided. See also `docs/ROADMAP.md` decision log.

- Clean break + optional adapter, not a Moment clone
- 1-based months
- Strict parse, throwing `parse` + `tryParse`
- `constrain` overflow, `compatible` DST
- Intl-first zones
- Millisecond instants
- Single package for v1

Still deferred (do not implement silently):

- Separate `Period` type: mixed `Duration` is frozen through 1.0.
- First-class `OffsetDateTime`: fixed-offset `ZonedDateTime` views are frozen through 1.0.
- Locale-sensitive parsing and expanded token grammar.
- Optional embedded tzdata fallback package.
