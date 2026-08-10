import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsDeploymentPipelineConfig } from "@supademo/domain";

test("createAwsDeploymentPipelineConfig enforces OIDC auth and production approvals", () => {
  const stg = createAwsDeploymentPipelineConfig("a1b2c3d4", "staging");
  assert.equal(stg.isOidcAuthenticated, true);
  assert.equal(stg.requiresManualApproval, false);

  const prod = createAwsDeploymentPipelineConfig("a1b2c3d4", "production");
  assert.equal(prod.requiresManualApproval, true);
});
