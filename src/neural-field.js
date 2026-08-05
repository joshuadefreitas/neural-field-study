const DEFAULTS = {
  width: 72,
  height: 48,
  seed: 17,
  dt: 0.14,
  decay: 0.72,
  gain: 1.42,
  radius: 6,
  excitationSigma: 1.7,
  inhibitionSigma: 4.3,
  inhibitionRatio: 0.78,
  pulseRadius: 4,
  pulseAmplitude: 0.92,
};

function wrap(value, size) {
  return (value + size) % size;
}

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

export function createKernel(config = {}) {
  const options = { ...DEFAULTS, ...config };
  const entries = [];
  let sum = 0;

  for (let dy = -options.radius; dy <= options.radius; dy += 1) {
    for (let dx = -options.radius; dx <= options.radius; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const distanceSquared = dx * dx + dy * dy;
      const excitation = gaussian(distanceSquared, options.excitationSigma);
      const inhibition = options.inhibitionRatio * gaussian(distanceSquared, options.inhibitionSigma);
      const weight = excitation - inhibition;
      entries.push({ dx, dy, weight });
      sum += weight;
    }
  }

  return { entries, centerWeight: -sum };
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
  const next = new Float32Array(state.values.length);

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const index = y * state.width + x;
      let interaction = state.values[index] * kernel.centerWeight;
      for (const entry of kernel.entries) {
        const sampleX = wrap(x + entry.dx, state.width);
        const sampleY = wrap(y + entry.dy, state.height);
        interaction += state.values[sampleY * state.width + sampleX] * entry.weight;
      }

      let external = 0;
      if (intervention) {
        const dx = x - intervention.x;
        const dy = y - intervention.y;
        const distanceSquared = dx * dx + dy * dy;
        external = intervention.strength * gaussian(distanceSquared, intervention.radius);
      }

      const value = state.values[index] + options.dt * (-options.decay * state.values[index] + options.gain * Math.tanh(interaction - external));
      next[index] = Math.max(0, Math.min(1, value));
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
