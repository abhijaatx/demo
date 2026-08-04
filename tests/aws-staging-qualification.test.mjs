import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyAwsStagingCapacity } from "@supademo/domain";

test("qualifyAwsStagingCapacity verifies target headroom and cost alarm status", () => {
  const report = qualifyAwsStagingCapacity();

  assert.equal(report.isPassed, true);
  assert.equal(report.targetWorkloadHeadroomPercent >= 20, true);
  assert.equal(report.costAlarmsActive, true);
});
