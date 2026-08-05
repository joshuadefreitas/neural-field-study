import test from "node:test";
import assert from "node:assert/strict";
import { createField, isValidState, stepField, summarize } from "../src/neural-field.js";

function run(seed, intervention = null) {
  let state = createField({ seed });
  const snapshots = [new Float32Array(state.values)];
  for (let index = 0; index < 8; index += 1) {
    state = stepField(state, {}, intervention);
    snapshots.push(new Float32Array(state.values));
  }
  return { state, snapshots };
}

test("same seed produces the same trajectory", () => {
  const first = run(42);
  const second = run(42);
  assert.deepEqual(first.snapshots, second.snapshots);
});

test("different seeds produce a different initial field", () => {
  const first = run(42);
  const second = run(43);
  assert.notDeepEqual(first.snapshots[0], second.snapshots[0]);
});

test("updates advance one tick and keep values bounded", () => {
  const result = run(7);
  assert.equal(result.state.tick, 8);
  assert.equal(isValidState(result.state), true);
  assert.ok(summarize(result.state).peak > 0);
});

test("a localized inhibitory intervention changes the trajectory", () => {
  const baseline = run(7);
  const intervention = run(7, { x: 47, y: 24, radius: 3, strength: 0.8 });
  assert.notDeepEqual(baseline.snapshots[4], intervention.snapshots[4]);
});

test("periodic boundaries keep the update finite", () => {
  const state = createField({ width: 8, height: 8, seed: 3, radius: 6 });
  const next = stepField(state);
  assert.equal(next.values.length, 64);
  assert.equal(isValidState(next), true);
});
