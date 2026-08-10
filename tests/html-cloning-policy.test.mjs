import assert from "node:assert/strict";
import { test } from "node:test";
import { createHtmlCloningPolicyConfig } from "@supademo/domain";

test("createHtmlCloningPolicyConfig defines strict DOM node limits and forbidden tags", () => {
  const policy = createHtmlCloningPolicyConfig();

  assert.equal(policy.maxDomDepth, 50);
  assert.equal(policy.maxNodeCount, 10000);
  assert.equal(policy.disallowedTags.includes("script"), true);
  assert.equal(policy.disallowedAttributes.includes("onclick"), true);
});
