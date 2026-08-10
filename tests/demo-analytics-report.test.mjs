import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsEvent, generateDemoAnalyticsSummary } from "@supademo/domain";

test("generateDemoAnalyticsSummary computes step view counts and drop-off rates", () => {
  const titles = ["Step 1", "Step 2", "Step 3"];
  const events = [
    createAnalyticsEvent("demo-116", "demo.start"),
    createAnalyticsEvent("demo-116", "step.view", { stepIndex: 0 }),
    createAnalyticsEvent("demo-116", "step.view", { stepIndex: 1 }),
    // Step 2 not viewed (drop-off)
    createAnalyticsEvent("demo-116", "demo.complete")
  ];

  const summary = generateDemoAnalyticsSummary("demo-116", titles, events);

  assert.equal(summary.totalViews, 1);
  assert.equal(summary.totalCompletions, 1);
  assert.equal(summary.funnelSteps[0].viewsCount, 1);
  assert.equal(summary.funnelSteps[1].viewsCount, 1);
  assert.equal(summary.funnelSteps[2].viewsCount, 0);
  assert.equal(summary.funnelSteps[2].dropOffRatePercent, 100);
});
