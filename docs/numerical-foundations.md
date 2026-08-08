# Numerical Foundations

## The study in plain language

Imagine a sheet of small cells. A cell that is active can encourage nearby cells, while activity over a wider surrounding area can restrain it. We place one small spark in the sheet and ask what the rule does next: does the spark fade, settle into a persistent shape, or activate a larger bounded region?

This is a study of a mathematical rule for spatial pattern formation. It is inspired by neural-field theory, but it is not a simulation of an individual brain, a clinical model, or a fit to neural recordings.

## Current discrete system

Let `u_i^n` denote the activity of grid cell `i` at step `n`. By default the grid is a 72 by 48 **torus**: crossing one edge re-enters at the opposite edge. The boundary condition is configurable; see the M1C section below for the four supported modes. Every activity value is stored in the interval `[0, 1]`.

For every finite-grid offset `d`, including the centre, the spatial kernel is:

```text
w(d) = a_e g_e(d) / sum_k g_e(k)
     - a_i g_i(d) / sum_k g_i(k)

g_s(d) = exp(-||d||^2 / (2 sigma_s^2))
```

where `sigma_e` is the short-range excitation scale, `sigma_i` is the broader inhibition scale, and `a_e` and `a_i` set their respective strengths. Normalizing each finite Gaussian lobe means those strengths remain interpretable when the grid or kernel radius changes. The centre is included as an ordinary sample of the kernel; no separate zero-sum correction is added.

The interaction at cell `i` under boundary mode `b` is:

```text
J_i^n = sum_d w(d) sample_b(u^n, i+d)
```

where `sample_b` is the boundary sampler for mode `b` (see below).

An optional localized intervention is:

```text
I_i = s exp(-||i - q||^2 / (2 r^2))
```

where `q` is its centre, `r` its radius, and `s` its strength. The update currently implemented is:

```text
T_i^n = sigmoid(responseSlope * (J_i^n - I_i - threshold))
u_i^(n+1) = (1 - dt)u_i^n + dt T_i^n
```

The initial state is a localized pulse plus deterministic low-amplitude noise.

## What the variables mean here

`u` is a bounded numerical activity variable in this project. It should not yet be described as a measured firing rate, membrane potential, or biological quantity. `sigmoid` is a chosen response curve, and the update relaxes toward its output. With `0 < dt <= 1`, this convex combination keeps the numerical state in `[0, 1]` without a hard boundary projection.

This differs from many continuum neural-field formulations, which commonly distinguish a field variable from a separate firing-rate response function. The project therefore uses the phrase **Amari-style** only as a statement of conceptual lineage, not equivalence.

## Why a numerical audit comes first

The prior hard-clamped rule was found to be unsuitable: its finite-kernel zero-sum correction created a large artificial self-feedback term and drove the field into a binary fixed point. The current rule replaces that mechanism, but visually convincing patterns can still be driven partly by numerical choices. In particular:

- a finite difference-of-Gaussians kernel depends on radius and discretization;
- a result on one grid, one time step, or one boundary condition may not transfer to another.

Before making a scientific result public, we must determine which behavior survives those choices.

## M1 numerical protocol

### 1. Instrument the baseline

For each run, record total activity, mean, peak, fraction of cells numerically near the lower and upper bounds, spatial variance, and a simple measure of occupied area. These are **derived** measurements of the defined system.

Run `npm run --silent audit` to generate the current reproducible baseline report as JSON. The command does not mutate the repository.

### 2. Check numerical sensitivity

Hold physical run duration fixed while varying `dt`. Compare representative runs at more than one grid resolution and kernel radius. Repeat the same configuration with all four boundary modes and compare to the torus baseline using the boundary audit (see M1C below).

### 3. Establish a model decision

The model decision is recorded: this is an abstract discrete rate field, with a normalized kernel and an explicit response function. It is a mathematically inspectable system, not a biological fit. Any later change to kernel normalization, response curve, or boundary conditions starts a new audit baseline.

### 4. Predefine the first sweep

The first fixed sweep varies inhibition strength (`0.8`, `1.0`, `1.2`) and threshold (`0.05`, `0.10`, `0.15`) across seeds `3`, `17`, and `31`, at a dimensionless horizon of `24`. It records mean activity, spatial standard deviation, total variation, and last-step change. The classifier is fixed in [`scripts/regime-sweep.mjs`](../scripts/regime-sweep.mjs): **low activity**, **persistent spatial structure**, **broad activation**, or **unsettled or seed-sensitive**. These are descriptions of this implementation, not biological states.

Run `npm run --silent sweep` to emit the full result table as JSON. No parameter regime may be omitted from the future article merely because it is visually uninteresting.

## M1C boundary abstraction

### Four supported modes

| Mode key | `sample_b` rule |
|---|---|
| `torus` | Wrap both axes: `x mod W`, `y mod H`. **Default.** |
| `zero` | Return `0` for any out-of-lattice offset. |
| `replicate` | Clamp `x` to `[0, W-1]` and `y` to `[0, H-1]`; return the value at the clamped position. |
| `cylinder` | Wrap `x`; zero-pad `y`. |

Exactly one mode is active per run. The default is `torus`, which reproduces all prior results. Changing the mode starts a new numerical context and must be documented as such.

### Comparison semantics

The boundary audit (`npm run --silent boundary-audit`) runs all four modes from the same initial state, kernel, seed, and horizon. It reports:

- per-mode full summary: mean, standard deviation, active fraction, lower- and upper-bound fractions, mean step change, non-wrapping total variation, core mean, edge mean;
- whole-field mean absolute difference from the torus baseline;
- core mean absolute difference from the torus baseline (interior cells only, `edgeMargin = kernel radius = 8`);
- regime-label agreement across the 3 × 3 parameter sweep defined in `scripts/regime-sweep.mjs`, using the same classifier inlined verbatim.

**Non-wrapping total variation** excludes the wrap-around cell pair on any axis that does not wrap under the active mode. This avoids an artificial spatial-gradient contribution at the lattice edge for non-periodic boundaries.

**Core vs. edge activity** is always reported. The edge zone is defined by `edgeMargin = kernel radius (8)`, the width at which boundary-sampler differences have had direct influence on the kernel convolution. The partition is boundary-aware: only non-periodic axes contribute to the edge zone.

- **torus** (`periodic.x = true, periodic.y = true`): no axis has a physical edge, so no cell is ever edge. `edgeMean` is `null`; `coreMean` equals the whole-field mean. Core cell count: 3456 (all cells).
- **cylinder** (`periodic.x = true, periodic.y = false`): only the top and bottom bands of height 8 are edge. Columns near the x-boundary are **not** edge because x wraps. Core cell count: 72 × 32 = 2304 cells.
- **zero / replicate** (`periodic.x = false, periodic.y = false`): a rectangular band 8 cells wide on all four sides is edge. Core cell count: 56 × 32 = 1792 cells (x ∈ [8, 63], y ∈ [8, 39]).

For periodic (torus) boundaries the core/edge distinction carries no spatial-asymmetry information; for non-periodic modes it records whether activity concentrates differently near the physical lattice boundary.

### Strict claim limits for boundary comparisons

A difference in whole-field MAD or regime label between boundary modes is evidence about the discrete rule on this synthetic lattice. It is not:

- evidence about the sensitivity of neural tissue to boundary geometry;
- a convergence proof that the boundary-free continuum limit exists or has been approximated; or
- a claim that any one boundary mode is biologically more accurate than another.

Any article claim that references boundary sensitivity must be phrased as: *the defined discrete rule, at this configuration and horizon, produced [X] under the torus default and [Y] under mode [M].*

## Acceptance criteria for a first article

1. The plain-language question, equation, code, and interactive surface describe the same system.
2. Near-boundary occupancy and resolution sensitivity are measured and reported.
3. The parameter protocol and classifier are deterministic and rerunnable.
4. At least one result is stable enough under the documented numerical checks — time-step sensitivity, resolution comparison, seed repetition, and boundary comparison — to be called a finding about this discrete system.
5. The article states the biological and interpretive limits, including that boundary mode comparisons are numerical, not anatomical.

## References

See [`references/README.md`](references/README.md) and [`references/references.bib`](references/references.bib). The additional reviews by Coombes (2005) and Bressloff (2012) provide context for waves, bumps, patterns, and mathematical analysis of continuum neural fields; they do not validate this implementation.
