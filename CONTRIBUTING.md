# Contributing

Agents taking over the repo: start at [`AGENTS.md`](AGENTS.md), then [`docs/HANDOFF.md`](docs/HANDOFF.md). Do not treat [`docs/RESEARCH.md`](docs/RESEARCH.md) as an implementation spec.

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Use a fixed clock in tests (`useFixedClock`) instead of sleeping or calling `Date.now` directly.

## Civil math

If you touch `src/core/civil.ts`, add a unit test and keep the property tests green. Do not introduce a second leap-year implementation.

## Timezones

Host `Intl` is the timezone engine. Golden tests in `tests/golden` may differ across ICU versions; ISO strings must not.

Document DST policy changes in `docs/DESIGN.md` and `docs/ROADMAP.md` in the same PR.

## Commits

Conventional, present-tense messages:

- `feat: ...`
- `fix: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

## Docs

When behavior or plans change, update in the **same commit**:

1. `docs/INVARIANTS.md` if a guaranteed example changed
2. `docs/STATUS.md` if a file appeared, disappeared, or changed completeness
3. `docs/ROADMAP.md` / `docs/WORK-PACKAGES.md` if a phase item landed
4. `docs/API.md` if a public method changed
5. `docs/ARCHITECTURE.md` if the tree or data flow changed

`src/` + tests + invariants beat narrative docs. If they disagree, fix the narrative.
