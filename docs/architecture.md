---
type: architecture
status: active
scope: browser-executable synthetic rate field
---

# Architecture

## System Shape

```text
index.html + styles.css
        |
        v
src/app.js  ---- browser controls, replay loop, canvas rendering
        |
        v
src/neural-field.js ---- field state, normalized DoG kernel, update rule
        |
        +--> src/audit-metrics.js ---- derived numerical summaries
        |
        +--> scripts/*.mjs --------- reproducible audit and sweep JSON
```

## Module Contracts

| Module | Responsibility | Contract |
| --- | --- | --- |
| `neural-field.js` | Creates state, constructs the normalized kernel, applies one update, and validates state bounds. | Same configuration and seed produce the same trajectory. |
| `app.js` | Owns browser controls, canvas rendering, replay state, and optional intervention placement. | It renders the state returned by `stepField`; it does not invent simulation facts. |
| `audit-metrics.js` | Calculates derived summaries such as mean activity, peak, variation, and change. | Metrics describe this finite lattice only. |
| `scripts/numerical-audit.mjs` | Produces the reproducible default numerical report. | JSON output; no repository mutation. |
| `scripts/regime-sweep.mjs` | Runs the predeclared parameter grid. | Labels are numerical descriptions, not biological categories. |
| `tests/` | Checks determinism, bounds, intervention effects, kernel balance, and audit calculations. | Passing tests do not prove biological validity. |

## Update Path

At each tick, the field samples its periodic lattice through the normalized difference-of-Gaussians kernel, applies a sigmoid response, then relaxes toward that response. The canvas uses the resulting scalar field and derived summaries. The audit scripts reuse the same implementation rather than reconstructing the rule independently.

## Extension Boundary

Future topology, public-data, or GPU work must preserve this separation: model state and update semantics in the core module; visual presentation in the browser layer; numerical claims in reproducible scripts and documentation. Public code must remain independent of private Lathilda/Ghalvera source and packages.
