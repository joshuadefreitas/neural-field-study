# References And Evidence Boundary

## What this study is

This repository is a deterministic, synthetic neural-field study. Its update rule is **Amari-style**: it uses local field activity and a difference-of-Gaussians interaction kernel to create short-range excitation and longer-range inhibition. It is not a reproduction, parameter fit, or validation of a specific biological experiment.

The formal model, notation, parameter boundary, and non-goals are documented in [`../brief.md`](../brief.md). The source implementation is in [`../../src/neural-field.js`](../../src/neural-field.js).

## Source ledger

### Amari (1977) - neural-field precedent

Amari, Shun-ichi. 1977. "Dynamics of Pattern Formation in Lateral-Inhibition Type Neural Fields." *Biological Cybernetics* 27: 77-87. https://doi.org/10.1007/BF00337259

- **Type:** primary research paper.
- **Project use:** conceptual precedent for a continuous neural field with lateral inhibition and pattern-forming dynamics.
- **Supports:** describing this study's rule as Amari-style and motivating the excitatory/inhibitory field framing.
- **Does not support:** any claim that this discrete implementation reproduces the paper's dynamics, models cortical anatomy, fits neural recordings, or has clinical relevance.

The machine-readable record is available in [`references.bib`](references.bib).

### Coombes (2005) - patterns in neural fields

Coombes, Stephen. 2005. "Waves, Bumps, and Patterns in Neural Field Theories." *Biological Cybernetics* 93: 91-108. https://doi.org/10.1007/s00422-005-0574-y

- **Type:** scholarly review.
- **Project use:** context for the types of spatial dynamics that neural-field models can be used to analyze.
- **Supports:** the vocabulary of bumps, waves, and patterns as a mathematical-neural-field tradition.
- **Does not support:** asserting that any current visual pattern belongs to one of those categories without a project-defined classifier and numerical audit.

### Bressloff (2012) - mathematical neural-field review

Bressloff, Paul C. 2012. "Spatiotemporal Dynamics of Continuum Neural Fields." *Journal of Physics A: Mathematical and Theoretical* 45: 033001. https://doi.org/10.1088/1751-8113/45/3/033001

- **Type:** scholarly review.
- **Project use:** context for non-local coupling, continuum assumptions, and numerical or analytical study of spatially extended neural fields.
- **Supports:** documenting the distinction between a continuum neural-field model and this finite discrete implementation.
- **Does not support:** treating the current code as a continuum limit, an analytically solved system, or a biological validation.

## Evidence classes

- **Observed:** deterministic test results for replay, bounds, tick semantics, finite values, and intervention effect.
- **Derived:** activity mass, peak activity, and the visual state produced by the documented update rule.
- **Illustrative:** the browser visualization and all synthetic field patterns.
- **Limitation:** the model is not biologically fitted or validated; its parameters target an inspectable computational regime.

## Reproducibility

Run `npm test` for the deterministic checks. Serve the repository with `python3 -m http.server 4179` and open the local study to inspect the same state surface described by the tests.
