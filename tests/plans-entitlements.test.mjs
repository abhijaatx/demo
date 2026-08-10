import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspaceEntitlement } from "@supademo/domain";

test("createWorkspaceEntitlement assigns seats and quota caps by plan tier", () => {
  const freeEnt = createWorkspaceEntitlement("ws-free", "free");
  assert.equal(freeEnt.maxCreatorSeats, 1);
  assert.equal(freeEnt.maxDemos, 5);

  const entEnt = createWorkspaceEntitlement("ws-ent", "enterprise");
  assert.equal(entEnt.maxCreatorSeats, 100);
  assert.equal(entEnt.maxDemos, 10000);
});
