import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateViewerIntentScore } from "@supademo/domain";

test("calculateViewerIntentScore calculates deterministic scores and assigns intent tiers", () => {
  const signal1 = calculateViewerIntentScore("vsess-hot", 100, 120, true);
  assert.equal(signal1.intentScore, 100);
  assert.equal(signal1.intentTier, "hot");

  const signal2 = calculateViewerIntentScore("vsess-low", 10, 10, false);
  assert.equal(signal2.intentTier, "low");
});
