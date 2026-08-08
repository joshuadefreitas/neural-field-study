import { DEFAULTS, createField, stepField } from "../src/neural-field.js";
import { summarizeAudit } from "../src/audit-metrics.js";

const seeds = [3, 17, 31];
const horizon = 24;
const inhibitionStrengths = [0.8, 1, 1.2];
const thresholds = [0.05, 0.1, 0.15];

function advance(config) {
  let state = createField(config);
  let previous = null;
  const ticks = Math.round(horizon / config.dt);
  for (let tick = 0; tick < ticks; tick += 1) {
    previous = state;
    state = stepField(state, config);
  }
  return summarizeAudit(state, previous);
}

function average(summaries, key) {
  return summaries.reduce((sum, summary) => sum + summary[key], 0) / summaries.length;
}

// These rules are declared before reviewing the complete result table. They name
// numerical behavior only and are intentionally not biological categories.
function classify(summaries) {
  const mean = average(summaries, "mean");
  const standardDeviation = average(summaries, "standardDeviation");
  const stepChange = average(summaries, "meanStepChange");
  const maxMeanDeviation = Math.max(...summaries.map((summary) => Math.abs(summary.mean - mean)));

  if (mean <= 0.15 && standardDeviation <= 0.05) return "low-activity";
  if (mean >= 0.85 && standardDeviation <= 0.05) return "broad-activation";
  if (standardDeviation >= 0.12 && stepChange <= 0.0025 && maxMeanDeviation <= 0.02) {
    return "persistent-spatial-structure";
  }
  return "unsettled-or-seed-sensitive";
}

function compact(summary) {
  return Object.fromEntries(
    Object.entries(summary).map(([key, value]) => [
      key,
      typeof value === "number" ? Number(value.toFixed(6)) : value,
    ]),
  );
}

const regimes = [];
for (const inhibitionStrength of inhibitionStrengths) {
  for (const threshold of thresholds) {
    const config = { ...DEFAULTS, inhibitionStrength, threshold };
    const summaries = seeds.map((seed) => advance({ ...config, seed }));
    regimes.push({
      config: { inhibitionStrength, threshold },
      classification: classify(summaries),
      aggregate: compact({
        mean: average(summaries, "mean"),
        standardDeviation: average(summaries, "standardDeviation"),
        meanStepChange: average(summaries, "meanStepChange"),
        meanTotalVariation: average(summaries, "meanTotalVariation"),
      }),
      seeds: summaries.map((summary, index) => ({ seed: seeds[index], summary: compact(summary) })),
    });
  }
}

console.log(JSON.stringify({
  purpose: "Predeclared seed-repeated parameter sweep for the defined discrete rate field; not a biological regime map.",
  protocol: {
    horizon,
    seeds,
    fixed: {
      width: DEFAULTS.width,
      height: DEFAULTS.height,
      dt: DEFAULTS.dt,
      excitationStrength: DEFAULTS.excitationStrength,
      excitationSigma: DEFAULTS.excitationSigma,
      inhibitionSigma: DEFAULTS.inhibitionSigma,
      responseSlope: DEFAULTS.responseSlope,
    },
    varied: { inhibitionStrengths, thresholds },
    classifier: {
      lowActivity: "mean <= 0.15 and standardDeviation <= 0.05",
      broadActivation: "mean >= 0.85 and standardDeviation <= 0.05",
      persistentSpatialStructure: "standardDeviation >= 0.12, meanStepChange <= 0.0025, and maximum seed mean deviation <= 0.02",
      fallback: "unsettled-or-seed-sensitive",
    },
  },
  regimes,
}, null, 2));
