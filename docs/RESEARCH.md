# Research notes (mid-2026)

**Not an implementation spec.** Background only. For takeover, use `AGENTS.md` and `docs/HANDOFF.md`.

Condensed from the Moment-replacement research that started this project. Live registry numbers change; verify before citing.

## Moment status

Moment is a legacy project in maintenance mode. The 2.x line is frozen by compatibility. Expect only critical fixes and timezone-data updates in `moment-timezone`.

Verify:

```sh
npm view moment version
npm view moment-timezone version
curl -s https://api.npmjs.org/downloads/point/last-week/moment
```

Downloads stay high because of inertia, tutorials, and transitive dependencies. That is not an architectural endorsement.

## Structural problems we refuse to inherit

1. Mutability
2. Monolithic bundle / locale side effects
3. Permissive parsing and `Date.parse` fallback
4. Overloaded getter/setters
5. Zero-based months and `date()` / `day()` naming
6. Global locale
7. No instant / local / zoned split
8. Large tzdata in the default path
9. Invalid objects that fail later

## Landscape

| Library | Takeaway for Tempo |
|---|---|
| Day.js | Small + familiar, still one datetime object |
| date-fns | Best tree-shaking, still `Date`-centric |
| Luxon | Closest rich immutable model; we align further with Temporal |
| Temporal | Long-term standard. Align semantics. Do not require native support in v1 |
| js-joda | Sound model, heavier, less JS-native |

## Security

Moment has had ReDoS and locale-loading issues. Tempo parsers are bounded scanners. No `eval`, no filesystem locale loading, no unbounded regex.

## Why a new library

None of the existing options is simultaneously: Temporal-aligned, type-separated, tiny by default, Intl-first for zones, TypeScript-first, and equipped with an explicit Moment off-ramp.

Tempo’s job is that combination.

## Verification commands (re-run anytime)

```sh
npm view moment version time
npm view dayjs version
npm view date-fns version
npm view luxon version
curl -s https://api.npmjs.org/downloads/point/last-week/moment
curl -s https://api.npmjs.org/downloads/point/last-week/dayjs
curl -s https://api.npmjs.org/downloads/point/last-week/date-fns
curl -s https://api.npmjs.org/downloads/point/last-week/luxon
```
