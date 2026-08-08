import { resolveBoundary } from "./boundary.js";

export function meanAbsoluteDifference(first, second) {
  if (first.values.length !== second.values.length) {
    throw new Error("States must have matching dimensions.");
  }

  let difference = 0;
  for (let index = 0; index < first.values.length; index += 1) {
    difference += Math.abs(first.values[index] - second.values[index]);
  }
  return difference / first.values.length;
}

// Mean absolute difference computed only over cells that are not within
// edgeMargin steps of a physical lattice boundary. The `periodic` argument
// controls which axes have physical edges: periodic.x = true means x wraps
// (no physical x-edge), periodic.y = true means y wraps (no physical y-edge).
// For a torus (periodic.x = true, periodic.y = true) every cell is interior
// and the result equals the whole-field mean absolute difference. For a
// cylinder (periodic.x = true, periodic.y = false) only the top/bottom rows
// are excluded. For planar modes (both false) a rectangular band is excluded
// on all four sides.
//
// The default edgeMargin matches the default kernel radius so that the core
// region is the part of the field where boundary-sampler differences have had
// the least direct influence on the kernel convolution.
export function coreMeanAbsoluteDifference(
  first,
  second,
  edgeMargin = 8,
  periodic = { x: false, y: false },
) {
  if (
    first.width !== second.width ||
    first.height !== second.height ||
    first.values.length !== second.values.length
  ) {
    throw new Error("States must have matching dimensions.");
  }

  const { width, height } = first;
  let difference = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // A cell is on the physical edge only if its axis is non-periodic and
      // it falls within edgeMargin of that axis's boundary.
      const isEdge =
        (!periodic.x && (x < edgeMargin || x >= width - edgeMargin)) ||
        (!periodic.y && (y < edgeMargin || y >= height - edgeMargin));
      if (!isEdge) {
        difference += Math.abs(
          first.values[y * width + x] - second.values[y * width + x],
        );
        count += 1;
      }
    }
  }

  return count > 0 ? difference / count : 0;
}

export function summarizeAudit(
  state,
  previous = null,
  { boundEpsilon = 1e-6, activeThreshold = 0.1, boundary = "torus", edgeMargin = 8 } = {},
) {
  const { width, height, values } = state;
  const { periodic } = resolveBoundary(boundary);
  let mass = 0;
  let peak = 0;
  let lowerClamped = 0;
  let upperClamped = 0;
  let active = 0;

  for (const value of values) {
    mass += value;
    peak = Math.max(peak, value);
    if (value <= boundEpsilon) lowerClamped += 1;
    if (value >= 1 - boundEpsilon) upperClamped += 1;
    if (value > activeThreshold) active += 1;
  }

  const mean = mass / values.length;
  let variance = 0;
  let totalVariation = 0;
  let variationPairs = 0;
  let edgeMass = 0;
  let edgeCount = 0;
  let coreMass = 0;
  let coreCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const value = values[index];
      variance += (value - mean) ** 2;

      // Non-wrapping total variation: only cross the lattice edge when the
      // axis actually wraps under this boundary mode, so a nonperiodic edge
      // does not get an artificial neighbour pair.
      if (x + 1 < width) {
        totalVariation += Math.abs(value - values[y * width + (x + 1)]);
        variationPairs += 1;
      } else if (periodic.x) {
        totalVariation += Math.abs(value - values[y * width]);
        variationPairs += 1;
      }

      if (y + 1 < height) {
        totalVariation += Math.abs(value - values[(y + 1) * width + x]);
        variationPairs += 1;
      } else if (periodic.y) {
        totalVariation += Math.abs(value - values[x]);
        variationPairs += 1;
      }

      // Core/edge partition: a cell is on the physical edge only if its axis
      // is non-periodic and it falls within edgeMargin of that axis's boundary.
      // For torus (both axes periodic) no cell is ever edge: edgeMean is null
      // and coreMean equals the whole-field mean. For cylinder (x periodic,
      // y non-periodic) only the top/bottom rows of height edgeMargin are edge.
      // For planar modes (both non-periodic) a rectangular band edgeMargin wide
      // on all four sides is edge.
      const isEdge =
        (!periodic.x && (x < edgeMargin || x >= width - edgeMargin)) ||
        (!periodic.y && (y < edgeMargin || y >= height - edgeMargin));
      if (isEdge) {
        edgeMass += value;
        edgeCount += 1;
      } else {
        coreMass += value;
        coreCount += 1;
      }
    }
  }

  return {
    tick: state.tick,
    boundary,
    mass,
    mean,
    peak,
    standardDeviation: Math.sqrt(variance / values.length),
    activeFraction: active / values.length,
    lowerBoundFraction: lowerClamped / values.length,
    upperBoundFraction: upperClamped / values.length,
    meanTotalVariation: totalVariation / variationPairs,
    coreMean: coreCount > 0 ? coreMass / coreCount : null,
    edgeMean: edgeCount > 0 ? edgeMass / edgeCount : null,
    meanStepChange: previous ? meanAbsoluteDifference(state, previous) : null,
  };
}
