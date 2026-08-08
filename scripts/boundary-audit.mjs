import { DEFAULTS, createField, stepField } from "../src/neural-field.js";
import { BOUNDARY_MODES, resolveBoundary } from "../src/boundary.js";
import {
  meanAbsoluteDifference,
  coreMeanAbsoluteDifference,
  summarizeAudit,
} from "../src/audit-metrics.js";

const base = { ...DEFAULTS };
const horizon = 24;
const ticks = Math.round(horizon / base.dt);

// edgeMargin equals the kernel radius so the core region is the part of the
// field where the boundary sampler has had no direct influence on the
// convolution. For the default configuration this is 8 cells on non-periodic
// axes. For torus (both axes periodic) the concept of an edge zone does not
// apply and every cell is considered interior.
const edgeMargin = base.radius; // 8

// The sweep uses a single seed (17, the default) rather than the three seeds
// in regime-sweep.mjs. Repeating all three seeds × 4 modes × 9 points × 160
// ticks makes the script impractical to run routinely. Using seed=17 cuts the
// cost by 3× while still revealing boundary-induced label differences at each
// parameter point. A full three-seed boundary sweep should be run separately
// when a result appears boundary-sensitive.
const sweepSeed = 17;
const inhibitionStrengths = [0.8, 1, 1.2];
const thresholds = [0.05, 0.1, 0.15];

function advance(config) {
  let state = createField(config);
  let previous = null;
  const runTicks = Math.round(horizon / (config.dt ?? base.dt));
  for (let tick = 0; tick < runTicks; tick += 1) {
    previous = state;
    state = stepField(state, config);
  }
  return { state, previous };
}

function rounded(value) {
  return Number(value.toFixed(6));
}

function compact(summary) {
  return Object.fromEntries(
    Object.entries(summary).map(([key, value]) => [
      key,
      typeof value === "number" ? rounded(value) : value,
    ]),
  );
}

// Classifier identical to the one in regime-sweep.mjs. It is inlined here so
// that the boundary audit can assign regime labels without importing a script
// that is not structured as a module. Any change to the classifier must be
// applied to both files and the change documented as a new audit baseline.
function avg(summaries, key) {
  return summaries.reduce((sum, s) => sum + s[key], 0) / summaries.length;
}

function classify(summaries) {
  const mean = avg(summaries, "mean");
  const standardDeviation = avg(summaries, "standardDeviation");
  const stepChange = avg(summaries, "meanStepChange");
  const maxMeanDeviation = Math.max(
    ...summaries.map((s) => Math.abs(s.mean - mean)),
  );

  if (mean <= 0.15 && standardDeviation <= 0.05) return "low-activity";
  if (mean >= 0.85 && standardDeviation <= 0.05) return "broad-activation";
  if (
    standardDeviation >= 0.12 &&
    stepChange <= 0.0025 &&
    maxMeanDeviation <= 0.02
  ) {
    return "persistent-spatial-structure";
  }
  return "unsettled-or-seed-sensitive";
}

// ── Default-configuration comparison ────────────────────────────────────────
// Same seed, same horizon, same kernel and response parameters for every mode;
// only the boundary sampler differs. Torus is the existing default and the
// comparison baseline.
//
// coreMeanAbsoluteDifferenceFromTorus uses the variant mode's periodic axes to
// define the core region: for cylinder only y-axis rows within edgeMargin are
// excluded; for planar modes (zero, replicate) a rectangular band on all four
// sides is excluded. For torus there are no physical edges so the whole field
// is interior.

const defaultRuns = BOUNDARY_MODES.map((boundary) => {
  const { state, previous } = advance({ ...base, boundary });
  return {
    boundary,
    state,
    periodic: resolveBoundary(boundary).periodic,
    summary: summarizeAudit(state, previous, { boundary, edgeMargin }),
  };
});

const defaultTorusState = defaultRuns.find((r) => r.boundary === "torus").state;

const defaultComparison = defaultRuns.map((run) => {
  const isTorus = run.boundary === "torus";
  return {
    boundary: run.boundary,
    summary: compact(run.summary),
    wholeFieldMeanAbsoluteDifferenceFromTorus: isTorus
      ? 0
      : rounded(meanAbsoluteDifference(run.state, defaultTorusState)),
    // Core region defined by the variant mode's non-periodic axes and edgeMargin.
    // Torus has no physical edges; its coreMeanAbsoluteDifference equals the
    // whole-field value (all cells interior). For cylinder, only y-axis rows
    // within edgeMargin are excluded. For planar modes, a rectangular band on
    // all four sides is excluded.
    coreMeanAbsoluteDifferenceFromTorus: isTorus
      ? 0
      : rounded(
          coreMeanAbsoluteDifference(
            defaultTorusState,
            run.state,
            edgeMargin,
            run.periodic,
          ),
        ),
  };
});

// ── 3 × 3 parameter sweep — boundary comparison ──────────────────────────────
// For every sweep point, all four boundary modes run under the same seed and
// horizon. The torus classification is the reference; label agreement is
// reported for each alternative mode. Per-mode summaries include boundary-aware
// coreMean and edgeMean using edgeMargin = kernel radius.

const sweepComparison = [];
for (const inhibitionStrength of inhibitionStrengths) {
  for (const threshold of thresholds) {
    const point = { inhibitionStrength, threshold };
    const perMode = {};

    for (const boundary of BOUNDARY_MODES) {
      const config = { ...base, boundary, inhibitionStrength, threshold, seed: sweepSeed };
      const { state, previous } = advance(config);
      const summary = summarizeAudit(state, previous, { boundary, edgeMargin });
      perMode[boundary] = {
        classification: classify([summary]),
        summary: compact(summary),
      };
    }

    const torusLabel = perMode.torus.classification;
    const labelAgreement = Object.fromEntries(
      BOUNDARY_MODES.map((m) => [m, perMode[m].classification === torusLabel]),
    );

    sweepComparison.push({
      config: point,
      torusClassification: torusLabel,
      labelAgreement,
      allModesAgree: Object.values(labelAgreement).every(Boolean),
      perMode,
    });
  }
}

const totalSweepPoints = sweepComparison.length;
const agreementPoints = sweepComparison.filter((p) => p.allModesAgree).length;

console.log(
  JSON.stringify(
    {
      purpose:
        "Boundary-condition audit comparing the periodic torus default against zero-padded planar, replicate-edge planar, and x-periodic/y-zero cylindrical variants under identical configuration, seed, and horizon.",
      protocol: {
        horizon,
        ticks,
        edgeMargin,
        edgeMarginNote:
          "edgeMargin equals the kernel radius (8). For torus (both axes periodic) every cell is interior. For cylinder (x periodic, y non-periodic) only rows within 8 of top or bottom are edge. For planar modes a rectangular band 8 wide on all four sides is edge.",
        defaultConfig: base,
        modes: BOUNDARY_MODES,
        comparisonBaseline: "torus",
        sweepNote:
          "Single seed (17) used in the sweep for performance. A full three-seed boundary sweep should be run separately if a result appears boundary-sensitive.",
        sweepSeed,
        sweepAxes: {
          inhibitionStrengths,
          thresholds,
        },
        classifierReference:
          "scripts/regime-sweep.mjs — inlined verbatim; any divergence is a defect",
      },
      defaultConfigComparison: defaultComparison,
      parameterSweepComparison: {
        summary: {
          sweepPoints: totalSweepPoints,
          allModesAgreeCount: agreementPoints,
          allModesAgreeFraction: rounded(agreementPoints / totalSweepPoints),
          warning:
            "Regime-label agreement does not imply state-level boundary robustness. Modes that agree on a label can still produce materially different field states (large coreMeanAbsoluteDifferenceFromTorus in the default comparison). The label is a coarse numerical classifier; the MAD is the quantitative sensitivity measure.",
        },
        points: sweepComparison,
      },
      interpretationBoundary:
        "This reports numerical sensitivity of the defined discrete rule to boundary handling on this synthetic lattice. It does not assign biological or anatomical meaning to any boundary choice. Regime labels describe numerical behavior of this code, not biological states.",
    },
    null,
    2,
  ),
);
