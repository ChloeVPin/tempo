# Changelog

## Unreleased

- **docs:** README first screen now states what Tempo is, shows one API example, and drops internal handoff/work-package links. The official Tempo mark is unchanged.
- **fix:** `Duration` sub-second normalization. Fractional hour/minute/day parsing (and direct `Duration.of` calls) used to store the fractional remainder as a raw millisecond count, which `toISO()`/`toJSON()` then serialized as a `.SSS` fraction — corrupting the value (e.g. `Duration.parse('PT0.5H').toISO()` returned `'PT0.18S'` instead of `'PT30M'`). The `milliseconds` field is now carried into seconds/minutes/hours at construction, so every duration serializes and round-trips exactly.
- **fix:** civil years `0–99` no longer drift to `1900–1999`. `format(zdt, 'EEEE')` computed the weekday via `Date.UTC(year, …)`, and `toLocaleString` routed civil dates through `Date.UTC` too, so `LocalDate.of(50, 1, 1)` formatted as year `1950`. Weekday formatting now uses the civil calendar (`daysFromCivil` + `isoDayOfWeek`), and locale formatting uses `setUTCFullYear` (via `utcMillis`).
- **fix:** the day-period token (`a`/`aa`/`aaa`) was hard-coded `AM`/`PM` and ignored the locale. It now formats through a cached `Intl.DateTimeFormat` day period, so `format(..., 'a', { locale: 'zh-CN' })` yields `上午`/`下午` rather than a constant.
- **fix:** fractional weeks no longer round to a whole number of days (which silently gained or lost hours). `Duration.parse('P0.5W')` is now `P3DT12H` instead of `P4D`; the sub-day remainder decomposes into days + time.
- **fix:** `Duration.tryParse` could throw a `TempoError` on numerically hostile inputs (e.g. a fraction with hundreds of digits overflowing `Number`) instead of returning `{ ok: false }`. Fraction parsing now rejects non-finite fractions, and the final field validation is surfaced as a `ParseResult` so `tryParse` never throws.
- **test:** parser fuzz no longer asserts a per-input `<50 ms` wall-clock bound, which flaked under GC/JIT pauses. It now checks a whole-property wall-clock budget (a robust DoS guard) plus the existing TempoError-only crash guard; Vitest's 5 s test timeout backstops true hangs.
- Agent takeover pack: `AGENTS.md`, `docs/HANDOFF.md`, `docs/STATUS.md`, `docs/INVARIANTS.md`, `docs/WORK-PACKAGES.md`. Architecture doc reconciled with `src/`.
- **WP1** timezone hardening: 26 DST transition goldens (US/EU/southern hemisphere, non-hour offsets), ICU-history-guarded `Pacific/Apia` / 2018 `America/Sao_Paulo`, 73,414-day civil walk 1900–2100, London gap/overlap cases.
- **WP2** parser + differential: 4-suite fuzz (TempoError-only, <50 ms/input), skip-safe differential suite vs pinned `@js-temporal/polyfill` (new `temporal-diff` CI job).
- **WP3** coverage: dead paths covered, `temporal/interop` tested via fake `Temporal`, thresholds raised to 74/62/72, `compare.ts` + `src/temporal/**` un-excluded.
- **WP4** runtime matrix: bun / deno / Playwright smoke jobs (`fail-fast: false`).
- **WP5** module graph: `format` / `toLocaleString` / `relativeTime` removed from the main barrel (use `@chloevpin/tempo/format`, `@chloevpin/tempo/intl`, `@chloevpin/tempo/relative`); main barrel 10.4 → 8.9 kB min+gzip; size-limit now gates gzip at 10 kB / 6 kB.
- Differential suites vs `luxon@3.7.2` (8 cases) and `date-fns@4.4.0` (7 cases) for non-ambiguous calendar, instant, weekday, and zoned cases.
- Mutation testing on `src/core/civil.ts` via Stryker (`npm run test:mutation`): **~89–91% across local runs** (256–263 kills, 5–8 timeouts), zero meaningful survivors in the civil math core; `dayOfYear`/`quarter`/ISO-week error contracts now asserted. Dev deps: `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `@stryker-mutator/typescript-checker` (all pinned 10.0.0).
- Moment compat differential suite: 6 deterministic cases against pinned `moment@2.30.1` and `moment-timezone@0.5.48`; intentionally excludes Moment-only permissive parsing and ambiguous DST behavior.
- Phase 2 `Interval<T>`: immutable half-open `[start, end)` intervals with containment, overlap, abutment, intersection, union, ordering validation, and a `DateRange.of(...)` LocalDate factory.
- Strict numeric custom-token parsing for `LocalDate.parse(input, pattern)`: `y`/`yyyy`/`uuuu`, `M`/`MM`, `d`/`dd`, and quoted literals; unsupported ambiguous or locale-sensitive tokens reject explicitly.
- Phase 2 decision: keep one mixed `Duration` through 1.0; defer a separate `Period` until usage or Temporal interop proves it necessary. Clock injection is documented as public API.
- Added a 20-call Moment migration cookbook covering typed replacements, DST/overflow hazards, strict parsing, and the compat exit path.
- Phase 2 decision: fixed offsets remain `ZonedDateTime` views through 1.0; no duplicate `OffsetDateTime` type without a demonstrated invariant.
- Added a same-process Tempo-vs-pinned-Moment benchmark baseline: Tempo measured 6.4–10.7× faster across representative core parse, day arithmetic, and formatting operations on Node 22.
- Added a public export contract test protecting the exact core+timezone main barrel and documented format/intl/relative/tz/compat/temporal subpath surfaces.
- Completed and published the 1.0 API-freeze release: singular unit names, immutable value types, strict parsing, overflow/DST policies, fixed-offset `ZonedDateTime` views, and the mixed `Duration` contract are documented and executable. Optional embedded tzdata remains a separate post-1.0 product decision.

## 1.0.0 — 2026-08-15

The API-freeze release is published as `@chloevpin/tempo@1.0.0`. The public package, export map, runtime matrix, differential suites, civil walk, and bundle-size budgets were verified before publication.

## 0.1.0 — 2026-08-14

First public kernel.

- Immutable Temporal-aligned types: `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Duration`
- Strict ISO 8601 / RFC 3339 parsing (`parse` / `tryParse`)
- Howard Hinnant civil calendar
- Overflow policies `constrain` | `reject`
- Intl-first IANA time zones with DST disambiguation
- Token formatter, locale formatting, relative time
- Optional Moment compatibility adapter
- Feature-detected Temporal interop
- Vitest unit, property, and golden tests
- GitHub Actions on Node 20/22/24
