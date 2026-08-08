// Boundary sampling for the discrete field. Each mode answers one question:
// what value does an out-of-lattice neighbour offset resolve to?

function wrapIndex(value, size) {
  return ((value % size) + size) % size;
}

function clampIndex(value, size) {
  return Math.min(size - 1, Math.max(0, value));
}

function torusSample(values, width, height, x, y) {
  const sx = wrapIndex(x, width);
  const sy = wrapIndex(y, height);
  return values[sy * width + sx];
}

function zeroSample(values, width, height, x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return 0;
  return values[y * width + x];
}

function replicateSample(values, width, height, x, y) {
  const sx = clampIndex(x, width);
  const sy = clampIndex(y, height);
  return values[sy * width + sx];
}

function cylinderSample(values, width, height, x, y) {
  if (y < 0 || y >= height) return 0;
  const sx = wrapIndex(x, width);
  return values[y * width + sx];
}

const SAMPLERS = {
  torus: torusSample,
  zero: zeroSample,
  replicate: replicateSample,
  cylinder: cylinderSample,
};

// Which axes wrap under each mode. Used by audit metrics to decide whether a
// spatial difference at the lattice edge is a real gradient or a wrap artifact.
const PERIODIC_AXES = {
  torus: { x: true, y: true },
  zero: { x: false, y: false },
  replicate: { x: false, y: false },
  cylinder: { x: true, y: false },
};

export const BOUNDARY_MODES = Object.keys(SAMPLERS);

export function resolveBoundary(mode = "torus") {
  const sampler = SAMPLERS[mode];
  if (!sampler) {
    throw new Error(`Unknown boundary mode: ${mode}. Expected one of ${BOUNDARY_MODES.join(", ")}.`);
  }
  return { mode, sample: sampler, periodic: PERIODIC_AXES[mode] };
}
