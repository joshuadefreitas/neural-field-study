import test from "node:test";
import assert from "node:assert/strict";
import { createField, stepField } from "../src/neural-field.js";
import {
  coreMeanAbsoluteDifference,
  meanAbsoluteDifference,
  summarizeAudit,
} from "../src/audit-metrics.js";

test("audit metrics report bounded fractions and finite spatial summaries", () => {
  const state = createField({ seed: 11 });
  const summary = summarizeAudit(state);

  assert.equal(summary.tick, 0);
  assert.ok(summary.mean >= 0 && summary.mean <= 1);
  assert.ok(summary.activeFraction >= 0 && summary.activeFraction <= 1);
  assert.ok(summary.lowerBoundFraction >= 0 && summary.lowerBoundFraction <= 1);
  assert.ok(summary.upperBoundFraction >= 0 && summary.upperBoundFraction <= 1);
  assert.ok(Number.isFinite(summary.standardDeviation));
  assert.ok(Number.isFinite(summary.meanTotalVariation));
  assert.equal(summary.meanStepChange, null);
});

test("audit metrics measure state change deterministically", () => {
  const state = createField({ seed: 11 });
  const next = stepField(state);

  assert.equal(meanAbsoluteDifference(state, state), 0);
  assert.ok(meanAbsoluteDifference(state, next) > 0);
  assert.equal(summarizeAudit(next, state).meanStepChange, meanAbsoluteDifference(next, state));
});

test("coreMeanAbsoluteDifference is zero for an identical state", () => {
  // Default grid 72×48. Default periodic = { x: false, y: false }, edgeMargin = 8.
  // Core = x∈[8,63] ∩ y∈[8,39] = 56×32 = 1792 cells. MAD over those cells = 0.
  const state = createField({ seed: 11 });
  assert.equal(coreMeanAbsoluteDifference(state, state), 0);
});

test("coreMeanAbsoluteDifference is positive for distinct states", () => {
  // The initial pulse is at x≈23, y=24, well inside the 1792-cell core region.
  // After one step the pulse region changes → interior MAD > 0.
  const state = createField({ seed: 11 });
  const next = stepField(state);
  assert.ok(coreMeanAbsoluteDifference(state, next) > 0);
});

test("coreMeanAbsoluteDifference with torus periodic returns whole-field MAD (no physical edges)", () => {
  // With periodic.x = true, periodic.y = true, no cell is ever edge.
  // The function should cover all cells and produce the same result as
  // meanAbsoluteDifference.
  const state = createField({ seed: 11 });
  const next = stepField(state);
  const wholeDiff = meanAbsoluteDifference(state, next);
  const coreDiff = coreMeanAbsoluteDifference(state, next, 8, { x: true, y: true });
  assert.ok(Number.isFinite(coreDiff));
  assert.ok(Math.abs(coreDiff - wholeDiff) < 1e-9, "torus coreDiff should equal whole-field diff");
});

test("coreMeanAbsoluteDifference throws for mismatched dimensions", () => {
  const small = createField({ seed: 5, width: 10, height: 8 });
  const large = createField({ seed: 5, width: 12, height: 8 });
  assert.throws(() => coreMeanAbsoluteDifference(small, large), /matching dimensions/);
});
