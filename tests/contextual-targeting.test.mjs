import assert from "node:assert/strict";
import { test } from "node:test";
import { createTargetingRule, evaluateTargetingRule } from "@supademo/domain";

test("evaluateTargetingRule matches URL patterns and respects frequency caps", () => {
  const rule = createTargetingRule("r1", "/dashboard/*", "#hero", 2);

  assert.equal(evaluateTargetingRule(rule, "https://app.com/dashboard/settings", 0), true);
  assert.equal(evaluateTargetingRule(rule, "https://app.com/dashboard/settings", 1), true);
  assert.equal(evaluateTargetingRule(rule, "https://app.com/dashboard/settings", 2), false);
  assert.equal(evaluateTargetingRule(rule, "https://app.com/billing", 0), false);
});
