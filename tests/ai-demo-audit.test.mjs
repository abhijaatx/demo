import assert from "node:assert/strict";
import { test } from "node:test";
import { performAiDemoAudit } from "@supademo/domain";

test("performAiDemoAudit computes reproducible audit scores and recommendations", () => {
  const audit = performAiDemoAudit(20, 800);

  assert.equal(audit.overallScore < 90, true);
  assert.equal(audit.recommendations.length > 0, true);
  assert.equal(audit.recommendations[0]?.includes("over 15 steps"), true);
});
