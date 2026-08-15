# Docs index

Start here only if you are a human browsing. **Agents start at [`../AGENTS.md`](../AGENTS.md).**

| File | Read it for |
|---|---|
| [HANDOFF.md](HANDOFF.md) | Current truth, gaps, how to take over |
| [STATUS.md](STATUS.md) | File-by-file implementation status |
| [INVARIANTS.md](INVARIANTS.md) | Behaviors that must not change |
| [WORK-PACKAGES.md](WORK-PACKAGES.md) | Sequenced next work |
| [DESIGN.md](DESIGN.md) | Why the API looks like this |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module layout (must match `src/`) |
| [ROADMAP.md](ROADMAP.md) | Phases and decision log |
| [API.md](API.md) | Public API sketch |
| [MIGRATION.md](MIGRATION.md) | Moment → Tempo |
| [TESTING.md](TESTING.md) | Test philosophy |
| [RESEARCH.md](RESEARCH.md) | Background only — not an implementation spec |

Rule: `src/` + tests + INVARIANTS beat any narrative doc. If you change behavior, update INVARIANTS in the same commit.
