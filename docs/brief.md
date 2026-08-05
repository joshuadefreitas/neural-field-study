# Study Brief

## Question

How do local excitation, inhibition, and topology shape the propagation, stabilization, and decay of activity in a reproducible neural field?

## Model

The current proof uses a discretized Amari-style field. Each cell stores a scalar activity value `u` in `[0, 1]`. A difference-of-Gaussians interaction kernel creates short-range excitation and longer-range inhibition:

```text
input(x) = sum(kernel(dx, dy) * u(x + dx, y + dy))
next(x)  = clamp(u(x) + dt * (-decay * u(x) + gain * tanh(input(x) + seed(x) - intervention(x))))
```

The lattice wraps at its boundaries. This makes the first proof deterministic and avoids artificial walls while keeping the update rule easy to inspect.

## Minimum proof

1. The same seed produces the same state sequence.
2. Every update advances the tick exactly once.
3. Values remain finite and bounded.
4. A localized inhibitory intervention changes the trajectory.
5. The browser renders the same state contract that the tests exercise.

## Known limitations

- The model is not a biological brain model.
- Parameters are chosen for an inspectable visual regime, not fitted to biological measurements.
- Periodic boundaries remove edge effects but do not represent cortical anatomy.
- The current proof does not establish biological validity or clinical relevance.

## Expansion gates

Before adding complexity, the next study should verify stability across grid resolutions and parameter regimes. Later work may compare topologies, add public neural data, introduce replay exports, or evaluate an approved engine-powered adapter. Those are separate decisions, not part of this first proof.
