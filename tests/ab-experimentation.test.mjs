import assert from "node:assert/strict";
import { test } from "node:test";
import { assignExperimentVariant } from "@supademo/domain";

test("assignExperimentVariant assigns deterministic variants and demo IDs based on session hash", () => {
  const config = {
    experimentId: "exp-120",
    controlDemoId: "demo-control",
    treatmentDemoId: "demo-treatment",
    trafficSplitPercent: 50,
    isActive: true
  };

  const res1 = assignExperimentVariant("vsess-user-1", config);
  const res2 = assignExperimentVariant("vsess-user-1", config); // repeat

  assert.equal(res1.variant, res2.variant);
  assert.equal(res1.selectedDemoId, res2.selectedDemoId);

  // When experiment is inactive, always return control
  const inactiveConfig = { ...config, isActive: false };
  const inactiveRes = assignExperimentVariant("vsess-user-1", inactiveConfig);
  assert.equal(inactiveRes.variant, "control");
  assert.equal(inactiveRes.selectedDemoId, "demo-control");
});
