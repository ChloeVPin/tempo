# Tempo 1.0.0 — release announcement draft

> **Status:** prepared for publication; npm publication is a separate release step.

## Short announcement

Tempo 1.0.0 is ready: a small, immutable, Temporal-aligned date/time library for JavaScript and TypeScript.

Tempo gives each value a clear meaning — `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, and `Duration` — with strict ISO parsing, predictable overflow and DST policies, Intl-first time zones, and tree-shakable subpath modules. It is a clean-break replacement for Moment.js, with an optional compatibility adapter for migration.

```sh
npm install @chloevpin/tempo
```

Start with the [API reference](API.md) and [Moment migration cookbook](MIGRATION.md).

## What ships in 1.0.0

- Immutable core values: arithmetic and withers return new values.
- Strict ISO parsing by default: no `Date.parse` fallback and no invalid-date objects.
- A 1-based civil API: months are `1..12`.
- Temporal-shaped defaults: `constrain` overflow and `compatible` DST disambiguation.
- Intl-first IANA time zones without bundling the IANA database in the default package.
- Integer epoch-millisecond `Instant` values.
- Generic immutable half-open `Interval<T>` values and the `DateRange.of(...)` LocalDate factory.
- Java/Temporal-style token formatting from `@chloevpin/tempo/format`.
- Explicit locale and relative-time modules from `@chloevpin/tempo/intl` and `@chloevpin/tempo/relative`.
- Feature-detected Temporal interop from `@chloevpin/tempo/temporal`.
- An immutable common-subset Moment adapter from `@chloevpin/tempo/compat/moment`.
- ESM, CommonJS, and TypeScript declarations with zero runtime dependencies.

## Migration highlights

### Choose the type before choosing the method

```ts
import { Instant, LocalDate, ZonedDateTime } from '@chloevpin/tempo';

const birthday = LocalDate.parse('1990-06-01');
const event = Instant.parse('2026-06-01T16:00:00Z');
const meeting = ZonedDateTime.now('America/New_York');
```

Use `LocalDate` for a calendar date, `Instant` for a timeline value, and `ZonedDateTime` when the zone is part of the value. Do not use one mutable object for every concept.

### Replace mutation with returned values

```ts
// Moment
const next = moment(value).add(1, 'day');

// Tempo
const next = value.plus({ days: 1 });
```

Tempo values are immutable. Reusing `value` is safe; `plus`, `minus`, and `with` never change it.

### Replace heuristic parsing with strict parsing

```ts
LocalDate.parse('2026-06-01');
LocalDate.parse('01/06/2026', 'dd/MM/yyyy');

// Throws instead of creating an invalid object:
LocalDate.parse('01/02/26');
```

The custom parser intentionally supports only numeric LocalDate fields and literals. Locale-sensitive names, weekdays, times, offsets, and zones remain explicit future work.

### Audit month indexing

Tempo months are `1..12`, matching ISO and Temporal. Moment’s `month()` is zero-based; convert adapter boundaries carefully.

```ts
LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO();
// '2026-02-28' — constrain is the default
```

Pass `{ overflow: 'reject' }` when clamping is not acceptable.

### Make DST policy explicit

```ts
import { LocalDateTime } from '@chloevpin/tempo';

const local = LocalDateTime.parse('2026-03-08T02:30:00');
const meeting = local.toZonedDateTime('America/New_York', {
  disambiguation: 'reject',
});
```

The default is Temporal-compatible: gaps choose the later instant and overlaps choose the earlier instant. Use `earlier`, `later`, or `reject` when the business rule requires a different choice.

### Move formatting and advanced modules to subpaths

```ts
import { format } from '@chloevpin/tempo/format';
import { toLocaleString } from '@chloevpin/tempo/intl';
import { fromNow } from '@chloevpin/tempo/relative';
import { moment } from '@chloevpin/tempo/compat/moment';
import { toTemporalInstant } from '@chloevpin/tempo/temporal';

format(date, 'yyyy-MM-dd');
```

The main `@chloevpin/tempo` barrel intentionally contains core and timezone APIs only. This keeps the default entry small and makes advanced dependencies explicit.

### Replace Moment calls deliberately

| Moment                  | Tempo                                             |
| ----------------------- | ------------------------------------------------- |
| `moment()`              | `ZonedDateTime.now()` or `Instant.now()`          |
| `moment.utc()`          | `Instant.now()` or `ZonedDateTime.now('UTC')`     |
| `moment(input)`         | `Instant.parse(input)` / `LocalDate.parse(input)` |
| `m.add(1, 'day')`       | `value.plus({ days: 1 })`                         |
| `m.startOf('month')`    | `value.startOf('month')`                          |
| `m.diff(other, 'days')` | `value.until(other, 'day')`                       |
| `m.toISOString()`       | `value.toISO()`                                   |
| `m.tz('Europe/Paris')`  | `zdt.withTimeZone('Europe/Paris')`                |
| `m.clone()`             | No replacement; values are immutable              |

Use `@chloevpin/tempo/compat/moment` as a stepping stone, not as the core API. The adapter is intentionally a strict, immutable subset and does not restore Moment’s global locale, plugin, or permissive-invalid-object behavior.

## Release evidence

The 1.0.0 candidate was verified with the civil walk, property tests, timezone goldens, parser fuzzing, Temporal/Luxon/date-fns differentials, Moment compat differentials, runtime smoke jobs, package export checks, and bundle-size limits. Representative core benchmarks show Tempo ahead of Moment in the measured same-process Node workloads; those numbers are regression evidence, not a universal performance claim.

## Important runtime note

Tempo uses the host's `Intl` timezone data. The default package does not bundle IANA tzdata. Applications targeting incomplete or unusual Intl environments should evaluate the optional timezone-data package when it becomes available.

## Links

- [API reference](API.md)
- [Moment migration cookbook](MIGRATION.md)
- [Testing strategy](TESTING.md)
- [Roadmap and release boundaries](https://github.com/ChloeVPin/tempo/blob/main/docs/ROADMAP.md)
