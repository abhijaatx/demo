import assert from "node:assert/strict";
import { test } from "node:test";
import { createDataRetentionPolicy } from "@supademo/domain";

test("createDataRetentionPolicy enforces legal minimum retention thresholds", () => {
  const policy = createDataRetentionPolicy("pol-175", "ws-1");

  assert.equal(policy.analyticsRetentionDays, 365);
  assert.equal(policy.auditLogRetentionDays, 730);

  assert.throws(
    () => createDataRetentionPolicy("pol-bad", "ws-1", 5, 10),
    /Retention policy must satisfy legal minimum/
  );
});
