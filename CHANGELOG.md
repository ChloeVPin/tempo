# Changelog

## Unreleased

- Agent takeover pack: `AGENTS.md`, `docs/HANDOFF.md`, `docs/STATUS.md`, `docs/INVARIANTS.md`, `docs/WORK-PACKAGES.md`. Architecture doc reconciled with `src/`.

## 0.1.0 — 2026-08-14

First public kernel.

- Immutable Temporal-aligned types: `Instant`, `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Duration`
- Strict ISO 8601 / RFC 3339 parsing (`parse` / `tryParse`)
- Howard Hinnant civil calendar
- Overflow policies `constrain` | `reject`
- Intl-first IANA time zones with DST disambiguation
- Token formatter, locale formatting, relative time
- Optional Moment compatibility adapter
- Feature-detected Temporal interop
- Vitest unit, property, and golden tests
- GitHub Actions on Node 20/22/24
