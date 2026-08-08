import { DEFAULTS, createField, createKernel, stepField } from "../src/neural-field.js";
import { meanAbsoluteDifference, summarizeAudit } from "../src/audit-metrics.js";

const base = { ...DEFAULTS };

function advance(config, ticks, sampleTicks = []) {
  const samples = [];
  let state = createField(config);
  let previous = null;

  for (let tick = 0; tick <= ticks; tick += 1) {
    if (sampleTicks.includes(tick)) samples.push(summarizeAudit(state, previous));
    if (tick === ticks) break;
    previous = state;
    state = stepField(state, config);
  }

  return { state, samples, summary: summarizeAudit(state, previous) };
}

function rounded(value) {
  return Number(value.toFixed(6));
}

function compact(summary) {
  return Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, typeof value === "number" ? rounded(value) : value]));
}

function kernelAudit(config) {
  const kernel = createKernel(config);
  const totalWeight = kernel.entries.reduce((sum, entry) => sum + entry.weight, 0);
  const positiveWeight = kernel.entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  const negativeWeight = kernel.entries.reduce((sum, entry) => sum + Math.min(0, entry.weight), 0);
  const centreWeight = kernel.entries.find((entry) => entry.dx === 0 && entry.dy === 0).weight;
  return {
    entryCount: kernel.entries.length,
    centerWeight: rounded(centreWeight),
    totalWeight: rounded(totalWeight),
    positiveWeight: rounded(positiveWeight),
    negativeWeight: rounded(negativeWeight),
  };
}

const horizon = 24;
const baselineTicks = Math.round(horizon / base.dt);
const baseline = advance(base, baselineTicks, [0, 1, 8, 32, 80, baselineTicks]);

const timeSteps = [0.15, 0.075, 0.0375].map((dt) => {
  const ticks = Math.round(horizon / dt);
  const result = advance({ ...base, dt }, ticks);
  return { dt, ticks, summary: compact(result.summary), state: result.state };
});
const reference = timeSteps.at(-1).state;

const resolutions = [1, 2].map((scale) => {
  const config = {
    ...base,
    width: base.width * scale,
    height: base.height * scale,
    radius: base.radius * scale,
    excitationSigma: base.excitationSigma * scale,
    inhibitionSigma: base.inhibitionSigma * scale,
    pulseRadius: base.pulseRadius * scale,
  };
  const result = advance(config, Math.round(horizon / config.dt));
  return { scale, width: config.width, height: config.height, summary: compact(result.summary) };
});

const seedSensitivity = [3, 17, 31].map((seed) => {
  const result = advance({ ...base, seed }, baselineTicks);
  return { seed, summary: compact(result.summary) };
});

const report = {
  purpose: "Numerical audit of the current discrete rate-field implementation; not a biological validation.",
  baseline: {
    config: base,
    kernel: kernelAudit(base),
    horizon,
    samples: baseline.samples.map(compact),
  },
  timeStepSensitivity: timeSteps.map(({ state, ...entry }) => ({
    ...entry,
    meanAbsoluteDifferenceFromSmallestDt: rounded(meanAbsoluteDifference(state, reference)),
  })),
  scaledResolutionComparison: resolutions,
  seedSensitivity,
  interpretationBoundary: "The report records numerical properties of this code. It does not assign biological meaning to any regime; grid-scale comparisons are descriptive rather than convergence proofs.",
};

console.log(JSON.stringify(report, null, 2));
