# API reference (v0.1)

All types are immutable. Methods return new values.

## LocalDate

A calendar date with no time zone. Month is `1..12`.

```ts
LocalDate.of(2026, 6, 1)
LocalDate.parse('2026-06-01')
LocalDate.tryParse('2026-02-30') // { ok: false, reason: 'INVALID_MONTH_DAY', ... }
LocalDate.today()
LocalDate.today('America/New_York')
LocalDate.fromEpochDay(0) // 1970-01-01
LocalDate.ofIsoWeek(2026, 1, 4)

date.plus({ months: 1 })
date.minus({ days: 3 }, { overflow: 'reject' })
date.with({ day: 31 })
date.startOf('month')
date.endOf('year')
date.until(other, 'days')
date.dayOfWeek() // ISO Monday=1
date.isoWeek()
date.isoWeekYear()
date.toISO() // '2026-06-01'
```

## LocalTime

```ts
LocalTime.of(9, 30)
LocalTime.parse('09:30:00.500')
LocalTime.midnight()
LocalTime.noon()
time.plus({ minutes: 90 }) // wraps at midnight
time.toMsOfDay()
```

## LocalDateTime

Civil date + time, no zone.

```ts
LocalDateTime.parse('2026-06-01T09:30:00')
LocalDateTime.combine(date, time)
local.toZonedDateTime('Europe/Paris')
local.toZonedDateTime('America/New_York', { disambiguation: 'reject' })
```

## Instant

A point on the UTC timeline. Integer milliseconds.

```ts
Instant.now()
Instant.parse('2026-06-01T12:00:00Z')
Instant.ofEpochMillis(0)
Instant.fromJSDate(new Date())
instant.plus({ hours: 2 })
instant.toZonedDateTime('Asia/Kolkata')
instant.toISO()
instant.toJSDate()
```

Calendar units (`years`, `months`) cannot be added to an Instant.

## ZonedDateTime

`(instant, timeZone)`. Local fields are derived.

```ts
ZonedDateTime.now('America/New_York')
ZonedDateTime.parse('2026-06-01T12:00:00-04:00[America/New_York]')
ZonedDateTime.fromLocal(local, 'America/New_York', { disambiguation: 'compatible' })
zdt.plus({ days: 1 })        // calendar math on local fields, then re-zone
zdt.plus({ hours: 3 })       // added to the instant
zdt.withTimeZone('UTC')
zdt.isDST()
zdt.toISO()
```

Disambiguation: `compatible` (default) | `earlier` | `later` | `reject`.

## Duration

```ts
Duration.of({ hours: 2, minutes: 30 })
Duration.parse('P1DT2H')
duration.plus(other)
duration.total('milliseconds') // rejects years/months
duration.toISO()
```

## Interval

An immutable half-open interval `[start, end)`. Endpoints can be any Tempo value with a `compare()` method, including `Instant`, `LocalDate`, and `ZonedDateTime`. Equal endpoints are allowed and form an empty interval.

```ts
import { DateRange, Instant, Interval, LocalDate } from 'tempo-js';

const start = Instant.parse('2026-06-01T00:00:00Z');
const end = start.plus({ days: 7 });
const interval = Interval.of(start, end);

interval.contains(start);                 // true
interval.contains(end);                   // false
interval.overlaps(other);
interval.abuts(other);
interval.intersection(other);              // Interval | null
interval.union(other);                    // Interval | null

const dates = DateRange.of(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 8));
```

`Interval.of` throws `INVALID_INTERVAL` when `end` precedes `start` or endpoints cannot be ordered.

## Overflow

`constrain` (default for `plus` / `with`) clamps the day into the target month.

`reject` throws `INVALID_MONTH_DAY`.

`LocalDate.of` / `parse` default to `reject`.

## Formatting

```ts
import { format } from 'tempo-js/format';

format(date, 'yyyy-MM-dd')
format(zdt, "yyyy-MM-dd 'at' HH:mm XXX")
date.toLocaleString?. // or:
import { toLocaleString } from 'tempo-js/intl';
toLocaleString(date, 'fr-FR', { dateStyle: 'full' })
```

Tokens: `yyyy MM dd HH hh mm ss SSS a XXX zzzz EEEE MMMM`. Not Moment’s `YYYY`/`DD`. Use the compat adapter for those.

## Relative time

```ts
import { fromNow, relativeTime } from 'tempo-js/relative';
fromNow(instant, { locale: 'en' })
```

## Moment adapter

```ts
import { moment } from 'tempo-js/compat/moment';
moment('2026-06-01T00:00:00Z').add(1, 'day').format('YYYY-MM-DD')
```

Immutable. Strict parse. Common methods only. See `docs/MIGRATION.md`.

## Errors

`TempoError` with `code`:

`INVALID_DATE` `INVALID_MONTH_DAY` `INVALID_TIME` `INVALID_DURATION` `INVALID_PARSE` `INVALID_FORMAT` `INVALID_OFFSET` `TIMEZONE_GAP` `TIMEZONE_OVERLAP` `UNKNOWN_TIMEZONE` `OUT_OF_RANGE` `INCOMPATIBLE_UNIT` `INVALID_INTERVAL`

## Clock (tests)

```ts
import { useFixedClock, resetClock } from 'tempo-js';
const restore = useFixedClock(Date.UTC(2026, 5, 1));
// ...
restore();
```
