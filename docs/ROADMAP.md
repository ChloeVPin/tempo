# Tempo Roadmap

This document is the living plan for Tempo. It records what ships in each phase, what is deferred, and why. Update it whenever a milestone lands or a decision changes.

Last updated: 2026-08-15

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

## Phase 1 — Hardening toward 0.2 (current)

Sequenced as WP1–WP5 in [`WORK-PACKAGES.md`](WORK-PACKAGES.md).

Goal: correctness under adversarial inputs and timezone chaos.

- [x] Golden DST tables for a curated IANA zone set (US, EU, southern hemisphere, non-hour offsets, historical)
- [x] Exhaustive civil-day walk for 1900–2100
- [x] Parser fuzzing with bounded-time assertions
- [x] Differential tests vs Temporal polyfill (where available)
- [x] Differential tests vs Luxon / date-fns for non-ambiguous cases
- [x] Optional pinned Moment tests for the compat adapter only (`moment@2.30.1`, `moment-timezone@0.5.48`)
- [x] Mutation testing on `src/core/civil.ts` — **89.5% score** (258 killed), zero survivors in the civil math core; see `docs/TESTING.md`
- [x] Browser smoke tests (Playwright)
- [x] Bun and Deno smoke jobs
- [x] Published size dashboard (core / format / tz / compat) — see size table below

## Phase 2 — 1.0 candidate

Goal: production-ready kernel with a locked contract.

- [ ] API freeze and changelog
- [ ] `Interval` / `DateRange`
- [ ] Explicit `Period` (calendar) vs `Duration` (time) split if needed after usage
- [ ] Custom token parser (`LocalDate.parse(input, 'dd/MM/yyyy')`)
- [ ] Optional embedded tzdata fallback package for incomplete Intl hosts
- [ ] Clock injection documented as public API
- [ ] Migration cookbook covering the 20 most common Moment calls
- [ ] npm publish of `tempo-js@1.0.0`

## Phase 3 — After 1.0 (not blocking)

These stay out of the default bundle.

- Locale-sensitive parsing
- Full Moment plugin surface
- Recurrence rules (iCal RRULE)
- Non-Gregorian calendars
- Nanosecond / BigInt precision module
- Holiday / weekend plugins
- Date-picker helpers
- Embedded historical tzdata slices (`@tempojs/tz-data-2020-2030`, full)
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
| 2026-08-14 | Library name: **Tempo**. npm name: **`tempo-js`**. | `tempo` is taken on npm. Repo stays `tempo`. |
| 2026-08-14 | Single package with subpath exports, not a monorepo. | Faster to ship v1; still tree-shakable. Split later if needed. |
| 2026-08-14 | Months are 1–12. | Matches Temporal / ISO / human expectation. JS Date interop is explicit. |
| 2026-08-14 | Default overflow is `constrain`. | Matches Temporal. `reject` is opt-in. |
| 2026-08-14 | Default DST policy is `compatible`. | Matches Temporal. Never silent-invalid. |
| 2026-08-14 | Instants are integer epoch milliseconds. | Broad runtime support. BigInt nanos later, optional. |
| 2026-08-14 | Intl is the primary timezone engine. | Host tzdata stays current; no huge default bundle. |
| 2026-08-14 | Moment compat is a module, not the core API. | Avoids freezing bad patterns into Tempo. |
| 2026-08-14 | Token style is `yyyy-MM-dd`, not Moment `YYYY-MM-DD`. | Avoids week-year footgun. Compat layer maps Moment tokens. |
| 2026-08-15 | `format` / `toLocaleString` / `relativeTime` leave the main barrel (WP5). | Main barrel is core + tz only: 10.4 → 8.9 kB min+gzip (7.8 kB brotli). Unpublished 0.x; subpath entries already exist. |

## Size dashboard (WP5, 2026-08-15)

Min+gzip of the built entries (measured via esbuild transform + zlib):

| Entry | gzip |
|---|---:|
| `tempo-js` (core + tz) | 8.9 kB |
| `tempo-js/format` | 1.6 kB |
| `tempo-js/tz` (core + tz) | 8.8 kB |
| `tempo-js/intl` | 0.4 kB |
| `tempo-js/relative` | 3.7 kB |
| `tempo-js/compat/moment` | 11.0 kB |
| `tempo-js/temporal` | 9.0 kB |
| core only (no tz/format/intl/relative) | 7.1 kB |

size-limit gates `dist/index.js` at 10 kB and `dist/format/index.js` at 6 kB, reporting gzip in CI.

## Open questions (resolved unless reopened)

None blocking Phase 0. See `docs/DESIGN.md` for deferred product questions.
