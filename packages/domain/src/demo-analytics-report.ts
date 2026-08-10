/**
 * Individual Demo Analytics Report, Funnel Analysis & Step Drop-off — TASK-116
 */

import type { AnalyticsEvent } from "./analytics-contract.js";

export interface StepDropOffMetric {
  readonly stepIndex: number;
  readonly stepTitle: string;
  readonly viewsCount: number;
  readonly dropOffRatePercent: number;
}

export interface DemoAnalyticsSummary {
  readonly demoId: string;
  readonly totalViews: number;
  readonly totalCompletions: number;
  readonly funnelSteps: readonly StepDropOffMetric[];
}

export function generateDemoAnalyticsSummary(
  demoId: string,
  stepTitles: readonly string[],
  events: readonly AnalyticsEvent[]
): DemoAnalyticsSummary {
  const stepViewCounts: number[] = new Array(stepTitles.length).fill(0);
  let totalViews = 0;
  let totalCompletions = 0;

  events.forEach((evt) => {
    if (evt.demoId !== demoId) return;

    if (evt.kind === "demo.start") {
      totalViews++;
    } else if (evt.kind === "demo.complete") {
      totalCompletions++;
    } else if (evt.kind === "step.view") {
      const idxVal = evt.metadata["stepIndex"];
      const idx = typeof idxVal === "number" ? idxVal : 0;
      if (idx >= 0 && idx < stepTitles.length && stepViewCounts[idx] !== undefined) {
        stepViewCounts[idx] = (stepViewCounts[idx] ?? 0) + 1;
      }
    }
  });

  const funnelSteps: StepDropOffMetric[] = stepTitles.map((title, idx) => {
    const currentViews = stepViewCounts[idx] ?? 0;
    const prevViews = idx === 0 ? totalViews || currentViews : (stepViewCounts[idx - 1] ?? 0);

    const dropOffCount = Math.max(0, prevViews - currentViews);
    const dropOffRatePercent = prevViews > 0 ? Math.round((dropOffCount / prevViews) * 100) : 0;

    return Object.freeze({
      stepIndex: idx,
      stepTitle: title,
      viewsCount: currentViews,
      dropOffRatePercent
    });
  });

  return Object.freeze({
    demoId,
    totalViews,
    totalCompletions,
    funnelSteps: Object.freeze(funnelSteps)
  });
}
