# Changelog

## Unreleased

- Agent takeover pack: `AGENTS.md`, `docs/HANDOFF.md`, `docs/STATUS.md`, `docs/INVARIANTS.md`, `docs/WORK-PACKAGES.md`. Architecture doc reconciled with `src/`.
- **WP1** timezone hardening: 26 DST transition goldens (US/EU/southern hemisphere, non-hour offsets), ICU-history-guarded `Pacific/Apia` / 2018 `America/Sao_Paulo`, 73,414-day civil walk 1900–2100, London gap/overlap cases.
- **WP2** parser + differential: 4-suite fuzz (TempoError-only, <50 ms/input), skip-safe differential suite vs pinned `@js-temporal/polyfill` (new `temporal-diff` CI job).
- **WP3** coverage: dead paths covered, `temporal/interop` tested via fake `Temporal`, thresholds raised to 74/62/72, `compare.ts` + `src/temporal/**` un-excluded.
- **WP4** runtime matrix: bun / deno / Playwright smoke jobs (`fail-fast: false`).
- **WP5** module graph: `format` / `toLocaleString` / `relativeTime` removed from the main barrel (use `tempo-js/format`, `tempo-js/intl`, `tempo-js/relative`); main barrel 10.4 → 8.9 kB min+gzip; size-limit now gates gzip at 10 kB / 6 kB.
- Differential suites vs `luxon@3.7.2` (8 cases) and `date-fns@4.4.0` (7 cases) for non-ambiguous calendar, instant, weekday, and zoned cases.
- Mutation testing on `src/core/civil.ts` via Stryker (`npm run test:mutation`): **89.5% score**, zero survivors in the civil math core; `dayOfYear`/`quarter`/ISO-week error contracts now asserted. Dev deps: `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `@stryker-mutator/typescript-checker` (all pinned 10.0.0).
- Moment compat differential suite: 6 deterministic cases against pinned `moment@2.30.1` and `moment-timezone@0.5.48`; intentionally excludes Moment-only permissive parsing and ambiguous DST behavior.
- Phase 2 `Interval<T>`: immutable half-open `[start, end)` intervals with containment, overlap, abutment, intersection, union, ordering validation, and a `DateRange.of(...)` LocalDate factory.
- Strict numeric custom-token parsing for `LocalDate.parse(input, pattern)`: `y`/`yyyy`/`uuuu`, `M`/`MM`, `d`/`dd`, and quoted literals; unsupported ambiguous or locale-sensitive tokens reject explicitly.

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
