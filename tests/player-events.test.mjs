import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlayerEvent } from "@supademo/player";

test("createPlayerEvent generates versioned timestamped event objects", () => {
  const event = createPlayerEvent("START", "demo-ev-1", { stepIndex: 0 });

  assert.equal(event.v, 1);
  assert.equal(event.kind, "START");
  assert.equal(event.demoId, "demo-ev-1");
  assert.equal(event.payload.stepIndex, 0);
  assert.ok(event.timestampIso);
});
