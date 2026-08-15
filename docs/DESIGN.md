# Tempo Design Document

A TypeScript-first, immutable, Temporal-aligned date/time library intended to replace Moment.js in modern environments.

Status: Phase 1 hardening and the 1.0 API-freeze audit are landed on `main`; npm publication remains an explicit release step (see `docs/WORK-PACKAGES.md`).
Authors: Tempo maintainers
Date: 2026-08-14 (reconciled 2026-08-15)

Taking over? Read `AGENTS.md` and `docs/HANDOFF.md` first. This file is the design rationale, not a file-level status report.

## 1. Problem

Moment.js is still widely installed and still the API many developers reach for. It is also architecturally obsolete:

- mutable objects
- monolithic, hard-to-shake bundles
- permissive, heuristic parsing
- global locale state
- overloaded getter/setter methods
- no separation between instant, civil date, local datetime, and zoned datetime
- timezone support bolted on via a large data package

A 2026 replacement should not clone that API. It should replace the job Moment does with types and defaults that are hard to misuse.

## 2. Goals

1. Immutable value types with Temporal-like semantics.
2. Strict parsing by default. No `Date.parse` fallback.
3. Tiny core. Advanced features are separate entry points.
4. First-class TypeScript. No `any` in public types.
5. Intl-first localization and IANA timezone resolution.
6. Explicit overflow and DST disambiguation policies.
7. Zero runtime dependencies in core.
8. Optional Moment compatibility adapter for migration.
9. Temporal interop when the host provides it. Native Temporal is not required.

## 3. Non-goals

- Pixel-perfect Moment compatibility in the core API.
- Mutating methods.
- Global locale mutation.
- Shipping full historical tzdata in the default bundle.
- Nanosecond precision in v1.
- Non-Gregorian calendars in v1.

## 4. Types

| Type | Meaning | Time zone? | Instant? |
|---|---|---|---|
| `Instant` | A point on the UTC timeline | no | yes |
| `LocalDate` | A calendar date | no | no |
| `LocalTime` | A wall-clock time of day | no | no |
| `LocalDateTime` | A civil date and time with no zone | no | no |
| `ZonedDateTime` | A civil datetime in a named or fixed zone | yes | yes |
| `Duration` | A signed mix of calendar and time units | n/a | n/a |
| `Interval<T>` | Immutable half-open range over comparable values | endpoint-defined | endpoint-defined |
| Fixed-offset `ZonedDateTime` | Civil datetime + fixed offset view | offset zone | yes |

`LocalDate` is never silently treated as UTC midnight or as “system local midnight.” Conversion to an instant always requires a zone (or an explicit offset). A distinct `OffsetDateTime` class is deferred; fixed offsets use `ZonedDateTime` IDs such as `UTC` or `+05:30`.

## 5. Internal model

### 5.1 Instant

Integer epoch milliseconds. Range matches ECMAScript `Date`: ±8.64e15 ms.

Nanoseconds are deferred. An optional BigInt module may appear after 1.0.

### 5.2 Civil date

Integer `(year, month, day)` with month in `1..12`.

Conversions to/from epoch day use Howard Hinnant’s `days_from_civil` / `civil_from_days`. All calendar arithmetic is integer. No floating-point day math.

### 5.3 Civil time

Integer `(hour, minute, second, millisecond)` with hour in `0..23`.

### 5.4 ZonedDateTime

Source of truth is `(instant, timeZoneId)`. Local fields are derived. Caching the current offset is allowed as an implementation detail, never as the sole stored truth.

### 5.5 Duration

Stores unnormalized fields:

```
years, months, weeks, days, hours, minutes, seconds, milliseconds
```

Calendar units and time units are both representable. Balancing is explicit. Adding a duration to a date applies calendar units first (years, months, weeks, days) then time units, matching Temporal.

## 6. Policies

### 6.1 Overflow

Used when constructing or replacing calendar fields.

| Policy | Behavior |
|---|---|
| `constrain` (default) | Clamp the day into the target month. `2026-01-31` + 1 month → `2026-02-28`. |
| `reject` | Throw `TempoError` with `INVALID_MONTH_DAY`. |

`plus` / `minus` of calendar units use `constrain` unless the caller passes `reject`.

There is no silent “overflow into the next month” default. That Moment behavior is a footgun (`Jan 31` + 1 month becoming `March 3`).

### 6.2 DST disambiguation

Used when a local datetime maps to zero or two instants.

| Policy | Gap | Overlap |
|---|---|---|
| `compatible` (default) | later instant | earlier instant |
| `earlier` | earlier | earlier |
| `later` | later | later |
| `reject` | throw `TIMEZONE_GAP` | throw `TIMEZONE_OVERLAP` |

Semantics follow Temporal.

### 6.3 Parsing

Four layers, only the first is in the default import path:

1. Strict ISO 8601 / RFC 3339
2. Explicit numeric token parser for LocalDate (opt-in; locale-sensitive parsing remains deferred)
3. Locale parser (later)
4. Legacy permissive parser (compat only)

Invalid input never becomes an “invalid object” that formats as `Invalid date`. `parse` throws. `tryParse` returns a result object.

### 6.4 Locale

No global locale. Every locale-aware call takes an explicit locale or uses the host default for that call only.

## 7. Public API sketch

```ts
import {
  Instant,
  LocalDate,
  LocalTime,
  LocalDateTime,
  ZonedDateTime,
  Duration,
} from '@chloevpin/tempo';

const date = LocalDate.parse('2026-06-01');
const next = date.plus({ days: 1 });
const start = date.startOf('month');

const instant = Instant.parse('2026-06-01T12:00:00Z');
const ny = instant.toZonedDateTime('America/New_York');

const meeting = LocalDateTime.parse('2026-03-08T02:30:00').toZonedDateTime(
  'America/New_York',
  { disambiguation: 'compatible' },
);
```

Constructor-style `new LocalDate(...)` is not public. Use `of`, `from`, `parse`, `today`, `now`.

Getters and withers are separate:

```ts
date.year          // getter
date.with({ year: 2027 })
```

## 8. Modules and entry points

| Import | Contents |
|---|---|
| `@chloevpin/tempo` | Core types, ISO parse/format, compare, arithmetic |
| `@chloevpin/tempo/format` | Token formatter |
| `@chloevpin/tempo/tz` | IANA / Intl timezone provider, `ZonedDateTime` extras |
| `@chloevpin/tempo/intl` | Locale formatting helpers |
| `@chloevpin/tempo/relative` | Relative time |
| `@chloevpin/tempo/compat/moment` | Immutable Moment-shaped adapter |
| `@chloevpin/tempo/temporal` | Temporal conversions |

`sideEffects: false`. No plugin registration.

`ZonedDateTime` lives in the main export because timezone-aware “now” is a core job. The heavy Intl cache lives in `tz` and is loaded when zoned APIs run.

## 9. Errors

`TempoError` extends `Error` and always has a stable `code`:

- `INVALID_DATE`
- `INVALID_MONTH_DAY`
- `INVALID_TIME`
- `INVALID_DURATION`
- `INVALID_PARSE`
- `INVALID_FORMAT`
- `INVALID_OFFSET`
- `TIMEZONE_GAP`
- `TIMEZONE_OVERLAP`
- `UNKNOWN_TIMEZONE`
- `OUT_OF_RANGE`
- `INCOMPATIBLE_UNIT`
- `INVALID_INTERVAL`

Messages are English and stable enough for tests. Codes are the contract.

## 10. Interop

- `toJSDate()` / `Instant.fromJSDate()` — instant only. `LocalDate` does not convert to `Date` without a zone.
- `toJSON()` returns the ISO string for that type.
- Temporal conversions are feature-detected and live in `@chloevpin/tempo/temporal`.

## 11. Moment adapter

`@chloevpin/tempo/compat/moment` covers the common subset:

`format`, `add`, `subtract`, `startOf`, `endOf`, `diff`, `isBefore`, `isAfter`, `isSame`, `isValid`, `toDate`, `toISOString`, `unix`, `utc`, `utcOffset`, `fromNow`, `tz`, `clone`

Rules:

- Instances are immutable. `add` returns a new object.
- In development, calling a mutating-looking setter (`year(2027)`) still returns a new instance and may warn.
- Parsing is stricter than Moment. The adapter does not restore `Date.parse` heuristics.
- Months stay 1-based internally. The adapter accepts Moment’s 0-based `month()` for migration only and documents it.

## 12. Testing oracles

In priority order:

1. Temporal semantics
2. IANA / host Intl timezone data
3. CLDR / Intl for locale output
4. Luxon and date-fns as secondary checks
5. Moment only for the compat adapter

## 13. Size and performance budgets

| Bundle | Target min+gzip |
|---|---:|
| Core only (without timezone entry) | ≤ 8 kB |
| Main core + timezone entry | ≤ 10 kB |
| Format entry | ≤ 6 kB |
| Moment compat | measured separately, not in core |

Performance targets are relative: beat Moment on every core microbench; stay within ~20% of date-fns on simple arithmetic.

## 14. Key decisions

1. **Clean break, optional adapter.** Cloning Moment would freeze its worst mistakes.
2. **Type separation.** Instant ≠ local date ≠ zoned datetime.
3. **1-based months.** Human and Temporal. JS Date interop is explicit.
4. **Strict parse, throwing by default.** `tryParse` for total APIs.
5. **Intl-first timezones.** Optional embedded tzdata is a later package.
6. **Constrain overflow, compatible DST.** Same defaults as Temporal.
7. **Single package, subpath exports.** Split to a monorepo only if publish needs force it.
8. **Millisecond Instant.** Good enough for v1, no BigInt tax.
9. **No invalid objects.** Fail at the call that received bad input.
10. **npm name `@chloevpin/tempo`.** The product is Tempo; the owner scope avoids npm's unscoped-name similarity restrictions.
11. **One mixed `Duration` through 1.0.** Splitting calendar `Period` from time `Duration` is deferred until usage or Temporal interop proves it necessary.
12. **Fixed offsets remain `ZonedDateTime` views through 1.0.** A separate `OffsetDateTime` is deferred until a distinct invariant is demonstrated.

## 15. Open questions

None blocking the 1.0 candidate. Deferred:

- Locale-sensitive parsing remains deferred; the supported custom parser is the documented numeric LocalDate subset.

## 16. PR plan

This repository is being bootstrapped as a single tree. The logical PR sequence if the work is restacked later:

1. **docs: design and roadmap** — `docs/**`, `README.md`
2. **chore: package scaffold** — `package.json`, tsconfig, tsup, vitest, eslint, CI
3. **feat: civil calendar** — `src/core/civil.ts` + exhaustive leap/month tests
4. **feat: LocalDate / LocalTime / LocalDateTime / Instant / Duration**
5. **feat: ISO parse and format**
6. **feat: token formatter**
7. **feat: ZonedDateTime + Intl provider**
8. **feat: relative time + Moment compat + Temporal interop**
9. **test: property, golden, size budgets**
