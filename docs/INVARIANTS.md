# Invariants

If a change violates a row below, it is a bug unless the user explicitly approved a breaking change **and** you updated this file, `docs/API.md`, and tests in the same commit.

These are the oracle. When Temporal, Luxon, Moment, and this table disagree, follow this table for Tempo core. Moment wins only inside `src/compat`.

## Civil calendar

| Input | Result |
|---|---|
| `isLeapYear(2024)` | `true` |
| `isLeapYear(1900)` | `false` |
| `isLeapYear(2000)` | `true` |
| `isLeapYear(2100)` | `false` |
| `isLeapYear(0)` | `true` |
| `daysInMonth(2024, 2)` | `29` |
| `daysInMonth(2026, 2)` | `28` |
| `daysFromCivil(1970, 1, 1)` | `0` |
| `daysFromCivil(1969, 12, 31)` | `-1` |
| `civilFromDays(daysFromCivil(y,m,d))` | `{year:y, month:m, day:d}` for every valid date in range, including `year <= 0` |
| `isoDayOfWeek(0)` | `4` (1970-01-01 Thursday) |
| `isoWeekFields(2025, 12, 29)` | `{ weekYear: 2026, week: 1, weekday: 1 }` |
| `isoWeekFields(2026, 1, 1)` | `{ weekYear: 2026, week: 1, weekday: 4 }` |
| `LocalDate.parse('2026-W01-4').toISO()` | `'2026-01-01'` |

Hinnant era math **must** use toward-zero division (`Math.trunc`), not `Math.floor`. `Math.floor` breaks year 0 / negative years (`-1-12-31` was mapping to `0-01-01`).

## Overflow

| Call | Policy | Result |
|---|---|---|
| `LocalDate.of(2026, 1, 31).plus({ months: 1 })` | constrain (default for plus) | `2026-02-28` |
| `LocalDate.of(2024, 2, 29).plus({ years: 1 })` | constrain | `2025-02-28` |
| same, `{ overflow: 'reject' }` | reject | throws `INVALID_MONTH_DAY` |
| `LocalDate.of(2026, 2, 30)` | reject (default for of/parse) | throws |
| `LocalDate.parse('2026-02-30')` | reject | throws |
| `LocalDate.parse('01/02/2026')` | — | throws `INVALID_PARSE` |

There is no default “overflow into next month” (`Jan 31 + 1 month → Mar 3`). That is a Moment footgun we refuse.

## Instant / ISO

| Call | Result |
|---|---|
| `Instant.parse('2026-06-01T12:00:00Z')` | ok |
| `Instant.parse('2026-06-01T14:00:00+02:00')` | same instant as above |
| `Instant.parse('2026-06-01T12:00:00')` | throws (no offset) |
| `Instant.parse('not a date')` | throws |
| `instant.plus({ months: 1 })` | throws `INCOMPATIBLE_UNIT` |
| `LocalDateTime.parse('2026-06-01T12:00:00Z')` | throws (offset not allowed) |

`parse(toISO(x)) === x` for every core type in the supported range (property-tested for `LocalDate`).

## Time zones (host Intl)

Use these as golden. If a host ICU disagrees, record ICU/Node version in the test; do not weaken ISO output.

| Instant (UTC) | Zone | Local ISO | Offset |
|---|---|---|---|
| `2026-06-01T16:00:00Z` | `America/New_York` | `2026-06-01T12:00:00` | `-04:00` |
| `2026-01-01T16:00:00Z` | `America/New_York` | `2026-01-01T11:00:00` | `-05:00` |
| `2026-06-01T00:00:00Z` | `Europe/London` | `2026-06-01T01:00:00` | `+01:00` |
| `2026-01-01T00:00:00Z` | `Europe/London` | `2026-01-01T00:00:00` | `+00:00` |
| `2026-06-01T00:00:00Z` | `Asia/Kolkata` | `2026-06-01T05:30:00` | `+05:30` |
| `2026-06-01T00:00:00Z` | `Asia/Kathmandu` | `2026-06-01T05:45:00` | `+05:45` |
| `2026-01-15T12:00:00Z` | `Australia/Sydney` | `2026-01-15T23:00:00` | `+11:00` |
| `2026-07-15T12:00:00Z` | `Australia/Sydney` | `2026-07-15T22:00:00` | `+10:00` |

`zoned.toInstant()` after `instant.toZonedDateTime(zone)` equals the original instant.

Unknown zone → `UNKNOWN_TIMEZONE`.

## DST 2026 America/New_York

Spring forward: 2026-03-08 clocks skip `02:00`–`03:00` (second Sunday).

| Local | Policy | Requirement |
|---|---|---|
| `2026-03-08T02:30` | `reject` | `TIMEZONE_GAP` |
| same | `later` / `compatible` | a valid instant **after** the gap; wall hour ≠ 2 |
| same | `earlier` | a valid instant **before** the later one; wall hour ≠ 2 |
| `later.epochMillis > earlier.epochMillis` | | must hold |

Fall back: 2026-11-01 `01:30` occurs twice (first Sunday).

| Local | Policy | Offset |
|---|---|---|
| `2026-11-01T01:30` | `reject` | `TIMEZONE_OVERLAP` |
| same | `earlier` / `compatible` | `-04:00` |
| same | `later` | `-05:00` |
| `later.epochMillis - earlier.epochMillis` | | `3600000` |

Adding `{ days: 1 }` to a zoned value is **wall-clock** calendar math, then re-zone. `2026-03-07T12:00[America/New_York] + 1 day` stays hour 12 on March 8.

Adding `{ hours: n }` is **instant** math.

## Duration

| Input | Result |
|---|---|
| `Duration.parse('P1Y2M3DT4H5M6.789S')` | fields as written; `toISO` round-trips |
| `Duration.parse('P2W').weeks` | `2` |
| `Duration.parse('-PT90M').minutes` | `-90` |
| `Duration.parse('PT0S').isZero()` | `true` |
| `Duration.of({ hours: 2, minutes: 30 }).total('minute')` | `150` |
| `Duration.of({ months: 1 }).total('day')` | throws `INCOMPATIBLE_UNIT` |
| `Duration.parse('2 hours')` | fail |
| `Duration.parse('PT0.5H').toISO()` | `'PT30M'` |
| `Duration.parse('PT1.5M').toISO()` | `'PT1M30S'` |
| `Duration.parse('P0.5D').toISO()` | `'PT12H'` |
| `Duration.parse('P0.5W').toISO()` | `'P3DT12H'` (fractional weeks keep the sub-day remainder; no silent gain) |
| `Duration.parse('PT0.9995S').toISO()` | `'PT1S'` |
| `Duration.parse('-PT0.5H').toISO()` | `'-PT30M'` |
| `Duration.of({ milliseconds: 1800000 }).toISO()` | `'PT30M'` |
| `parse(toISO(x))` equals `x` | for every duration whose fraction carries into smaller units |

`milliseconds` is the fractional-second field and is normalized into `[−999, 999]` at construction;
overflow carries into seconds → minutes → hours (truncation, so the sign stays aligned). This is what keeps
`toISO()` / `toJSON()` exact — a millisecond count ≥ 1000 must never serialize as a `.SSS` fraction.

`Duration.tryParse` must never throw for any string, including numerically hostile inputs (a fraction with
hundreds of digits overflows `Number` and must come back as `{ ok: false }`, not an exception).

## Comparison / immutability

- `compare` is a total order per type.
- If `a < b` then `b > a`. If equal, `equals` is true.
- `date.plus({ days: n }).minus({ days: n }) === date` for integer `n` in tested range.
- `date.until(date.plus({ days: n }), 'day') === n`.
- After month arithmetic, `day <= daysInMonth(year, month)`.
- Original instance fields never change.

Calendar-unit plus/minus is **not** a group. Do not write a property that claims `plus({ months: 1 }).minus({ months: 1 }) === start` for Jan 31.

## Moment adapter (compat only)

| Call | Result |
|---|---|
| `moment(iso).add(1, 'day')` | new object; original format unchanged |
| `next.diff(m, 'day')` | `+1` (Moment sign: `this - other`) |
| `moment('2026-06-01T16:00:00Z').tz('America/New_York').format('YYYY-MM-DD HH:mm')` | `'2026-06-01 12:00'` |
| `moment('2026-01-01T00:00:00Z').unix()` | `1767225600` |
| `isValid()` | always `true` (invalid input throws instead) |

Core `until` is Temporal-shaped (`other - this`). Compat `diff` is Moment-shaped (`this - other`). Do not “unify” them.

## Formatting

| Call | Result |
|---|---|
| `format(LocalDate.of(2026,6,1), 'yyyy-MM-dd')` | `'2026-06-01'` |
| `format(same, 'dd/MM/yyyy')` | `'01/06/2026'` |
| `format(same, "yyyy-MM-dd 'ok'")` | `'2026-06-01 ok'` |
| Instant `2026-06-01T16:00:00Z` in NY, `'HH:mm XXX'` | `'12:00 -04:00'` |
| `format(LocalDateTime.of(50, 1, 1, 0, 0).toZonedDateTime('UTC'), 'EEEE', { locale: 'en-US' })` | `'Saturday'` |
| `toLocaleString(LocalDate.of(50, 1, 1), 'en-US', { year: 'numeric' })` | `'50'` |
| `format(LocalDateTime.of(2026, 1, 1, 13, 5), 'a', { locale: 'en-US' })` | `'PM'` |
| `format(same, 'a', { locale: 'zh-CN' })` | `'下午'` (day period is localized via `Intl`, not a constant) |

Civil years `0–99` must stay literal everywhere. `Date.UTC(year, …)` maps them to `1900–1999`, so weekday
and locale formatting route through the civil calendar (`daysFromCivil`) or `setUTCFullYear`, never `Date.UTC`.

`YYYY` in core is **not** a week-year token. Week-year footgun stays in the Moment adapter map (`YYYY` → `yyyy` calendar year on purpose for migration of the common case).

## Errors

`parse` throws `TempoError` with a stable `code`. `tryParse` returns `{ ok: false, reason, message, input }`. No `Invalid Date` object.
