# Testing Strategy

Tempo is tested as if it were a standards implementation, not a utility bag.

## Oracles (in order)

1. Temporal semantics (native or a pinned polyfill)
2. IANA / host `Intl` timezone data
3. CLDR / `Intl` for locale output
4. Luxon and date-fns for non-ambiguous secondary checks
5. Moment.js **only** for `tempo-js/compat/moment`

Moment is not a correctness oracle for core types.

## Layers

| Layer | Location | Purpose |
|---|---|---|
| Unit | `tests/unit` | Exact examples, error codes, API contracts |
| Property | `tests/property` | Invariants via fast-check |
| Golden | `tests/golden` | Timezone offset tables, format snapshots |
| Fuzz | `tests/fuzz` | Parser / formatter crash resistance |
| Differential | `tests/differential` | Compare with Temporal / Luxon / date-fns |
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
- Later: Bun, Deno, Playwright browsers

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
