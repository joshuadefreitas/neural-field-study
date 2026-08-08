# Neural Field Study

An executable computational-neuroscience study of how local excitation, inhibition, and topology shape activity propagation through a reproducible field.

**Status:** first deterministic proof

**Model:** discretized rate field with a normalized difference-of-Gaussians kernel

**Scope:** synthetic systems research and visual exploration, not clinical or biological prediction

**Live study:** [joshuadefreitas.github.io/neural-field-study](https://joshuadefreitas.github.io/neural-field-study/)

## Run it

No package installation is required for the browser study:

```bash
python3 -m http.server 4179
```

Open <http://localhost:4179>.

Run the deterministic checks with Node.js:

```bash
npm test
```

## The first proof

The study keeps one small system inspectable:

- A fixed 2D lattice with periodic boundaries.
- Short-range excitation and longer-range inhibition.
- A seeded initial pulse with deterministic noise.
- A sigmoid response and convex relaxation step that keep activity in `[0, 1]` without hard clipping.
- A localized inhibitory intervention that changes the trajectory.
- A browser canvas showing activity mass, peak activity, and replayable ticks.

The model is intentionally modest. It demonstrates a reproducible field and an intervention surface before adding public biological data, richer topology, or GPU acceleration. Its relationship to classical neural fields is conceptual, not a claim that this is a fitted biological model.

## Evidence

The test suite checks deterministic replay, state bounds, tick semantics, finite values, and intervention effect. The browser study is the visual evidence surface. Scientific interpretation is limited to the behavior of this synthetic rule system.

Start with the [documentation map](docs/README.md). The [architecture](docs/architecture.md) explains the browser and simulation code path; [data and evidence](docs/data-and-evidence.md) explains the synthetic-state contract and result limits. [`docs/brief.md`](docs/brief.md) gives the model and non-goals, while [`docs/numerical-foundations.md`](docs/numerical-foundations.md), [`docs/numerical-audit-results.md`](docs/numerical-audit-results.md), and [`docs/regime-sweep-results.md`](docs/regime-sweep-results.md) record the mathematical and numerical evidence. The formal source ledger is in [`docs/references/`](docs/references/).

## Public boundary

This repository is independently runnable and does not depend on private Lathilda/Ghalvera source, packages, repositories, or internal evidence.
