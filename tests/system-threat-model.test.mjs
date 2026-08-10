import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateSystemThreatModel } from "@supademo/domain";

test("evaluateSystemThreatModel verifies zero unmitigated blocker or high findings", () => {
  const assessment = evaluateSystemThreatModel();

  assert.equal(assessment.isPassed, true);
  assert.equal(assessment.blockerGapsCount, 0);
  assert.equal(assessment.highGapsCount, 0);
});
