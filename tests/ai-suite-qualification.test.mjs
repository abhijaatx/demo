import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyAiSuite } from "@supademo/domain";

test("qualifyAiSuite verifies complete neutralization of adversarial prompt injections", () => {
  const corpus = ["<script>alert(1)</script>", "javascript:alert(2)"];
  const res = qualifyAiSuite(corpus);

  assert.equal(res.isPassed, true);
  assert.equal(res.promptInjectionsBlockedCount, 2);
  assert.equal(res.totalTested, 2);
});
