# Implementation status

Last updated: 2026-08-15. Update a row when you land or delete the file.

Legend: **done** = implemented + at least one test · **partial** = exists, thin tests or known gaps · **missing** = not in tree · **n/a** = decided against for v1

## Source

| Path | Status | Tests | Notes |
|---|---|---|---|
| `src/errors.ts` | done | indirect | `TempoError` + `ParseResult` |
| `src/types.ts` | done | excluded from coverage | Shared unions |
| `src/clock.ts` | done | `tests/unit/intl.test.ts` | `useFixedClock` |
| `src/index.ts` | done | excluded | Main barrel; also exports format/intl/relative |
| `src/core/civil.ts` | done | `civil.test.ts`, property | **Must use `truncDiv`** |
| `src/core/range.ts` | done | via civil/instant | ES Date bounds |
| `src/core/overflow.ts` | partial | via LocalDate | `requireInteger` / `requireFinite` barely used |
| `src/core/compare.ts` | partial | excluded | `isBetween` on LocalDate is inlined, this helper is unused |
| `src/core/duration.ts` | done | `duration.test.ts` | ISO parse + `total()` |
| `src/core/local-date.ts` | done | `local-date.test.ts` | 1-based months |
| `src/core/local-time.ts` | done | `local-time.test.ts` | Wraps at midnight |
| `src/core/local-datetime.ts` | done | `local-datetime.test.ts` | `until` calendar units ignore time |
| `src/core/instant.ts` | done | `instant.test.ts` | Needs zone factory for `toZonedDateTime` |
| `src/tz/types.ts` | done | excluded | `getPossibleInstants`, not Offsets |
| `src/tz/offset.ts` | partial | via zoned/format | `parseOffset` lightly used |
| `src/tz/intl-provider.ts` | done | golden + zoned | Cached Intl |
| `src/tz/disambiguate.ts` | done | `zoned.test.ts` | 3–48h probe windows |
| `src/tz/zoned-datetime.ts` | done | `zoned.test.ts` | Registers factories at load |
| `src/tz/fixed-offset.ts` | n/a | — | Folded into offset + provider |
| `src/tz/provider.ts` | n/a | — | Interface lives in `types.ts` |
| `src/iso/format.ts` | partial | excluded | Thin `toISO()` wrapper |
| `src/iso/parse.ts` | missing | — | Parse lives on each type |
| `src/iso/scan.ts` | missing | — | Aspirational |
| `src/format/tokens.ts` | done | `format.test.ts` | |
| `src/format/format.ts` | done | `format.test.ts` | In-module token cache |
| `src/format/compiler.ts` | n/a | — | Not a separate file |
| `src/intl/*` | done | `intl.test.ts` | |
| `src/relative/relative-time.ts` | partial | `relative.test.ts` | One case |
| `src/compat/moment.ts` | partial | `compat-moment.test.ts` | Common subset only |
| `src/compat/format-map.ts` | done | via compat | Moment → Tempo tokens |
| `src/temporal/interop.ts` | partial | **none** | Feature-detected; excluded from coverage |

## Tests

| Path | Status | Role |
|---|---|---|
| `tests/unit/*.test.ts` | done | Contract examples |
| `tests/property/civil.property.test.ts` | done | Round-trip, inverse days, month bounds |
| `tests/golden/timezone.golden.test.ts` | partial | 8 zone/instant rows; needs more DST + history |
| `tests/fuzz/parse.fuzz.test.ts` | partial | 200 strings, 50 ms |
| `tests/bench/core.bench.ts` | done | Not in CI |
| `tests/differential/` | missing | Phase 1 |
| Playwright / Bun / Deno | missing | Phase 1 |

## Tooling

| Path | Status |
|---|---|
| `package.json` / lockfile | done |
| `tsconfig.json` (strict, NodeNext, verbatimModuleSyntax) | done |
| `tsup.config.ts` (multi-entry ESM+CJS+dts) | done |
| `vitest.config.ts` | done |
| `eslint.config.js` | done |
| `.github/workflows/ci.yml` | done |
| size-limit on `dist/index.js` and `dist/format/index.js` | done |
| npm publish | missing |

## Docs

| Path | Role |
|---|---|
| `AGENTS.md` | Agent entry |
| `docs/HANDOFF.md` | Takeover brief |
| `docs/STATUS.md` | This file |
| `docs/INVARIANTS.md` | Locked behaviors |
| `docs/WORK-PACKAGES.md` | Next jobs |
| `docs/DESIGN.md` | Why |
| `docs/ARCHITECTURE.md` | Where (must match `src/`) |
| `docs/ROADMAP.md` | Phases |
| `docs/API.md` | Public API sketch |
| `docs/MIGRATION.md` | Moment mapping |
| `docs/TESTING.md` | Test philosophy |
| `docs/RESEARCH.md` | Mid-2026 Moment landscape (background only) |
