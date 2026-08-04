import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsEvent, processBatchedAnalyticsIngestion } from "@supademo/domain";

test("processBatchedAnalyticsIngestion accepts valid batches and rejects oversized payloads", () => {
  const evt1 = createAnalyticsEvent("demo-113", "demo.start");
  const evt2 = createAnalyticsEvent("demo-113", "step.view", { stepIndex: 1 });

  const result = processBatchedAnalyticsIngestion({
    sessionId: "vsess-123",
    events: [evt1, evt2]
  });

  assert.equal(result.acceptedCount, 2);
  assert.equal(result.rejectedCount, 0);
  assert.equal(result.status, "accepted");

  // Oversized batch rejection
  const hugeBatch = new Array(60).fill(evt1);
  const rejectedResult = processBatchedAnalyticsIngestion(
    {
      sessionId: "vsess-123",
      events: hugeBatch
    },
    50
  );

  assert.equal(rejectedResult.status, "rejected");
});
