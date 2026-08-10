/**
 * Daily/Hourly Analytics Aggregations & Completion Rate Rollups — TASK-115
 */

import type { AnalyticsEvent } from "./analytics-contract.js";

export interface AnalyticsRollupAggregate {
  readonly demoId: string;
  readonly periodKey: string;
  readonly totalLoads: number;
  readonly totalStarts: number;
  readonly totalCompletions: number;
  readonly completionRatePercent: number;
}

export function computeAnalyticsRollup(
  demoId: string,
  periodKey: string,
  events: readonly AnalyticsEvent[]
): AnalyticsRollupAggregate {
  let loads = 0;
  let starts = 0;
  let completions = 0;

  events.forEach((evt) => {
    if (evt.demoId !== demoId) return;

    if (evt.kind === "demo.load") loads++;
    else if (evt.kind === "demo.start") starts++;
    else if (evt.kind === "demo.complete") completions++;
  });

  const completionRatePercent = starts > 0 ? Math.round((completions / starts) * 100) : 0;

  return Object.freeze({
    demoId,
    periodKey,
    totalLoads: loads,
    totalStarts: starts,
    totalCompletions: completions,
    completionRatePercent
  });
}
