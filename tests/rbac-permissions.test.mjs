import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPermission } from "@supademo/domain";

test("hasPermission enforces deny-by-default role permissions", () => {
  assert.equal(hasPermission("admin", "delete"), true);
  assert.equal(hasPermission("creator", "publish"), true);
  assert.equal(hasPermission("creator", "delete"), false);
  assert.equal(hasPermission("viewer", "read"), true);
  assert.equal(hasPermission("viewer", "write"), false);
});
