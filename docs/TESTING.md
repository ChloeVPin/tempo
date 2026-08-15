# Testing Strategy

Tempo is tested as if it were a standards implementation, not a utility bag.

Locked examples live in [`INVARIANTS.md`](INVARIANTS.md). The hardening and API-freeze test work is complete; maintain the contract in [`WORK-PACKAGES.md`](WORK-PACKAGES.md).

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
| Bench | `tests/bench` | Performance regressions and same-process Tempo/Moment comparisons |
| Size | `size-limit` in CI | Bundle budgets |
| Public API | `tests/unit/public-api.test.ts` | Exact main-barrel and subpath export surfaces |

## Required properties

- `parse(toISO(x)) === x` for every core type in the supported range
- `x.plus(d).minus(d) === x` for time-unit durations
- `date.plus({ days: n }).until(date, 'day')` relates correctly for integer `n`
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

## Performance evidence

Run `npm run bench` for reproducible local microbenchmarks. The pinned Moment
comparison (`tests/bench/moment.bench.ts`) is deliberately same-process and
non-CI: it measures representative, non-zoned operations using
`moment@2.30.1`, not every workload or every runtime. On Node 22 during the
2026-08-15 run, Tempo measured 9.6× faster for LocalDate parsing, 6.4× for
calendar-day addition, 10.7× for Instant parsing, and 7.3× for date formatting.
Treat these as a baseline for regression detection, not a universal marketing
claim.

## Mutation testing

`npm run test:mutation` runs Stryker (`stryker.config.json`) against `src/core/civil.ts`
only, using a scoped vitest config (`vitest.mutation.config.ts`) with the civil,
walk, property, and local-date suites. Result (2026-08): **90.2% mutation
score** — 258 killed, 9 timeouts — with **zero survivors in the math core**
(`isLeapYear`, `daysInMonth`, `daysFromCivil`, `civilFromDays`, `isoDayOfWeek`,
`dayOfYear`, `quarterOf`, `isoWeekFields`, `dateFromIsoWeek` computation). The
walk + property tests are therefore real, not tautological.

Survivor classification from the latest run (28 testable survivors, plus 1 no-coverage):

- **8 redundant validation survivors** — `isValidDate` integer/month checks are
  already implied by fractional epoch-day rejection and `DAYS_IN_MONTH[m] ?? 0`.
- **8 attribution survivors** — the `requireValidDate` integer-error block
  (lines 95–97) has a direct test asserting code, message, and input, but the
  Vitest runner's per-test coverage attribution excludes that test from these
  mutants. Hand-applying the `if (false)` mutant makes the civil suite fail.
- **4 constrain boundary survivors** — changing `<`/`>` to inclusive comparisons
  is a no-op when the value is already at the clamp boundary.
- **3 ISO-week existence survivors** — the alternate checks are equivalent for
  the constructed candidate.
- **5 formatter/domain survivors** — pad and year-format branches are unreachable
  or equivalent for their supported input domains.
- **1 no-coverage** — the `'-'` literal in `pad2`, reachable only for negative
  input, which callers never produce.

30 type-invalid mutants are `CompileError` and excluded from the score by
Stryker. To see the per-mutant report: `npx stryker run --reporters json` →
`reports/mutation/mutation.json`.
