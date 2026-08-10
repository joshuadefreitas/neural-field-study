# Decision 0002: Use a shared question-first study page system

## Status

Accepted

## Date

2026-08-10

## Context

The original Neural Field page exposed a polished simulation but introduced the
work through terms such as excitation, topology, propagation and
difference-of-Gaussians. Those terms were accurate, yet they asked readers to
understand the machinery before understanding the question. Its dark teal and
orange interface also read as a separate product rather than part of the public
portfolio.

Future studies need a consistent structure that works for non-specialists
without removing the equations, audits and reproducibility record needed by
technical readers.

## Decision

Public study pages will use a shared **Orient → Explore → Inspect** structure:

1. a question-first orientation and plain-language model;
2. one bounded interactive experiment;
3. one finding beside one explicit claim limit; and
4. an expandable technical record with equations, parameters and commands.

The visual shell reuses the portfolio's neutral typography, theme tokens and
silver structural edges. Study-specific visuals may diverge only when the
encoding carries information.

The Neural Field Study is the first reference implementation. The reusable copy
and layout contract is recorded in [`../STUDY-PAGE-TEMPLATE.md`](../STUDY-PAGE-TEMPLATE.md).

## Alternatives considered

### Keep every study visually independent

This gives each project a distinctive identity, but fragments the portfolio and
makes every new study pay the cost of inventing another interface.

### Put all technical material directly on the page

This maximizes immediate detail but repeats the original problem: specialist
language becomes the entrance requirement.

### Remove technical depth in favour of a short case study

This improves accessibility by weakening the evidence surface. It was rejected.
The technical record remains available on the same page and in repository docs.

## Consequences

- Future studies begin from a tested editorial hierarchy instead of a blank page.
- Readers can understand the question before deciding whether to inspect the math.
- The portfolio and study pages share a recognizable visual identity.
- Each study still requires original evidence, interaction and claim limits; the
  template does not make unrelated projects interchangeable.
- Page contracts must be updated when the shared structure changes.

