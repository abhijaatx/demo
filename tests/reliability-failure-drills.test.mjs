import assert from "node:assert/strict";
import { test } from "node:test";
import { runReliabilityFailureDrills } from "@supademo/domain";

test("runReliabilityFailureDrills passes multi-AZ degradation and DB failover checks", () => {
  const report = runReliabilityFailureDrills();

  assert.equal(report.isPassed, true);
  assert.equal(report.azDegradationRecovered, true);
  assert.equal(report.dbFailoverTimeSeconds <= 30, true);
  assert.equal(report.redisCacheLossGraceful, true);
});
