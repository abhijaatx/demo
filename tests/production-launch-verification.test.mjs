import assert from "node:assert/strict";
import { test } from "node:test";
import { executeProductionLaunch } from "@supademo/domain";

test("executeProductionLaunch verifies synthetic journeys and closes readiness loop", () => {
  const status = executeProductionLaunch("v1.0.0");

  assert.equal(status.releaseVersion, "v1.0.0");
  assert.equal(status.isProductionDeployed, true);
  assert.equal(status.syntheticJourneysPassed, true);
  assert.equal(status.sloStabilityVerified, true);
  assert.equal(status.isReadinessLoopClosed, true);
});
