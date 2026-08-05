# Neural Field Study

An executable computational-neuroscience study of how local excitation, inhibition, and topology shape activity propagation through a reproducible field.

**Status:** first deterministic proof

**Model:** discretized Amari-style neural field with a difference-of-Gaussians kernel

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
- A bounded rectifier after each update.
- A localized inhibitory intervention that changes the trajectory.
- A browser canvas showing activity mass, peak activity, and replayable ticks.

The model is intentionally modest. It demonstrates a reproducible field and an intervention surface before adding public biological data, richer topology, or GPU acceleration.

## Evidence

The test suite checks deterministic replay, state bounds, tick semantics, finite values, and intervention effect. The browser study is the visual evidence surface. Scientific interpretation is limited to the behavior of this synthetic rule system.

See [`docs/brief.md`](docs/brief.md) for the model, non-goals, and expansion gates.

## Public boundary

This repository is independently runnable and does not depend on private Lathilda/Ghalvera source, packages, repositories, or internal evidence.
