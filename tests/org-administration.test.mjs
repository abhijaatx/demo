import assert from "node:assert/strict";
import { test } from "node:test";
import { createOrganizationRecord, addWorkspaceToOrganization } from "@supademo/domain";

test("Organization administration manages workspace assignments with org admin checks", () => {
  let org = createOrganizationRecord("org-171", "Acme Enterprise", "user-admin");
  assert.equal(org.workspaceIds.length, 0);

  org = addWorkspaceToOrganization(org, "ws-100", "user-admin");
  assert.equal(org.workspaceIds.length, 1);

  assert.throws(
    () => addWorkspaceToOrganization(org, "ws-200", "user-unauthorized"),
    /Only organization admins can manage workspace assignments/
  );
});
