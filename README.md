# Tempo

[![CI](https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml/badge.svg)](https://github.com/ChloeVPin/tempo/actions/workflows/ci.yml)

**A modern, immutable, Temporal-aligned date/time library for JavaScript and TypeScript.**

Tempo is a clean-break replacement for Moment.js. It does not clone Moment’s mutable, monolithic API. It gives you explicit types, strict parsing, tree-shakable modules, and optional Moment compatibility if you are migrating.

```ts
import { Instant, Interval, LocalDate, ZonedDateTime } from 'tempo-js';

const date = LocalDate.parse('2026-06-01').plus({ days: 1 });
date.toISO(); // '2026-06-02'

const instant = Instant.parse('2026-06-01T16:00:00Z');
const ny = instant.toZonedDateTime('America/New_York');
ny.toISO(); // '2026-06-01T12:00:00-04:00[America/New_York]'

const week = Interval.of(instant, instant.plus({ days: 7 }));
week.contains(instant); // true; intervals are immutable and half-open
```

## Why Tempo exists

Moment is legacy. It is still everywhere because of inertia, not because its design is right.

Tempo’s contract:

| Moment | Tempo |
|---|---|
| Mutable | Immutable |
| One object for every concept | `Instant` · `LocalDate` · `LocalTime` · `LocalDateTime` · `ZonedDateTime` · `Duration` |
| Heuristic parsing | Strict ISO by default |
| Global locale | Per-call locale |
| 0-based months | 1-based months |
| Huge default bundle | Small core, subpath modules |
| `moment-timezone` data dump | Intl-first IANA zones |

## Install

```sh
npm install tempo-js
```

The product is called **Tempo**. The npm name is `tempo-js` because `tempo` is already taken.

## Quick start

```ts
import {
  LocalDate,
  LocalDateTime,
  Instant,
  Duration,
  ZonedDateTime,
} from 'tempo-js';

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

## Packages / entry points

```ts
import { LocalDate } from 'tempo-js';
import { format } from 'tempo-js/format';
import { relativeTime } from 'tempo-js/relative';
import { moment } from 'tempo-js/compat/moment';
import { toTemporalInstant } from 'tempo-js/temporal';
```

## Documentation

- [Docs index](docs/README.md)
- **Taking over this repo:** [AGENTS.md](AGENTS.md) → [handoff](docs/HANDOFF.md) → [work packages](docs/WORK-PACKAGES.md)
- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Invariants](docs/INVARIANTS.md)
- [Implementation status](docs/STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Moment migration](docs/MIGRATION.md)
- [Testing strategy](docs/TESTING.md)
- [API reference](docs/API.md)
- [Research notes](docs/RESEARCH.md) (background only)

## Status

`1.0.0` release candidate — Phase 1 hardening and the 1.0 API-freeze candidate are on `main`. Package metadata is prepared, but npm publication remains an explicit next step. See [WORK-PACKAGES.md](docs/WORK-PACKAGES.md) for deferred work and release boundaries.

## License

MIT
