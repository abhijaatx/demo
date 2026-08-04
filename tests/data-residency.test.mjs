import assert from "node:assert/strict";
import { test } from "node:test";
import { createTenantResidencyRecord } from "@supademo/domain";

test("createTenantResidencyRecord configures region placement with unverified default", () => {
  const rec = createTenantResidencyRecord("ws-176", "eu-central-1");

  assert.equal(rec.workspaceId, "ws-176");
  assert.equal(rec.region, "eu-central-1");
  assert.equal(rec.isVerifiedInfrastructure, false);
});
