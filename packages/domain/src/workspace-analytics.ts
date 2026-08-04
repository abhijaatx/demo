/**
 * Workspace Portfolio Analytics & Top Performing Demos — TASK-117
 */

import type { DemoAnalyticsSummary } from "./demo-analytics-report.js";

export interface WorkspaceAnalyticsPortfolio {
  readonly workspaceId: string;
  readonly totalDemosCount: number;
  readonly totalWorkspaceViews: number;
  readonly totalWorkspaceCompletions: number;
  readonly topDemos: readonly { readonly demoId: string; readonly totalViews: number }[];
}

export function generateWorkspaceAnalyticsPortfolio(
  workspaceId: string,
  demoSummaries: readonly DemoAnalyticsSummary[]
): WorkspaceAnalyticsPortfolio {
  let totalWorkspaceViews = 0;
  let totalWorkspaceCompletions = 0;

  const topDemos = demoSummaries
    .map((s) => {
      totalWorkspaceViews += s.totalViews;
      totalWorkspaceCompletions += s.totalCompletions;
      return Object.freeze({ demoId: s.demoId, totalViews: s.totalViews });
    })
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

  return Object.freeze({
    workspaceId,
    totalDemosCount: demoSummaries.length,
    totalWorkspaceViews,
    totalWorkspaceCompletions,
    topDemos: Object.freeze(topDemos)
  });
}
