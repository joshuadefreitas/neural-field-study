import test from "node:test";
import assert from "node:assert/strict";
import { resolveBoundary, BOUNDARY_MODES } from "../src/boundary.js";
import { DEFAULTS, createField, stepField } from "../src/neural-field.js";
import { coreMeanAbsoluteDifference, summarizeAudit } from "../src/audit-metrics.js";

test("torus is the default boundary and matches an explicit torus config", () => {
  assert.equal(DEFAULTS.boundary, "torus");
  const state = createField({ seed: 5, width: 12, height: 10 });
  const withDefault = stepField(state);
  const withExplicitTorus = stepField(state, { boundary: "torus" });
  assert.deepEqual(withDefault.values, withExplicitTorus.values);
});

test("torus boundary wraps in both axes", () => {
  const boundary = resolveBoundary("torus");
  const values = new Float32Array([1, 2, 3, 4]); // 2x2, row-major
  assert.equal(boundary.sample(values, 2, 2, -1, 0), values[1]);
  assert.equal(boundary.sample(values, 2, 2, 2, 0), values[0]);
  assert.equal(boundary.sample(values, 2, 2, 0, -1), values[2]);
  assert.deepEqual(boundary.periodic, { x: true, y: true });
});

test("zero-padded planar boundary returns 0 outside the lattice", () => {
  const boundary = resolveBoundary("zero");
  const values = new Float32Array([1, 2, 3, 4]);
  assert.equal(boundary.sample(values, 2, 2, -1, 0), 0);
  assert.equal(boundary.sample(values, 2, 2, 2, 0), 0);
  assert.equal(boundary.sample(values, 2, 2, 0, -1), 0);
  assert.equal(boundary.sample(values, 2, 2, 0, 0), 1);
  assert.deepEqual(boundary.periodic, { x: false, y: false });
});

test("replicate-edge planar boundary clamps to the nearest edge value", () => {
  const boundary = resolveBoundary("replicate");
  const values = new Float32Array([1, 2, 3, 4]);
  assert.equal(boundary.sample(values, 2, 2, -1, 0), values[0]);
  assert.equal(boundary.sample(values, 2, 2, 2, 0), values[1]);
  assert.equal(boundary.sample(values, 2, 2, 0, -1), values[0]);
  assert.equal(boundary.sample(values, 2, 2, 1, 3), values[3]);
  assert.deepEqual(boundary.periodic, { x: false, y: false });
});

test("cylindrical boundary wraps x and zero-pads y", () => {
  const boundary = resolveBoundary("cylinder");
  const values = new Float32Array([1, 2, 3, 4]);
  assert.equal(boundary.sample(values, 2, 2, -1, 0), values[1]);
  assert.equal(boundary.sample(values, 2, 2, 2, 1), values[2]);
  assert.equal(boundary.sample(values, 2, 2, 0, -1), 0);
  assert.equal(boundary.sample(values, 2, 2, 0, 2), 0);
  assert.deepEqual(boundary.periodic, { x: true, y: false });
});

test("unknown boundary mode throws", () => {
  assert.throws(() => resolveBoundary("nonsense"), /Unknown boundary mode/);
});

test("field updates stay finite and bounded under every boundary mode", () => {
  for (const boundary of BOUNDARY_MODES) {
    const state = createField({ seed: 9, width: 10, height: 8 });
    const next = stepField(state, { boundary });
    assert.equal(next.values.length, 80);
    assert.ok(next.values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  }
});

test("nonperiodic axes exclude wrap-around pairs from total variation", () => {
  const state = createField({ seed: 4, width: 10, height: 8 });
  const torusSummary = summarizeAudit(state, null, { boundary: "torus" });
  const zeroSummary = summarizeAudit(state, null, { boundary: "zero" });
  const cylinderSummary = summarizeAudit(state, null, { boundary: "cylinder" });

  assert.notEqual(torusSummary.meanTotalVariation, zeroSummary.meanTotalVariation);
  assert.notEqual(torusSummary.meanTotalVariation, cylinderSummary.meanTotalVariation);
  assert.ok(Number.isFinite(zeroSummary.meanTotalVariation));
  assert.ok(Number.isFinite(cylinderSummary.meanTotalVariation));
});

test("audit summary reports finite core and edge means for non-periodic boundaries on a large enough grid", () => {
  // The default edgeMargin is 8 (kernel radius). A 10×8 grid has no interior
  // cells at that margin, so this test uses the default 72×48 grid where
  // core = x∈[8,63] ∩ y∈[8,39] = 56×32 = 1 792 cells for planar modes.
  const state = createField({ seed: 4 });
  const summary = summarizeAudit(state, null, { boundary: "replicate" });
  assert.ok(Number.isFinite(summary.coreMean), "coreMean should be finite");
  assert.ok(Number.isFinite(summary.edgeMean), "edgeMean should be finite");
  assert.ok(summary.coreMean !== summary.edgeMean, "core and edge means should generally differ");
});

test("summarizeAudit defaults to torus and stays backward compatible with no options", () => {
  const state = createField({ seed: 4, width: 10, height: 8 });
  const implicit = summarizeAudit(state);
  const explicit = summarizeAudit(state, null, { boundary: "torus" });
  assert.deepEqual(implicit, explicit);
});

test("all boundary modes produce a different final state from torus at the default config", () => {
  // This is a deterministic sanity check, not a claim that boundary differences
  // are large or scientifically meaningful. It confirms each mode's sampler
  // actually participates in the field update rather than silently aliasing.
  const horizon = 24;
  const runTicks = Math.round(horizon / DEFAULTS.dt);
  const torusRun = (() => {
    let state = createField({ ...DEFAULTS, boundary: "torus" });
    for (let tick = 0; tick < runTicks; tick += 1) {
      state = stepField(state, { ...DEFAULTS, boundary: "torus" });
    }
    return state;
  })();

  for (const boundary of BOUNDARY_MODES) {
    if (boundary === "torus") continue;
    let state = createField({ ...DEFAULTS, boundary });
    for (let tick = 0; tick < runTicks; tick += 1) {
      state = stepField(state, { ...DEFAULTS, boundary });
    }
    assert.notDeepEqual(
      state.values,
      torusRun.values,
      `${boundary} should diverge from torus after ${runTicks} steps`,
    );
  }
});

test("coreMeanAbsoluteDifference between torus and non-torus modes is positive at the default config", () => {
  // Core region uses each variant mode's own periodic axes and the kernel
  // radius as edgeMargin. For cylinder (periodic.x=true): the core excludes
  // only rows within 8 of top/bottom. For planar modes: a rectangular 8-wide
  // band on all four sides is excluded. Differences remain positive even in
  // the interior because boundary effects propagate well beyond edgeMargin.
  const horizon = 24;
  const runTicks = Math.round(horizon / DEFAULTS.dt);

  function run(boundary) {
    let state = createField({ ...DEFAULTS, boundary });
    for (let tick = 0; tick < runTicks; tick += 1) {
      state = stepField(state, { ...DEFAULTS, boundary });
    }
    return state;
  }

  const torusState = run("torus");
  for (const boundary of BOUNDARY_MODES) {
    if (boundary === "torus") continue;
    const { periodic } = resolveBoundary(boundary);
    const variantState = run(boundary);
    const diff = coreMeanAbsoluteDifference(
      torusState,
      variantState,
      DEFAULTS.radius,
      periodic,
    );
    assert.ok(
      diff > 0,
      `Core MAD between torus and ${boundary} (periodic=${JSON.stringify(periodic)}) should be positive`,
    );
    assert.ok(Number.isFinite(diff), `Core MAD for ${boundary} must be finite`);
  }
});

test("cylindrical boundary wraps x at corner offset (-1, -1) and zero-pads y", () => {
  // Focused corner-case: out-of-lattice on both axes simultaneously.
  const boundary = resolveBoundary("cylinder");
  const values = new Float32Array([10, 20, 30, 40]); // 2×2
  // x=-1 wraps to column 1; y=-1 is out of range → zero
  assert.equal(boundary.sample(values, 2, 2, -1, -1), 0);
  // x=2 wraps to column 0; y=1 is valid
  assert.equal(boundary.sample(values, 2, 2, 2, 1), values[2]);
});

test("replicate-edge boundary clamps correctly at all four corners of the lattice", () => {
  const boundary = resolveBoundary("replicate");
  const values = new Float32Array([1, 2, 3, 4]); // 2×2: (0,0)=1 (1,0)=2 (0,1)=3 (1,1)=4
  assert.equal(boundary.sample(values, 2, 2, -5, -5), values[0]); // top-left corner
  assert.equal(boundary.sample(values, 2, 2, 99, -1), values[1]); // top-right corner
  assert.equal(boundary.sample(values, 2, 2, -1, 99), values[2]); // bottom-left corner
  assert.equal(boundary.sample(values, 2, 2, 99, 99), values[3]); // bottom-right corner
});

test("torus boundary resolves in-bounds coordinates identically to direct array access", () => {
  const boundary = resolveBoundary("torus");
  const values = new Float32Array([5, 6, 7, 8, 9, 10]); // 3×2
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      assert.equal(boundary.sample(values, 3, 2, x, y), values[y * 3 + x]);
    }
  }
});

test("torus summarizeAudit has no edge cells: edgeMean is null and coreMean equals the whole-field mean", () => {
  // A torus has no physical boundaries. With both axes periodic the edge zone
  // is empty regardless of edgeMargin. coreMean should equal the whole-field
  // mean and edgeMean should be null.
  const state = createField({ seed: 7 });
  const summary = summarizeAudit(state, null, { boundary: "torus" });
  assert.equal(summary.edgeMean, null, "torus should have no edge cells");
  assert.ok(Number.isFinite(summary.coreMean), "coreMean should be finite");
  // coreMean covers all cells, so it must equal the whole-field mean exactly.
  assert.ok(
    Math.abs(summary.coreMean - summary.mean) < 1e-9,
    "coreMean should equal the whole-field mean for torus",
  );
});

test("cylinder summarizeAudit defines edge zone only along the non-periodic y-axis", () => {
  // cylinder: periodic.x = true, periodic.y = false.
  // A cell at x < edgeMargin but y in the interior must be classified as
  // core, not edge. A cell at y < edgeMargin must be edge regardless of x.
  // Use the default 72×48 grid with edgeMargin = 8.
  const state = createField({ seed: 7 });
  const edgeMargin = 8;

  // Build a controlled state to count edge and core cells explicitly.
  // Edge = y < 8 OR y >= 40 (only y-axis, since x wraps).
  // Core = y ∈ [8, 39] (all x).
  const expectedEdgeCount = 72 * 8 * 2;   // top 8 rows + bottom 8 rows
  const expectedCoreCount = 72 * 32;       // 32 interior rows × 72 columns

  // Verify that the partition produces the expected counts by checking that
  // non-trivial x positions near the left edge (x < edgeMargin) but with
  // interior y values are counted as core. We do this indirectly: if x were
  // treated as a physical edge, coreMean would be computed over fewer cells
  // and the count can be inferred from coreMean vs mean via a uniform-ish field.
  //
  // Direct count check: create a constant field (all ones) and verify totals.
  const uniformValues = new Float32Array(72 * 48).fill(1);
  const uniformState = { width: 72, height: 48, tick: 0, values: uniformValues };
  const summary = summarizeAudit(uniformState, null, { boundary: "cylinder", edgeMargin });

  // For a uniform-one field: coreMean = edgeMean = mean = 1.
  assert.ok(Math.abs(summary.coreMean - 1) < 1e-9, "coreMean should be 1 for uniform field");
  assert.ok(Math.abs(summary.edgeMean - 1) < 1e-9, "edgeMean should be 1 for uniform field");

  // Verify cell counts from the mass: coreMass = coreCount × 1, edgeMass = edgeCount × 1.
  // coreMass = coreMean × coreCount → since coreMean=1, coreMass = coreCount.
  // We can't read coreCount directly, but we can verify via the summary mass split:
  // edgeCount + coreCount = 72 × 48 = 3456.
  // mass = 3456 (all ones). edgeMean = 1, coreMean = 1 — both trivially true.
  // Instead verify using a non-uniform field where x<8 rows are intentionally distinct.
  const biasedValues = new Float32Array(72 * 48);
  for (let row = 0; row < 48; row += 1) {
    for (let col = 0; col < 72; col += 1) {
      // Set columns 0–7 (x < edgeMargin) to 0.5 in interior rows.
      // If cylinder correctly treats only y as physical edge, interior rows
      // with x < 8 should count as core (not edge).
      biasedValues[row * 72 + col] = col < edgeMargin ? 0.5 : 1.0;
    }
  }
  const biasedState = { width: 72, height: 48, tick: 0, values: biasedValues };
  const biasedSummary = summarizeAudit(biasedState, null, { boundary: "cylinder", edgeMargin });

  // For cylinder: core rows = rows 8–39 = 32 rows × 72 cols = 2304 cells.
  //   Core cells with col < 8: 32 × 8 = 256 cells with value 0.5
  //   Core cells with col ≥ 8: 32 × 64 = 2048 cells with value 1.0
  //   coreMean = (256 × 0.5 + 2048 × 1.0) / 2304 = (128 + 2048) / 2304 ≈ 0.944444
  const expectedCoreMean = (256 * 0.5 + 2048 * 1.0) / 2304;
  assert.ok(
    Math.abs(biasedSummary.coreMean - expectedCoreMean) < 1e-5,
    `coreMean should be ~${expectedCoreMean.toFixed(5)} when x<8 columns are 0.5 and cylinder uses y-only edge`,
  );
});

test("zero and replicate summarizeAudit define edge zone on both axes", () => {
  // Both zero and replicate: periodic.x = false, periodic.y = false.
  // A cell at x < edgeMargin must be edge even if y is interior.
  // A cell at y < edgeMargin must be edge even if x is interior.
  const edgeMargin = 8;

  // Use the same biased field as the cylinder test (x < 8 → 0.5, else 1.0),
  // but now x < edgeMargin cells in interior rows should be EDGE (not core).
  const biasedValues = new Float32Array(72 * 48);
  for (let row = 0; row < 48; row += 1) {
    for (let col = 0; col < 72; col += 1) {
      biasedValues[row * 72 + col] = col < edgeMargin ? 0.5 : 1.0;
    }
  }
  const biasedState = { width: 72, height: 48, tick: 0, values: biasedValues };

  for (const boundary of ["zero", "replicate"]) {
    const summary = summarizeAudit(biasedState, null, { boundary, edgeMargin });

    // For planar modes: core = x∈[8,63] AND y∈[8,39] = 56 × 32 = 1792 cells.
    // All core cells have col ≥ 8, so value = 1.0 → coreMean = 1.0.
    assert.ok(
      Math.abs(summary.coreMean - 1.0) < 1e-9,
      `${boundary}: coreMean should be 1.0 when all core cells have value 1.0`,
    );
    // Edge cells include the x<8 band (which has value 0.5) so edgeMean < 1.
    assert.ok(
      summary.edgeMean < 1.0,
      `${boundary}: edgeMean should be < 1.0 because x<8 band (value 0.5) is in the edge zone`,
    );
  }
});
