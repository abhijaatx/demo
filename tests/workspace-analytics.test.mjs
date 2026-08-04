import assert from "node:assert/strict";
import { test } from "node:test";
import { generateWorkspaceAnalyticsPortfolio } from "@supademo/domain";

test("generateWorkspaceAnalyticsPortfolio aggregates views across workspace demos and ranks top demos", () => {
  const d1 = { demoId: "d1", totalViews: 100, totalCompletions: 80, funnelSteps: [] };
  const d2 = { demoId: "d2", totalViews: 550, totalCompletions: 400, funnelSteps: [] };

  const portfolio = generateWorkspaceAnalyticsPortfolio("ws-analytics-1", [d1, d2]);

  assert.equal(portfolio.workspaceId, "ws-analytics-1");
  assert.equal(portfolio.totalDemosCount, 2);
  assert.equal(portfolio.totalWorkspaceViews, 650);
  assert.equal(portfolio.totalWorkspaceCompletions, 480);
  assert.equal(portfolio.topDemos[0].demoId, "d2");
  assert.equal(portfolio.topDemos[0].totalViews, 550);
});
