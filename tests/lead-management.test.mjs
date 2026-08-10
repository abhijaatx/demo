import assert from "node:assert/strict";
import { test } from "node:test";
import { createLeadRecord, updateLeadStatus } from "@supademo/domain";

test("createLeadRecord & updateLeadStatus manage contact records", () => {
  let lead = createLeadRecord(
    "ws-1",
    "demo-1",
    "lead@example.com",
    "form-1",
    { email: "lead@example.com" },
    85
  );

  assert.equal(lead.workspaceId, "ws-1");
  assert.equal(lead.status, "new");
  assert.equal(lead.intentScore, 85);

  lead = updateLeadStatus(lead, "qualified");
  assert.equal(lead.status, "qualified");

  assert.throws(
    () => createLeadRecord("ws-1", "demo-1", "bad-email", "form-1"),
    /Invalid lead email/
  );
});
