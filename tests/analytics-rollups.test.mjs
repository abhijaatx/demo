import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsEvent, computeAnalyticsRollup } from "@supademo/domain";

test("computeAnalyticsRollup aggregates starts, loads, and completion rates accurately", () => {
  const events = [
    createAnalyticsEvent("demo-115", "demo.load"),
    createAnalyticsEvent("demo-115", "demo.start"),
    createAnalyticsEvent("demo-115", "step.view", { stepIndex: 1 }),
    createAnalyticsEvent("demo-115", "demo.complete")
  ];

  const rollup = computeAnalyticsRollup("demo-115", "2026-07-28", events);

  assert.equal(rollup.totalLoads, 1);
  assert.equal(rollup.totalStarts, 1);
  assert.equal(rollup.totalCompletions, 1);
  assert.equal(rollup.completionRatePercent, 100);
});
