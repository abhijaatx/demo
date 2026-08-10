import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsEvent } from "@supademo/domain";

test("createAnalyticsEvent constructs versioned events and strips forbidden keys", () => {
  const evt = createAnalyticsEvent("demo-111", "step.view", {
    stepIndex: 2,
    token: "secret-token",
    device: "mobile"
  });

  assert.equal(evt.v, 1);
  assert.equal(evt.kind, "step.view");
  assert.equal(evt.metadata.stepIndex, 2);
  assert.equal(evt.metadata.device, "mobile");
  assert.equal("token" in evt.metadata, false);
});
