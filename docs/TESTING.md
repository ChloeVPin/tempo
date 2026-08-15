# Testing Strategy

Tempo is tested as if it were a standards implementation, not a utility bag.

Locked examples live in [`INVARIANTS.md`](INVARIANTS.md). Next test work is [`WORK-PACKAGES.md`](WORK-PACKAGES.md) WP1–WP3.

## Oracles (in order)

1. Temporal semantics (native or a pinned polyfill)
2. IANA / host `Intl` timezone data
3. CLDR / `Intl` for locale output
4. Luxon and date-fns for non-ambiguous secondary checks
5. Moment.js **only** for `tempo-js/compat/moment`

Moment is not a correctness oracle for core types. The pinned compat oracle is `moment@2.30.1`; IANA-zone cases use `moment-timezone@0.5.48`.

## Layers

| Layer | Location | Purpose |
|---|---|---|
| Unit | `tests/unit` | Exact examples, error codes, API contracts |
| Property | `tests/property` | Invariants via fast-check |
| Golden | `tests/golden` | Timezone offset tables, format snapshots |
| Fuzz | `tests/fuzz` | Parser / formatter crash resistance |
| Differential | `tests/differential` | Compare with Temporal / Luxon / date-fns; Moment only for compat |
| Bench | `tests/bench` | Performance regressions |
| Size | `size-limit` in CI | Bundle budgets |

## Required properties

- `parse(toISO(x)) === x` for every core type in the supported range
- `x.plus(d).minus(d) === x` for time-unit durations
- `date.plus({ days: n }).until(date, 'days')` related correctly for integer `n`
- After month arithmetic, `day <= daysInMonth(year, month)`
- Comparison is a total order per type
- Instant identity is preserved by `instant → zoned → instant`
- ISO week date round-trips

Calendar-unit plus/minus is **not** a group. Document that in any test that looks like an inverse.

## Golden files

Timezone and locale goldens include runtime metadata:

```json
{
  "node": "24.x",
  "icu": "...",
  "tz": "2026a"
}
```

Do not assume bit-identical `Intl` output across operating systems. ISO output must be bit-identical.

## CI matrix

- Node current LTS and current
- Typecheck, unit, property
- Size budgets
- Bun, Deno, Playwright browsers
- Differential vs pinned `@js-temporal/polyfill`

Public GitHub Actions is the default CI so the matrix can grow without a minutes cap on a private repo.

## Coverage goals

| Area | Target |
|---|---:|
| `src/core/civil.ts` | 100% line/branch |
| Parsers | ≥ 95% |
| Formatter | ≥ 95% |
| Timezone provider + disambiguation | high branch + goldens |
| Compat adapter | high coverage of the supported subset |
| Overall | ≥ 95% lines |

Coverage is necessary and not sufficient.

## Mutation testing

`npm run test:mutation` runs Stryker (`stryker.config.json`) against `src/core/civil.ts`
only, using a scoped vitest config (`vitest.mutation.config.ts`) with the civil,
walk, property, and local-date suites. Result (2026-08): **89.5% mutation
score** — 258 killed, 7 timeout — with **zero survivors in the math core**
(`isLeapYear`, `daysInMonth`, `daysFromCivil`, `civilFromDays`, `isoDayOfWeek`,
`dayOfYear`, `quarterOf`, `isoWeekFields`, `dateFromIsoWeek` computation). The
walk + property tests are therefore real, not tautological.

Survivor classification (30 total, all non-math):

- **22 provably equivalent** — Hinnant era `>=` vs `>` at 0 (toward-zero division
  makes them identical); `isValidDate` integer/month checks (redundant:
  fractional inputs yield fractional epoch days rejected by `isEpochDayInRange`,
  fractional months hit `DAYS_IN_MONTH[m] ?? 0`); `constrainDate` clamp boundary
  no-ops; `dateFromIsoWeek` existence check where both fields always mismatch
  together; `pad2`/`pad4` branches unreachable for their input domains.
- **8 false survivors** — the `requireValidDate` integer-error block (lines
  96–98). The killing test exists and asserts code + message + input (dry run:
  45 mutants killed), but Stryker's vitest runner excludes it from these
  mutants' per-test subsets via its coverage-attribution quirk. Verified by
  hand: applying the `if (false)` mutant makes the suite fail (error code
  changes `INVALID_DATE` → `OUT_OF_RANGE`).
- **1 no-coverage** — the `'-'` literal in `pad2`, reachable only for negative
  input, which the function's callers never produce.

30 type-invalid mutants are `CompileError` and excluded from the score by
Stryker. To see the per-mutant report: `npx stryker run --reporters json` →
`reports/mutation/mutation.json`.
