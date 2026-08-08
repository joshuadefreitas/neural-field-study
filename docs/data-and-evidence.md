---
type: data-and-evidence
status: active
scope: synthetic state and result interpretation
---

# Data and Evidence

## Synthetic State Contract

The study has no biological dataset. Its state is a 72 by 48 periodic lattice of scalar values in `[0, 1]`, initialized by a deterministic local pulse plus low-amplitude seeded noise. An optional local inhibitory intervention is an explicit input to the same rule.

The activity values are numerical variables. They are not measured firing rates, membrane potentials, diagnoses, or clinical predictions.

## Evidence Layers

| Layer | What it establishes |
| --- | --- |
| Deterministic tests | Replay, bounds, tick semantics, finite state, and intervention sensitivity. |
| Numerical audit | Properties of one declared configuration under step-size, resolution, and seed checks. |
| Parameter sweep | Descriptive behavior over a small predeclared grid. |
| Browser study | A visible, interactive rendering of the same synthetic state contract. |
| References | Conceptual lineage, not validation of this implementation. |

## Interpreting Results

The study may make claims about the defined discrete system, its parameters, and its observed numerical behavior. It may not claim to model neural tissue, establish a biological mechanism, or generalize to neural recordings. A result that looks visually compelling remains illustrative until it survives the stated audit and is described with its numerical limitations.

## Reproducibility

```bash
npm test
npm run --silent audit
npm run --silent sweep
```

The audit and sweep output JSON to standard output. Record the configuration alongside any future article figure or interpretation.
