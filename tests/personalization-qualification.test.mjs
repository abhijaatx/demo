import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyPersonalizationPipeline } from "@supademo/domain";

test("qualifyPersonalizationPipeline verifies template injection security and sanitization", () => {
  const tpl = "Hello {{ name }}, welcome!";
  const maliciousVars = { name: "<script>alert('hack')</script>" };

  const result = qualifyPersonalizationPipeline(tpl, maliciousVars);

  assert.equal(result.isPassed, true);
  assert.equal(result.securityCheckPassed, true);
  assert.equal(result.sanitizedOutput.includes("<script>"), false);
});
