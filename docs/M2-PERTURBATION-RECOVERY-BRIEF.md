# Neural Field Study: M2 Perturbation And Recovery Brief

**Status:** proposed protocol. This document defines no result and authorizes no
claim until the implementation, tests, and recorded run are complete.

## Question

For the currently defined abstract discrete rate field, how does a localized
perturbation change the trajectory of a field that has already settled into a
documented numerical regime?

In plain language: after the sheet has formed a stable-looking pattern, we add
one controlled extra push and measure whether the pattern returns, changes to a
different pattern, or remains measurably disturbed. This is a property of the
implemented synthetic rule, not a claim about neural recovery.

## Why This Is The Next Unit

M1A-M1C established a bounded, deterministic baseline; a predeclared small
parameter sweep; and material sensitivity of full states to boundary choice.
The next useful question is not a broader visual sweep. It is whether a visible
state has a measurable response to a precisely specified intervention under one
fixed numerical context.

## Fixed Experimental Context

Unless a later decision explicitly changes it, M2 uses:

- the accepted normalized difference-of-Gaussians rule and logistic relaxation;
- the existing torus default as the primary context;
- the existing named numerical regimes, used only as implementation-level
  descriptors;
- a declared warm-up horizon after which the perturbation is applied; and
- deterministic seeds recorded in the output artefact.

Boundary sensitivity is not erased by this choice. At least one follow-up check
must repeat the protocol under a non-periodic mode and report state differences
rather than treating matching coarse labels as robustness.

## Predeclared Protocol

1. Select two existing configurations from the M1 sweep: one broad-activation
   case and one persistent-spatial-structure case. Do not select them from a
   visual search after seeing M2 output.
2. Run each unperturbed configuration to a documented warm-up horizon.
3. From the identical warm-up state, run a paired control and a perturbed replay.
   The perturbation must be a localized additive change with declared centre,
   spatial radius, amplitude, duration, and clipping or update semantics.
4. Repeat every paired replay across the declared seed set. The control and
   intervention for one seed must share the same initial state and all other
   parameters.
5. Measure the difference between paired states over time, without relabelling
   the outcome as a biological event.

## Required Measurements

For each paired replay, record:

- full-field mean absolute difference from the unperturbed control;
- an explicitly defined spatially restricted difference around the intervention
  site, using toroidal distance when the torus mode is active;
- time to fall below a predeclared difference threshold, if it occurs within the
  observation horizon;
- mean, spatial standard deviation, total variation, and last-step change for
  both paths; and
- a final-state comparison at the fixed horizon.

The report must distinguish an observed return below the threshold from a run
that simply ended before doing so. It must not use “recovery,” “resilience,” or
“stability” as unqualified scientific conclusions.

## Acceptance Criteria

M2 is complete only when:

1. The perturbation operator has deterministic tests, including a zero-amplitude
   identity case and a localisation test.
2. Paired control/intervention runs are reproducible byte-for-byte under a fixed
   seed and configuration.
3. Metrics and thresholds are declared in code before the result table is
   accepted.
4. The output contains all selected configurations and seeds, including null or
   non-settling results.
5. One non-torus sensitivity check is recorded with the same protocol.
6. Documentation states that every finding concerns the defined synthetic,
   discrete system at the recorded horizon.

## Deliverables

- `src/perturbation.js` or an equivalent narrow, tested implementation module.
- A deterministic paired-replay script that writes a versioned JSON artefact.
- Tests for the operator, paired replay determinism, and metric invariants.
- `docs/perturbation-recovery-results.md` containing the exact configuration,
  result table, interpretation boundary, and limitations.
- A project-local decision note explaining the perturbation semantics.

## Publication Threshold

This unit is eligible for an article or animated research surface only when the
result table and limitations exist. The appropriate public statement is narrow,
for example: “Under this documented synthetic field rule, a localized
perturbation produced a measurable paired trajectory difference that [did/did
not] fall below the predeclared threshold within the recorded horizon.”

It is not evidence about neural tissue, disease, cognition, or a general theory
of resilience.
