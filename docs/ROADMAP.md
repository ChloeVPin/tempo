# Tempo Roadmap

This document is the living plan for Tempo. It records what ships in each phase, what is deferred, and why. Update it whenever a milestone lands or a decision changes.

Last updated: 2026-08-15 (release-polish audit)

Agents: do not plan from this file alone. Use [`HANDOFF.md`](HANDOFF.md) + [`WORK-PACKAGES.md`](WORK-PACKAGES.md).

## North star

Tempo is a TypeScript-first, immutable, Temporal-aligned date/time kernel. It is not “Moment but faster.” It replaces Moment’s *role* with safer types, strict parsing, tree-shakable modules, and optional migration adapters.

## Versioning policy

- `0.x` — public API may change as we lock semantics against Temporal, IANA, and Intl.
- `1.0` — API freeze for the core types listed below. Compat adapters may still evolve.
- Semver after 1.0. Breaking type or overflow/disambiguation changes are major.

## Phase 0 — Foundation (landed 2026-08-15)

Goal: a real repository, documented design, and a testable kernel.

- [x] Public GitHub repository with CI
- [x] Design, architecture, research, and migration docs
- [x] TypeScript package scaffold (ESM + CJS + d.ts)
- [x] Civil calendar algorithms (Howard Hinnant)
- [x] `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant`, `Duration`
- [x] Strict ISO 8601 / RFC 3339 parse and format
- [x] Arithmetic (`plus` / `minus` / `with` / `startOf` / `endOf` / `until`)
- [x] Comparison helpers
- [x] Overflow policies: `constrain` | `reject`
- [x] Token formatter (Temporal/Java-style tokens)
- [x] `ZonedDateTime` with Intl-first timezone provider
- [x] DST disambiguation: `compatible` | `earlier` | `later` | `reject`
- [x] Intl locale formatting with formatter cache
- [x] Relative time (`fromNow`-class helpers)
- [x] Optional Moment compatibility adapter (common subset)
- [x] Temporal interop (feature-detected)
- [x] Unit, property, and golden tests
- [x] Bundle size budgets in CI

## Phase 1 — Hardening toward 0.2 (complete)

Sequenced as WP1–WP5 in [`WORK-PACKAGES.md`](WORK-PACKAGES.md).

Goal: correctness under adversarial inputs and timezone chaos.

- [x] Golden DST tables for a curated IANA zone set (US, EU, southern hemisphere, non-hour offsets, historical)
- [x] Exhaustive civil-day walk for 1900–2100
- [x] Parser fuzzing with bounded-time assertions
- [x] Differential tests vs Temporal polyfill (where available)
- [x] Differential tests vs Luxon / date-fns for non-ambiguous cases
- [x] Optional pinned Moment tests for the compat adapter only (`moment@2.30.1`, `moment-timezone@0.5.48`)
- [x] Mutation testing on `src/core/civil.ts` — **~89–91% across local runs** (256–263 killed, 5–8 timeouts), zero meaningful survivors in the civil math core; see `docs/TESTING.md`
- [x] Browser smoke tests (Playwright)
- [x] Bun and Deno smoke jobs
- [x] Published size dashboard (core / format / tz / compat) — see size table below

## Phase 2 — 1.0 candidate (current)

Goal: production-ready kernel with a locked contract.

- [x] API freeze and changelog audit (exact export contract, documented units, and 1.0 readiness notes)
- [x] Generic immutable `Interval` with half-open `[start, end)` semantics; `DateRange.of(...)` convenience factory
- [x] Keep mixed `Duration` through 1.0; no `Period` split unless Temporal interop or usage demonstrates the need
- [x] Strict numeric custom token parser (`LocalDate.parse(input, 'dd/MM/yyyy')`); locale/month-name parsing remains deferred
- [ ] Optional embedded tzdata fallback package for incomplete Intl hosts *(deferred to a separate optional package; not part of the default v1 contract)*
- [x] Clock injection documented as public API
- [x] Migration cookbook covering the 20 most common Moment calls
- [ ] npm publish of `@chloevpin/tempo@1.0.0`

## Phase 3 — After 1.0 (not blocking)

These stay out of the default bundle.

- Locale-sensitive parsing
- Full Moment plugin surface
- Recurrence rules (iCal RRULE)
- Non-Gregorian calendars
- Nanosecond / BigInt precision module
- Holiday / weekend plugins
- Date-picker helpers
- Embedded historical tzdata slices (`@chloevpin/tempo-tz-data-2020-2030`, full)
- Custom calendar plugins

## Non-goals (explicit)

- Mutating APIs
- Global locale state
- Implicit `Date.parse` fallback
- Zero-based months in the public civil API
- Shipping full IANA tzdata in the default bundle
- Being a pixel-perfect Moment clone
- Requiring native Temporal in v1

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-14 | Library name: **Tempo**. npm name: **`@chloevpin/tempo`**. | The owner scope avoids npm's unscoped-name similarity restrictions. Repo stays `tempo`. |
| 2026-08-14 | Single package with subpath exports, not a monorepo. | Faster to ship v1; still tree-shakable. Split later if needed. |
| 2026-08-14 | Months are 1–12. | Matches Temporal / ISO / human expectation. JS Date interop is explicit. |
| 2026-08-14 | Default overflow is `constrain`. | Matches Temporal. `reject` is opt-in. |
| 2026-08-14 | Default DST policy is `compatible`. | Matches Temporal. Never silent-invalid. |
| 2026-08-14 | Instants are integer epoch milliseconds. | Broad runtime support. BigInt nanos later, optional. |
| 2026-08-14 | Intl is the primary timezone engine. | Host tzdata stays current; no huge default bundle. |
| 2026-08-14 | Moment compat is a module, not the core API. | Avoids freezing bad patterns into Tempo. |
| 2026-08-14 | Token style is `yyyy-MM-dd`, not Moment `YYYY-MM-DD`. | Avoids week-year footgun. Compat layer maps Moment tokens. |
| 2026-08-15 | `format` / `toLocaleString` / `relativeTime` leave the main barrel (WP5). | Main barrel is core + tz only: 10.4 → 8.9 kB min+gzip (7.8 kB brotli). Unpublished 0.x; subpath entries already exist. |
| 2026-08-15 | Keep one mixed `Duration` through 1.0; do not add `Period` yet. | Existing calendar/time fields already match the current Temporal interop shape; a split would add API and migration cost without a demonstrated need. |
| 2026-08-15 | Keep fixed offsets as `ZonedDateTime`; do not add `OffsetDateTime` before 1.0. | Fixed-offset IDs already preserve the instant + offset view without a second type; add a distinct type only if real usage requires different invariants. |
| 2026-08-15 | Add a non-CI Tempo-vs-Moment benchmark baseline. | Same-process Node 22 measurements show Tempo 6.4–10.7× faster on representative core parse/arithmetic/format operations; benchmark is for regression evidence, not a universal claim. |

| 2026-08-15 | Freeze the 1.0 candidate export and unit contract without publishing. | Exact runtime exports are tested; npm publication and optional tzdata remain separate release decisions. |

## Size dashboard (WP5, 2026-08-15)

Min+gzip of the built entries (measured via esbuild transform + zlib):

| Entry | gzip |
|---|---:|
| `@chloevpin/tempo` (core + tz) | 8.9 kB |
| `@chloevpin/tempo/format` | 1.6 kB |
| `@chloevpin/tempo/tz` (core + tz) | 8.8 kB |
| `@chloevpin/tempo/intl` | 0.4 kB |
| `@chloevpin/tempo/relative` | 3.7 kB |
| `@chloevpin/tempo/compat/moment` | 11.0 kB |
| `@chloevpin/tempo/temporal` | 9.0 kB |
| core only (no tz/format/intl/relative) | 7.1 kB |

size-limit gates `dist/index.js` at 10 kB and `dist/format/index.js` at 6 kB, reporting gzip in CI.

## Open questions (resolved unless reopened)

None blocking the 1.0 candidate. Deferred product and release questions are recorded in `docs/DESIGN.md` and `docs/WORK-PACKAGES.md`.
