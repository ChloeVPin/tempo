# Tempo Architecture

How the library is put together. Read `docs/DESIGN.md` for *why* and `docs/HANDOFF.md` for *what is true right now*.

If this file disagrees with `src/`, **the code wins**. Fix this file in the same commit.

Last reconciled with `src/`: 2026-08-15.

## Layout (as implemented)

```text
src/
  index.ts                 public barrel (core + format + intl + relative)
  errors.ts                TempoError + ParseResult
  types.ts                 units, overflow, disambiguation
  clock.ts                 injectable now()
  core/
    civil.ts               Hinnant days ↔ civil, leap years, ISO weeks
    range.ts               epoch day / millis bounds
    overflow.ts            constrain / reject
    compare.ts             generic compare helpers (thinly used)
    instant.ts             Instant + parseInstantFields + zone factory hook
    local-date.ts
    local-time.ts
    local-datetime.ts      + local→zoned factory hook
    duration.ts
  iso/
    format.ts              thin toISO() helper (parse lives on each type)
  format/
    tokens.ts              tokenize patterns
    format.ts              compiled-token cache + render
    index.ts
  tz/
    types.ts               TimeZoneProvider
    offset.ts              ±HH:mm
    intl-provider.ts       Intl.DateTimeFormat offset engine
    disambiguate.ts        gap / overlap policy
    zoned-datetime.ts      ZonedDateTime + factory registration
    index.ts
  intl/
    formatter-cache.ts
    locale-format.ts
    index.ts
  relative/
    relative-time.ts
    index.ts
  compat/
    moment.ts
    format-map.ts
    moment/index.ts
  temporal/
    interop.ts
    index.ts
```

Not in the tree (do not look for them): `iso/parse.ts`, `iso/scan.ts`, `format/compiler.ts`, `tz/provider.ts`, `tz/fixed-offset.ts`.

## Data flow

```text
string  --strict ISO on the type-->  value  --toISO/format-->  string
                                       |
                          plus / with / startOf
                                       v
                                 new value

LocalDateTime + zone + policy --> ZonedDateTime (instant + zone)
Instant + zone                  --> ZonedDateTime
ZonedDateTime                   --> Instant
ZonedDateTime                   --> LocalDateTime (derived fields)
```

## Civil math

`civil.ts` is the only place that converts `(y, m, d)` ↔ epoch days.

- `daysFromCivil` / `civilFromDays`
- `isLeapYear` / `daysInMonth` / `daysInYear`
- ISO week fields
- `constrainDate` / `requireValidDate`

Use `truncDiv` (`Math.trunc`) for Hinnant integer division. `Math.floor` is wrong for year ≤ 0.

Do not invent a second leap-year function.

## Parsing

Each type owns `parse` / `tryParse`. Patterns are anchored. No `Date.parse`. Entire string must match. No trim.

## Timezone provider

```ts
interface TimeZoneProvider {
  getOffsetMs(epochMs: number, zone: string): number;
  getPossibleInstants(local: LocalDateTime, zone: string): number[];
  guess(): string;
}
```

Default: `intlTimeZoneProvider`. Cached `Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', …, era: 'short' })`. Offset = reconstructed local-as-UTC minus the instant.

Fixed-offset ids (`UTC`, `GMT`, `+05:30`) short-circuit in the same provider via `offsetMsFromId`.

Disambiguation is `src/tz/disambiguate.ts`. Gap probes use 3h…48h windows because a 3h-only window misses US spring-forward (NY gap is 07:00Z).

## Cycle break

```text
instant.ts  --type only-->  ZonedDateTime
local-datetime.ts --type only--> ZonedDateTime
zoned-datetime.ts --runtime--> Instant, LocalDateTime
              also calls registerZonedFactory / registerLocalZonedFactory
```

Loading `ZonedDateTime` (including via `src/index.ts`) arms `toZonedDateTime`.

## Caching

Module-level `Map`s:

- Intl timezone formatters (per zone)
- Token-format compilers (per pattern)
- Locale `DateTimeFormat` (per locale+options)
- RelativeTimeFormat (per locale+style)

Unbounded on purpose. LRU later only if measured.

## Immutability

`readonly` fields, private constructors, methods return new instances. Core types have no `clone()`. Compat `clone()` wraps the same `ZonedDateTime`.

## Tree-shaking

- ESM-first, `"sideEffects": false`
- Subpath exports as in `package.json`
- Do not import `compat` or `temporal` from `src/index.ts`
- `format` / `toLocaleString` / `relativeTime` are **not** in the main barrel (WP5): they live on `tempo-js/format`, `tempo-js/intl`, `tempo-js/relative`

## Clock

`src/clock.ts`. Tests: `useFixedClock`. Production: `Date.now`.

## What must stay correct

See `docs/INVARIANTS.md`. Short list:

1. Hinnant epoch-day conversion including year ≤ 0
2. February 29 arithmetic
3. Month-end constrain
4. ISO week-year around Jan 1
5. DST gap and overlap in `America/New_York` (and London once WP1 lands)
6. Non-hour offsets
7. Instant identity through zoned round-trip
8. Moment adapter `diff` sign (`this - other`)
