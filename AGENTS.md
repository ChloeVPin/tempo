# Agent instructions for Tempo

You are taking over an existing date/time library. Do not redesign it. Do not clone Moment. Read this file first, then the handoff pack, then the code.

## Read this order, in this order

1. This file (`AGENTS.md`)
2. [`docs/HANDOFF.md`](docs/HANDOFF.md) — current truth, gaps, how to work
3. [`docs/STATUS.md`](docs/STATUS.md) — file-by-file what exists
4. [`docs/INVARIANTS.md`](docs/INVARIANTS.md) — behaviors you must not break
5. [`docs/WORK-PACKAGES.md`](docs/WORK-PACKAGES.md) — the next jobs, already sequenced
6. [`docs/DESIGN.md`](docs/DESIGN.md) — *why*, only after the above
7. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layout (must match the code; if it disagrees with `src/`, the code wins and you update the doc)

Do **not** start from the original Moment research dump as an implementation spec. That research is background. The contract is the docs above plus the tests.

## What this project is

**Tempo** is a TypeScript-first, immutable, Temporal-aligned date/time kernel. Product name: Tempo. npm name: `tempo-js`. GitHub: https://github.com/ChloeVPin/tempo (public).

It replaces Moment’s *role*, not Moment’s API.

## Non-negotiable rules

These are closed. Do not re-open them unless the user explicitly asks.

1. Immutable public types. `plus` / `minus` / `with` return new values.
2. Separate types: `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Duration`.
3. Months are **1–12** in the public civil API.
4. Parse is **strict ISO** by default. No `Date.parse` fallback. No invalid-date objects.
5. Overflow default is `constrain`. `reject` is opt-in. `LocalDate.of` / `parse` default to `reject`.
6. DST default is Temporal `compatible` (gap → later instant, overlap → earlier instant).
7. Instants are integer epoch milliseconds. No BigInt nanos in v1.
8. Intl is the timezone engine. Do not bundle IANA tzdata in the default package.
9. Moment compatibility lives in `tempo-js/compat/moment` only. Core stays Temporal-shaped.
10. Format tokens in core are Java/Temporal (`yyyy-MM-dd`), not Moment (`YYYY-MM-DD`).
11. Zero runtime dependencies in published core.
12. `src/core/civil.ts` is the only leap-year / epoch-day implementation. Use `truncDiv` (toward-zero), never `Math.floor`, for Hinnant era math.
13. `now` / `today` go through `src/clock.ts`. Tests use `useFixedClock`. Never sleep.
14. Conventional commits. Push to the public repo so CI runs.

## How to verify before you claim anything works

```sh
npm test
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run size
npm run test:mutation  # Stryker on src/core/civil.ts; 89.5% score, see docs/TESTING.md
```

CI: `.github/workflows/ci.yml` on Node 20/22/24. Public repo = unlimited Actions minutes.

If you change civil math, DST, ISO parse, or overflow, add a test in the **same commit**.

## Do not

- Mutate instances.
- Add global locale state.
- Make core accept `'01/02/2026'` without an explicit format (that parser does not exist yet).
- Treat Moment as a correctness oracle for core types. Moment is only an oracle for the compat adapter.
- Import `src/compat` or `src/temporal` from `src/index.ts`.
- Invent a second `isLeapYear`.
- Use `Math.floor` for Hinnant `era` division. Year 0 / negative years will silently break. See `docs/INVARIANTS.md`.
- Commit `dist/`, `coverage/`, or `node_modules/`.

## Current phase

Phase 0 kernel is on `main` (`tempo-js@0.1.0`). API is not frozen. Next work is Phase 1 hardening, then 1.0. Start at the top of `docs/WORK-PACKAGES.md`.
