import { resolveBoundary } from "./boundary.js";

const DEFAULTS = {
  width: 72,
  height: 48,
  seed: 17,
  dt: 0.15,
  boundary: "torus",
  radius: 8,
  excitationSigma: 1.7,
  inhibitionSigma: 4.3,
  excitationStrength: 1.2,
  inhibitionStrength: 1,
  responseSlope: 10,
  threshold: 0.1,
  pulseRadius: 4,
  pulseAmplitude: 0.92,
};

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gaussian(distanceSquared, sigma) {
  return Math.exp(-distanceSquared / (2 * sigma * sigma));
}

function logistic(value) {
  return 1 / (1 + Math.exp(-value));
}

export function createKernel(config = {}) {
  const options = { ...DEFAULTS, ...config };
  const rawEntries = [];
  let excitationTotal = 0;
  let inhibitionTotal = 0;

  for (let dy = -options.radius; dy <= options.radius; dy += 1) {
    for (let dx = -options.radius; dx <= options.radius; dx += 1) {
      const distanceSquared = dx * dx + dy * dy;
      const excitation = gaussian(distanceSquared, options.excitationSigma);
      const inhibition = gaussian(distanceSquared, options.inhibitionSigma);
      rawEntries.push({ dx, dy, excitation, inhibition });
      excitationTotal += excitation;
      inhibitionTotal += inhibition;
    }
  }

  // Normalizing each lobe makes its configured strength directly interpretable.
  // The centre is a regular sample of the kernel, not a compensating self-feedback term.
  const entries = rawEntries.map((entry) => ({
    dx: entry.dx,
    dy: entry.dy,
    weight: (options.excitationStrength * entry.excitation) / excitationTotal
      - (options.inhibitionStrength * entry.inhibition) / inhibitionTotal,
  }));

  return { entries };
}

export function createField(config = {}) {
  const options = { ...DEFAULTS, ...config };
  const rng = createRng(options.seed);
  const values = new Float32Array(options.width * options.height);
  const state = { width: options.width, height: options.height, tick: 0, values };
  seedPulse(state, Math.floor(options.width * 0.32), Math.floor(options.height * 0.5), options.pulseRadius, options.pulseAmplitude);

  for (let index = 0; index < values.length; index += 1) {
    values[index] = Math.min(1, values[index] + rng() * 0.018);
  }

  return state;
}

export function cloneField(state) {
  return { width: state.width, height: state.height, tick: state.tick, values: new Float32Array(state.values) };
}

export function seedPulse(state, centerX, centerY, radius, amplitude) {
  const radiusSquared = radius * radius;
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= radiusSquared) {
        const index = y * state.width + x;
        state.values[index] = Math.max(state.values[index], amplitude * Math.exp(-distanceSquared / (radiusSquared * 0.7)));
      }
    }
  }
}

export function stepField(state, config = {}, intervention = null) {
  const options = { ...DEFAULTS, ...config };
  const kernel = options.kernel ?? createKernel(options);
  const boundary = resolveBoundary(options.boundary);
  const next = new Float32Array(state.values.length);

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const index = y * state.width + x;
      let interaction = 0;
      for (const entry of kernel.entries) {
        interaction += boundary.sample(state.values, state.width, state.height, x + entry.dx, y + entry.dy) * entry.weight;
      }

      let external = 0;
      if (intervention) {
        const dx = x - intervention.x;
        const dy = y - intervention.y;
        const distanceSquared = dx * dx + dy * dy;
        external = intervention.strength * gaussian(distanceSquared, intervention.radius);
      }

      const target = logistic(options.responseSlope * (interaction - external - options.threshold));
      next[index] = (1 - options.dt) * state.values[index] + options.dt * target;
    }
  }

  return { width: state.width, height: state.height, tick: state.tick + 1, values: next };
}

export function summarize(state) {
  let activeMass = 0;
  let peak = 0;
  for (const value of state.values) {
    activeMass += value;
    peak = Math.max(peak, value);
  }
  return { tick: state.tick, activeMass, mean: activeMass / state.values.length, peak };
}

export function isValidState(state) {
  return state.values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1);
}

export { DEFAULTS };
