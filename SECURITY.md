# Security

Tempo treats parsing as a security boundary.

## Guarantees we aim for

- No `eval` or dynamic code execution
- No filesystem locale or timezone loading in core
- No unbounded regular expressions in parsers (hand-written scanners / anchored patterns)
- Invalid input is rejected; we do not produce “invalid date” objects
- Zero runtime dependencies in the published kernel

## Reporting

Open a private GitHub security advisory on [ChloeVPin/tempo](https://github.com/ChloeVPin/tempo) or email the maintainer listed in `package.json`.
