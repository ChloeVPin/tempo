<p align="center">
  <img src="assets/logo.png" alt="Tempo" width="144" />
</p>

<p align="center">
  <a href="https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml"><img src="https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@chloevpin/tempo"><img src="https://img.shields.io/npm/v/%40chloevpin%2Ftempo?logo=npm" alt="npm" /></a>
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT" />
</p>

Tempo is an immutable, Temporal-aligned date and time library for JavaScript and TypeScript. Types are explicit. Parsing is strict. The core stays small; formatting, time zones, and Moment compatibility are separate entry points.

It is a clean-break alternative to Moment.js, not a clone of Moment’s mutable API.

```ts
import { Instant, Interval, LocalDate } from '@chloevpin/tempo';

const date = LocalDate.parse('2026-06-01').plus({ days: 1 });
date.toISO(); // '2026-06-02'

const instant = Instant.parse('2026-06-01T16:00:00Z');
const ny = instant.toZonedDateTime('America/New_York');
ny.toISO(); // '2026-06-01T12:00:00-04:00[America/New_York]'

const week = Interval.of(instant, instant.plus({ days: 7 }));
week.contains(instant); // true — intervals are immutable and half-open
```

## Install

```sh
npm install @chloevpin/tempo
```

The product is **Tempo**. The package is `@chloevpin/tempo` because npm reserves unscoped names that are too close to existing packages.

## Why Tempo

| Moment | Tempo |
|---|---|
| Mutable | Immutable |
| One object for every concept | `Instant` · `LocalDate` · `LocalTime` · `LocalDateTime` · `ZonedDateTime` · `Duration` |
| Heuristic parsing | Strict ISO by default |
| Global locale | Per-call locale |
| 0-based months | 1-based months |
| Huge default bundle | Small core, subpath modules |
| `moment-timezone` data dump | Intl-first IANA zones |

## Quick start

```ts
import {
  Instant,
  LocalDate,
  LocalDateTime,
  ZonedDateTime,
} from '@chloevpin/tempo';

LocalDate.of(2026, 6, 1).plus({ months: 1 }).toISO(); // 2026-07-01
LocalDate.of(2026, 1, 31).plus({ months: 1 }).toISO(); // 2026-02-28 (constrain)

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

Use the root package for the core types. Import formatting, relative time, Moment compatibility, and Temporal interop from the subpaths.

## Documentation

| | |
|---|---|
| [API reference](docs/API.md) | Public types and methods |
| [Moment migration](docs/MIGRATION.md) | Replacing Moment call sites |
| [Design](docs/DESIGN.md) | Why the API looks like this |
| [Architecture](docs/ARCHITECTURE.md) | Module layout |
| [Changelog](CHANGELOG.md) | What changed |

`1.0.0` is published. The public API is frozen.

## License

MIT
