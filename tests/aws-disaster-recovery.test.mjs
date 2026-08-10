import assert from "node:assert/strict";
import { test } from "node:test";
import { createDisasterRecoveryPlan } from "@supademo/domain";

test("createDisasterRecoveryPlan defines target RPO/RTO and automated backup settings", () => {
  const plan = createDisasterRecoveryPlan();

  assert.equal(plan.rpoMinutes <= 15, true);
  assert.equal(plan.rtoMinutes <= 60, true);
  assert.equal(plan.isRdsBackupEnabled, true);
  assert.equal(plan.isS3VersioningEnabled, true);
});
