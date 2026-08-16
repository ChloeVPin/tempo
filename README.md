<div align="center">

<img src="assets/logo.png" alt="Tempo logo" width="136" />

# Tempo

**Immutable, Temporal-aligned date and time primitives for JavaScript and TypeScript.**

[![CI](https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml/badge.svg)](https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40chloevpin%2Ftempo?logo=npm)](https://www.npmjs.com/package/@chloevpin/tempo)
[![License](https://img.shields.io/github/license/ChloeVPin/tempo)](LICENSE)

</div>

Tempo is a clean-break alternative to Moment.js. It favors explicit types, strict parsing, immutable values, tree-shakable entry points, and optional compatibility helpers for migrations.

```ts
import { Instant, Interval, LocalDate } from '@chloevpin/tempo';

const date = LocalDate.parse('2026-06-01').plus({ days: 1 });
date.toISO(); // '2026-06-02'

const instant = Instant.parse('2026-06-01T16:00:00Z');
const ny = instant.toZonedDateTime('America/New_York');
ny.toISO(); // '2026-06-01T12:00:00-04:00[America/New_York]'

const week = Interval.of(instant, instant.plus({ days: 7 }));
week.contains(instant); // true
```

## Install

```sh
npm install @chloevpin/tempo
```

The product is called **Tempo**. The package uses the `@chloevpin` npm scope to avoid npm's unscoped-name similarity restrictions.

## Design

Moment solved an important problem for an earlier JavaScript ecosystem, but its mutable, all-purpose object model predates modern date/time APIs. Tempo separates concepts instead of making one object represent everything.

| Moment | Tempo |
| --- | --- |
| Mutable values | Immutable values |
| One object for many concepts | `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Duration` |
| Heuristic parsing | Strict ISO by default |
| Global locale | Per-call locale |
| 0-based months | 1-based months |
| Large default surface | Small core with subpath entry points |
| Separate timezone data package | Intl-first IANA zones |

## Quick start

```ts
import {
  Duration,
  Instant,
  LocalDate,
  LocalDateTime,
  ZonedDateTime,
} from '@chloevpin/tempo';

LocalDate.of(2026, 6, 1).plus({ months: 1 }).toISO(); // 2026-07-01
LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO(); // 2026-02-28

Instant.now().plus({ hours: 2 }).toISO();

ZonedDateTime.fromLocal(
  LocalDateTime.parse('2026-03-08T02:30:00'),
  'America/New_York',
  { disambiguation: 'compatible' },
);
```

Parsing is strict:

```ts
LocalDate.parse('2026-02-30'); // throws TempoError INVALID_MONTH_DAY
LocalDate.parse('01/02/2026'); // throws TempoError INVALID_PARSE
LocalDate.tryParse('2026-06-01'); // { ok: true, value }
```

## Entry points

```ts
import { LocalDate } from '@chloevpin/tempo';
import { format } from '@chloevpin/tempo/format';
import { relativeTime } from '@chloevpin/tempo/relative';
import { moment } from '@chloevpin/tempo/compat/moment';
import { toTemporalInstant } from '@chloevpin/tempo/temporal';
```

Use the root package for the core date/time types and subpath imports for formatting, relative time, compatibility, and Temporal interop.

## Documentation

- [API reference](docs/API.md)
- [Moment migration guide](docs/MIGRATION.md)
- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Invariants](docs/INVARIANTS.md)
- [Testing strategy](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)

## Status

Tempo 1.0.0 is published on npm. The 1.0 public API is treated as frozen; future work is limited to documented post-1.0 improvements and compatibility fixes.

## License

MIT
