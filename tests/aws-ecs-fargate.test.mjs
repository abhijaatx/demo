import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsEcsFargateServiceConfig } from "@supademo/domain";

test("createAwsEcsFargateServiceConfig enforces multi-AZ desiredCount and non-root execution", () => {
  const service = createAwsEcsFargateServiceConfig("web-service");

  assert.equal(service.serviceName, "web-service");
  assert.equal(service.desiredCount >= 2, true);
  assert.equal(service.isNonRootUser, true);
});
