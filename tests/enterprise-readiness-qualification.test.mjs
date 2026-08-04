import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyEnterpriseReadinessSuite } from "@supademo/domain";

test("qualifyEnterpriseReadinessSuite passes all privilege-escalation and SSO threat checks", () => {
  const report = qualifyEnterpriseReadinessSuite();

  assert.equal(report.isPassed, true);
  assert.equal(report.privilegeEscalationPrevented, true);
  assert.equal(report.ssoThreatsMitigated, true);
});
