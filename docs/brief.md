# Study Brief

## Question

How do local excitation, inhibition, and topology shape the propagation, stabilization, and decay of activity in a reproducible neural field?

## Model

The current proof uses a discrete rate field inspired by the neural-field literature. Each cell stores a scalar activity value `u` in `[0, 1]`. A difference-of-Gaussians interaction kernel creates short-range excitation and longer-range inhibition. Each Gaussian lobe is normalized on the finite lattice before its strength is applied:

```text
input(x) = sum(kernel(dx, dy) * u(x + dx, y + dy))
target(x) = sigmoid(responseSlope * (input(x) - intervention(x) - threshold))
next(x) = (1 - dt) * u(x) + dt * target(x)
```

The lattice wraps at its boundaries. This makes the first proof deterministic and avoids artificial walls while keeping the update rule easy to inspect.

The field formulation is informed by the lateral-inhibition neural-field tradition documented in [`references/README.md`](references/README.md). This implementation is not a direct reproduction: it uses a discrete update, synthetic inputs, and visually inspectable parameters. The centre cell is included as an ordinary kernel sample; it is not given a separate compensating self-feedback weight.

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

## Evidence boundary

The deterministic tests establish properties of this implementation: replay consistency, bounded finite states, tick semantics, and a measurable intervention effect. They do not establish correspondence with neural measurements or biological mechanisms. See [`references/README.md`](references/README.md) for the cited model precedent and explicit claim boundary.

## Expansion gates

Before adding complexity, the next study should verify stability across grid resolutions and parameter regimes. Later work may compare topologies, add public neural data, introduce replay exports, or evaluate an approved engine-powered adapter. Those are separate decisions, not part of this first proof.
