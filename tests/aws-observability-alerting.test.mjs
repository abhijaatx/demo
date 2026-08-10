import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsObservabilityConfig } from "@supademo/domain";

test("createAwsObservabilityConfig sets CloudWatch log groups and SLO targets", () => {
  const cfg = createAwsObservabilityConfig("api-service");

  assert.equal(cfg.serviceName, "api-service");
  assert.equal(cfg.cloudWatchLogGroup, "/aws/ecs/api-service");
  assert.equal(cfg.isOpenTelemetryEnabled, true);
  assert.equal(cfg.sloAvailabilityTarget, 99.9);
});
