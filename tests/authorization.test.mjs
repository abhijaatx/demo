import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AuthorizationDeniedError,
  InMemoryTenantScopedRepository,
  can,
  capabilitiesForRole,
  requireCapability,
  requireWorkspaceCapability
} from "../packages/domain/dist/index.js";

const ownerScope = { userId: "user-a", workspaceId: "workspace-a", role: "owner" };
const viewerScope = { userId: "user-b", workspaceId: "workspace-a", role: "viewer" };
const guestScope = { userId: "guest", workspaceId: "workspace-a", role: "guest" };

test("central authorization defaults to deny and exposes only role-derived capabilities", () => {
  assert.equal(can("owner", "member:invite"), true);
  assert.equal(can("editor", "member:invite"), false);
  assert.equal(can("viewer", "demo:create"), false);
  assert.equal(can("guest", "demo:read"), true);
  assert.throws(() => requireCapability("viewer", "demo:publish"), AuthorizationDeniedError);
  assert.throws(
    () => requireWorkspaceCapability(viewerScope, "workspace-b", "demo:read"),
    AuthorizationDeniedError
  );
  assert.ok(capabilitiesForRole("owner").includes("workspace:delete"));
  assert.equal(capabilitiesForRole("guest").includes("workspace:read"), false);
});

test("tenant-scoped repository cannot read or mutate another workspace", () => {
  const repository = new InMemoryTenantScopedRepository([
    { id: "demo-a", workspaceId: "workspace-a", title: "A" },
    { id: "demo-b", workspaceId: "workspace-b", title: "B" }
  ]);
  assert.deepEqual(
    repository.list(ownerScope).map((record) => record.id),
    ["demo-a"]
  );
  assert.equal(repository.get(ownerScope, "demo-b"), null);
  assert.equal(
    repository.update(ownerScope, "demo-b", (record) => ({ ...record, title: "tampered" })),
    null
  );
  assert.equal(repository.delete(ownerScope, "demo-b"), false);
  assert.throws(
    () => repository.create(viewerScope, { id: "demo-c", workspaceId: "workspace-a" }),
    AuthorizationDeniedError
  );
  assert.throws(
    () => repository.create(guestScope, { id: "demo-d", workspaceId: "workspace-a" }),
    AuthorizationDeniedError
  );
});

test("tenant repository source requires scope arguments and avoids unscoped lookup helpers", async () => {
  const source = await readFile(
    new URL("../packages/domain/src/tenant.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /get\(scope: TenantScope, id: string\)/u);
  assert.match(source, /list\(scope: TenantScope\)/u);
  assert.doesNotMatch(source, /getById\(id: string\)|findById\(id: string\)/u);
  assert.doesNotMatch(source, /innerHTML|eval\(/u);
});
