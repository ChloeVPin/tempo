# Tempo Architecture

How the library is put together. Read `docs/DESIGN.md` for *why*. This file is *where* and *how*.

## Layout

```text
src/
  index.ts                 public core barrel
  errors.ts                TempoError + codes
  types.ts                 shared unit / policy types
  clock.ts                 injectable clock for now()
  core/
    civil.ts               leap years, epoch days, Hinnant algorithms
    overflow.ts            constrain / reject
    instant.ts
    local-date.ts
    local-time.ts
    local-datetime.ts
    duration.ts
    compare.ts
    range.ts               year / millis bounds
  iso/
    parse.ts               strict ISO / RFC 3339
    format.ts              stable serializers
    scan.ts                digit scanners, no catastrophic regex
  format/
    tokens.ts              token table
    compiler.ts            compile pattern → formatter
    format.ts              format(value, pattern, options)
  tz/
    types.ts
    offset.ts              ±HH:mm parsing and formatting
    provider.ts            TimeZoneProvider interface
    intl-provider.ts       Intl.DateTimeFormat offset engine
    fixed-offset.ts
    zoned-datetime.ts
    disambiguate.ts
  intl/
    formatter-cache.ts
    locale-format.ts
  relative/
    relative-time.ts
  compat/
    moment.ts              immutable Moment-shaped facade
    format-map.ts          Moment token → Tempo token
  temporal/
    interop.ts
tests/
  unit/
  property/
  golden/
  bench/
docs/
```

## Data flow

```text
string  --strict ISO-->  typed value  --format/ISO-->  string
                           |  ^
                           |  | plus / with / startOf
                           v  |
                         fields (integers)

LocalDateTime + zone + policy --> ZonedDateTime (instant + zone)
Instant + zone                  --> ZonedDateTime
ZonedDateTime                   --> Instant (drop zone)
ZonedDateTime                   --> LocalDateTime (drop instant identity)
```

## Civil math

`civil.ts` is the only place that converts between `(y, m, d)` and epoch days. Everything else asks it for:

- `daysFromCivil` / `civilFromDays`
- `isLeapYear` / `daysInMonth` / `daysInYear`
- ISO week fields
- `constrainDate` / `rejectDate`

Do not invent a second leap-year function.

## Parsing

Parsers are hand-written scanners over a string index. They do not use unbounded regular expressions. That is a security decision: Moment’s history includes ReDoS in parse paths.

A parse either consumes the entire input (after optional surrounding whitespace is rejected — ISO is exact) or fails. Trailing junk is invalid.

## Timezone provider

```ts
interface TimeZoneProvider {
  getOffsetMs(epochMs: number, zone: string): number;
  getPossibleOffsets(local: LocalDateTime, zone: string): number[];
}
```

The default provider uses `Intl.DateTimeFormat#formatToParts` with a cached formatter per zone. Offsets are derived by reconstructing the local civil time and subtracting the instant.

Disambiguation lives in `disambiguate.ts` so Temporal-compatible policy can be tested without constructing full objects.

## Caching

Caches are module-level `Map`s keyed by zone or by `JSON.stringify(locale + options)`:

- `Intl.DateTimeFormat` instances
- compiled token formatters

Caches are unbounded for the common case (a handful of zones and patterns). A future version may add an LRU if measurements show growth in long-lived servers that format thousands of dynamic patterns.

## Immutability

Classes expose `readonly` fields and never assign after construction. Methods return new instances. There is no `clone()` on core types because nothing mutates; the Moment adapter implements `clone()` as identity-plus-new-wrapper.

## Tree-shaking

- ESM-first, `"sideEffects": false`
- Subpath exports for format / tz / relative / compat / temporal
- No top-level `Intl` construction in `core/`
- Compat and Temporal interop must not be imported by `src/index.ts`

## Clock

`now()`, `today()`, and relative-time “now” go through `src/clock.ts`. Tests install a fixed clock. Production uses `Date.now`.

## What must stay correct

If you change one of these, add tests in the same commit:

1. Hinnant epoch-day conversion
2. February 29 arithmetic
3. Month-end constrain
4. ISO week-year around Jan 1
5. DST gap and overlap in `America/New_York` and `Europe/London`
6. Non-hour offsets (`Asia/Kolkata`, `Asia/Kathmandu`)
7. `startOf('day')` when midnight does not exist
8. Instant ordering across offset changes
