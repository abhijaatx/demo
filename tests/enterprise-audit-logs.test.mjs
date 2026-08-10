import assert from "node:assert/strict";
import { test } from "node:test";
import { createEnterpriseAuditEvent } from "@supademo/domain";

test("createEnterpriseAuditEvent creates immutable enterprise audit log records", () => {
  const evt = createEnterpriseAuditEvent("evt-174", "ws-1", "user-1", "auth.login");

  assert.equal(evt.eventId, "evt-174");
  assert.equal(evt.action, "auth.login");
  assert.equal(evt.timestampMs > 0, true);
});
