import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyIntegrationsSuite } from "@supademo/domain";

test("qualifyIntegrationsSuite verifies API, SDK, and integration security bars", () => {
  const report = qualifyIntegrationsSuite();

  assert.equal(report.isPassed, true);
  assert.equal(report.apiAbusePrevented, true);
  assert.equal(report.graphFuzzPassed, true);
});
