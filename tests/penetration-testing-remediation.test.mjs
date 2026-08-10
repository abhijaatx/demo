import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyPenetrationTestReport } from "@supademo/domain";

test("qualifyPenetrationTestReport confirms zero open critical or high vulnerability findings", () => {
  const report = qualifyPenetrationTestReport();

  assert.equal(report.isPassed, true);
  assert.equal(report.criticalFindingsCount, 0);
  assert.equal(report.highFindingsCount, 0);
  assert.equal(report.remediatedCount > 0, true);
});
