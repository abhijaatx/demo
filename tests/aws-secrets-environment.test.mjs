import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsEnvironmentSecretsConfig } from "@supademo/domain";

test("createAwsEnvironmentSecretsConfig disables local auth mocks and requires SES domain", () => {
  const cfg = createAwsEnvironmentSecretsConfig("us-east-1_abcdef", "supademo.com");

  assert.equal(cfg.userPoolId, "us-east-1_abcdef");
  assert.equal(cfg.sesDomain, "supademo.com");
  assert.equal(cfg.isLocalMockDisabled, true);
});
