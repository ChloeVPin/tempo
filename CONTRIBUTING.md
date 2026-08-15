# Contributing

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

Update the relevant file under `docs/` when behavior or plans change. The roadmap is the source of truth for what is deferred.
