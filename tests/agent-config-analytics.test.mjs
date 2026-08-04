import assert from "node:assert/strict";
import { test } from "node:test";
import { createAgentFullConfig, generateAgentAnalyticsSummary } from "@supademo/domain";

test("createAgentFullConfig and generateAgentAnalyticsSummary handle config and analytics", () => {
  const cfg = createAgentFullConfig("ag-168", "ws-1", "professional");
  assert.equal(cfg.agentId, "ag-168");
  assert.equal(cfg.systemTone, "professional");

  const analytics = generateAgentAnalyticsSummary(10, 4);
  assert.equal(analytics.totalConversations, 10);
  assert.equal(analytics.leadsQualified, 4);
  assert.equal(analytics.conversionRatePercent, 40);
});
