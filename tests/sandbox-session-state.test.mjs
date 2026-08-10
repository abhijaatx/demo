import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSandboxSessionState,
  updateSandboxSessionValue,
  resetSandboxSessionState
} from "@supademo/domain";

test("Sandbox session state mutates values and resets cleanly back to seed state", () => {
  let session = createSandboxSessionState("sess-148", "seed-v1");
  assert.equal(Object.keys(session.mutatedValues).length, 0);

  session = updateSandboxSessionValue(session, "user_name", "Jane Doe");
  assert.equal(session.mutatedValues["user_name"], "Jane Doe");

  session = resetSandboxSessionState(session);
  assert.equal(Object.keys(session.mutatedValues).length, 0);
  assert.equal(session.seedDatasetId, "seed-v1");
});
