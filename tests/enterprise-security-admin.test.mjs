import assert from "node:assert/strict";
import { test } from "node:test";
import { createEnterpriseSecurityOverview } from "@supademo/domain";

test("createEnterpriseSecurityOverview compiles posture summary without exposing secrets", () => {
  const overview = createEnterpriseSecurityOverview("ws-179", true, 3, 1);

  assert.equal(overview.workspaceId, "ws-179");
  assert.equal(overview.isSsoEnforced, true);
  assert.equal(overview.activeApiKeysCount, 3);
  assert.equal(overview.customDomainsCount, 1);
});
