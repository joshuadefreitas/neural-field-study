# Public Study Page Template

## Purpose

This is the reusable editorial and interaction structure for Joshua de Freitas's
public studies. The Neural Field Study is the reference implementation. Future
studies should reuse its hierarchy and visual language while allowing the
study's real evidence—not decorative branding—to supply the distinctive image.

The governing sequence is **Orient → Explore → Inspect**.

## Page structure

### 1. Orient: question before machinery

Lead with one question a curious non-specialist can understand. Define the
mechanism in ordinary nouns and verbs before introducing its formal name.

Required content:

- one question-led heading;
- one short explanation of the mechanism;
- one explicit sentence saying what the study is not;
- four compact facts: question, system, status and claim boundary.

#### Explain the idea in one minute

Use exactly three causal steps. Each step should explain one change in the
system and what follows from it. An analogy is optional and limited to one; it
must clarify the mechanism rather than decorate it.

### 2. Explore: one meaningful intervention

The primary visual must expose real model or data state. Controls should be
reversible, plainly labelled and tied to a question the visitor can answer by
using them. Explain every displayed metric in everyday language.

#### State one finding and one limit

State the most useful result in one sentence, then explain the evidence behind
it. Place the strongest interpretation limit beside the finding rather than in
a distant README.

### 3. Inspect: depth on demand

Keep equations, parameters, commands, references and audit links available in
an expandable technical record. Technical depth remains first-class; it is no
longer the price of entry.

## Copy test

Before publication, ask:

1. Can a thoughtful reader explain the question after thirty seconds?
2. Does every specialist term arrive after its plain-language meaning?
3. Is there one finding, one limit and one next question?
4. Could any sentence be removed without losing information because it exists
   mainly to sound rigorous? If yes, remove or rewrite it.
5. Does the page sound like a careful practitioner rather than an institution
   writing about itself?

## Visual contract

- Reuse the portfolio's neutral paper, ink, silver-edge and dark-theme system.
- Use the same Newsreader, Inter and DM Mono roles.
- Keep one dominant question, one primary evidence surface and quiet supporting
  sections.
- Let colour appear only when it carries study information. A new project does
  not receive a new website theme by default.
- Preserve keyboard operation, visible focus, reduced motion, mobile layout and
  a useful non-interactive reading path.

## Implementation checklist

- Mark the page layers with `data-study-layer="orient"`, `"explore"` and
  `"inspect"`.
- Keep one `h1` and a logical heading order.
- Retain stable IDs for interactive controls and cover them with a page-contract
  test.
- Store fonts and critical assets locally, with the required licence texts in
  the same repository.
- Link the finding to the detailed record and the repository.
- Run the study's numerical tests separately from the page-contract tests.
