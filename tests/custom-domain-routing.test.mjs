import assert from "node:assert/strict";
import { test } from "node:test";
import { createCustomDomainRequest, verifyCustomDomainOwnership } from "@supademo/domain";

test("createCustomDomainRequest & verifyCustomDomainOwnership handle DNS verification", () => {
  let rec = createCustomDomainRequest("d-158", "ws-1", "demos.acme.com");
  assert.equal(rec.hostname, "demos.acme.com");
  assert.equal(rec.status, "pending_verification");
  assert.equal(rec.verificationTxtRecord.startsWith("supademo-verify="), true);

  rec = verifyCustomDomainOwnership(rec, rec.verificationTxtRecord);
  assert.equal(rec.status, "active");

  let failedRec = createCustomDomainRequest("d-158-fail", "ws-1", "bad.com");
  failedRec = verifyCustomDomainOwnership(failedRec, "supademo-verify=wrong");
  assert.equal(failedRec.status, "failed");
});
