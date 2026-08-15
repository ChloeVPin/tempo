# Migrating from Moment.js

Tempo is a clean break. The core API is Temporal-shaped, immutable, and strict. If you need a stepping stone, use `tempo-js/compat/moment` for the common 20 methods, then delete it.

## What will not be the same

| Moment | Tempo |
|---|---|
| Mutable | Immutable. `plus` returns a new value. |
| One object for everything | `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime` |
| `month()` is 0-based | `month` is 1–12 |
| `date()` vs `day()` | `day` is day-of-month. Weekday is `dayOfWeek` (ISO 1–7). |
| `moment(string)` heuristics | Strict ISO. Other formats need an explicit pattern (later) or the compat parser. |
| `moment.locale('fr')` | Pass `{ locale: 'fr-FR' }` into the call. |
| Invalid objects | Throws, or `tryParse` returns `{ ok: false }` |
| `YYYY` week-year footgun | Token `yyyy` is calendar year. Week year is `YYYY` only in the Moment adapter. |

## Pick a type

Ask what the value *is*:

- A timestamp, a log line, “when did this happen?” → `Instant`
- A birthday, an invoice date, “June 1st” → `LocalDate`
- Store hours, an alarm at 09:00 → `LocalTime`
- A meeting on a civil calendar before you know the zone → `LocalDateTime`
- A meeting in `America/New_York` → `ZonedDateTime`

If you used `moment()` for “now in this browser,” start with `ZonedDateTime.now()` (system zone) or `Instant.now()`.

## Side-by-side

```js
// Moment
moment().format('YYYY-MM-DD')
moment(date).add(1, 'day')
moment(a).diff(b, 'days')
moment(date).toISOString()
moment.tz('2026-06-01 10:00', 'America/New_York')
```

```ts
import { LocalDate, Instant, ZonedDateTime, LocalDateTime } from 'tempo-js';

LocalDate.today().toISO()
date.plus({ days: 1 })
a.until(b, 'day')
instant.toISO()
LocalDateTime.parse('2026-06-01T10:00:00').toZonedDateTime('America/New_York')
```

## Compat adapter

```ts
import { moment } from 'tempo-js/compat/moment';

const m = moment('2026-06-01T10:00:00Z');
m.add(1, 'day').format('YYYY-MM-DD'); // new object, original unchanged
```

Supported: `format`, `add`, `subtract`, `startOf`, `endOf`, `diff`, `isBefore`, `isAfter`, `isSame`, `isValid`, `toDate`, `toISOString`, `unix`, `utc`, `utcOffset`, `fromNow`, `tz`, `clone`.

Not supported on purpose: global locale mutation, plugin `moment.fn` hooks, permissive parsing of `'01/02/26'`, mutating setters.

## Suggested stages

1. Inventory `moment` / `moment-timezone` imports and mutable usage.
2. Swap leaf files to `tempo-js/compat/moment`.
3. Replace `format` / `add` / `diff` / `toISOString` with core types.
4. Replace `moment.tz` with `ZonedDateTime`.
5. Delete the adapter.

## Format tokens

Core Tempo formatting uses Temporal/Java tokens (`yyyy-MM-dd HH:mm:ss`). The Moment adapter accepts Moment tokens (`YYYY-MM-DD HH:mm:ss`) and maps them.

If you are writing new code, use Tempo tokens. `YYYY` in Moment is ISO week-year, which is wrong at year boundaries.

## 20-call cookbook

The adapter is a migration bridge, not the destination. Prefer the typed core once each call site is understood.

| Moment call | Tempo replacement | Notes |
|---|---|---|
| `moment()` | `ZonedDateTime.now()` or `Instant.now()` | Choose whether the value needs a zone. |
| `moment.utc()` | `ZonedDateTime.now('UTC')` | For a timeline value, use `Instant.now()`. |
| `moment(input)` | `Instant.parse(input)` / `LocalDate.parse(input)` | Core parsing is strict ISO; no `Date.parse` fallback. |
| `moment.tz(input, zone)` | `LocalDateTime.parse(input).toZonedDateTime(zone)` | Supply DST disambiguation when local time may be ambiguous. |
| `m.format('YYYY-MM-DD')` | `format(date, 'yyyy-MM-dd')` | Import `format` from `tempo-js/format`. |
| `m.add(1, 'day')` | `value.plus({ days: 1 })` | Returns a new immutable value. |
| `m.subtract(2, 'hours')` | `value.minus({ hours: 2 })` | Returns a new immutable value. |
| `m.startOf('month')` | `value.startOf('month')` | Unit names remain explicit. |
| `m.endOf('day')` | `value.endOf('day')` | Zoned values apply the zone’s disambiguation rules. |
| `m.diff(other, 'days')` | `value.until(other, 'day')` | Core direction is `other - value`; compat preserves Moment’s `this - other`. |
| `m.isBefore(other)` | `value.isBefore(other)` | Compare like-for-like types. |
| `m.isAfter(other)` | `value.isAfter(other)` | `Instant` is usually the right timeline type. |
| `m.isSame(other)` | `value.isSame(other)` or `value.equals(other)` | `equals` also checks the zone for `ZonedDateTime`. |
| `m.unix()` | `instant.toEpochSeconds()` | Integer epoch seconds. |
| `m.valueOf()` | `instant.toEpochMilliseconds()` | Integer epoch milliseconds. |
| `m.toDate()` | `instant.toJSDate()` | Conversion is explicit and always an instant. |
| `m.toISOString()` | `value.toISO()` | ISO output is type-specific. |
| `m.tz('Europe/Paris')` | `zdt.withTimeZone('Europe/Paris')` | Keeps the instant, changes the view zone. |
| `m.utcOffset()` | `zdt.offsetMs / 60_000` | Offset is a derived property of the instant and zone. |
| `m.clone()` | No replacement needed | Tempo values are immutable; reuse the original. |
| `m.fromNow()` | `fromNow(instant)` | Import from `tempo-js/relative`; pass locale explicitly when needed. |

### Migration rules that prevent the expensive bugs

1. Decide whether each old value is an `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, or `ZonedDateTime` before translating methods.
2. Replace Moment `YYYY` with core `yyyy`; week-year formatting is a deliberate separate concern.
3. Replace implicit local parsing with an ISO string or an explicit custom pattern such as `LocalDate.parse('01/06/2026', 'dd/MM/yyyy')`.
4. Audit `add({ months })` at month ends: Tempo constrains by default and never mutates the source.
5. Audit DST gaps and overlaps: use `disambiguation: 'compatible' | 'earlier' | 'later' | 'reject'` instead of relying on an implicit host choice.
6. Keep `moment-timezone` only while the adapter is still in use; Tempo’s core timezone engine is Intl-first and does not bundle IANA data.
7. Do not recreate Moment’s invalid-object flow. Tempo throws or returns `tryParse(...).ok === false` immediately.
