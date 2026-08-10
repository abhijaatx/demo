import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsInfrastructureConfig } from "@supademo/domain";

test("createAwsInfrastructureConfig enables destroy protection for production environment", () => {
  const stg = createAwsInfrastructureConfig("staging");
  assert.equal(stg.isDestroyProtected, false);

  const prod = createAwsInfrastructureConfig("production");
  assert.equal(prod.isDestroyProtected, true);
});
