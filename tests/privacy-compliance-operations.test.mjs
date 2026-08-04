import assert from "node:assert/strict";
import { test } from "node:test";
import { auditPrivacyComplianceOperations } from "@supademo/domain";

test("auditPrivacyComplianceOperations validates data inventory and privacy erasure workflows", () => {
  const audit = auditPrivacyComplianceOperations();

  assert.equal(audit.isPassed, true);
  assert.equal(audit.dataInventoryVerified, true);
  assert.equal(audit.subprocessorsDocumented, true);
  assert.equal(audit.privacyExportDeletionTested, true);
});
