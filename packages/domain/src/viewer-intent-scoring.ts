/**
 * Viewer Intent Scoring & Account Engagement Signals — TASK-118
 */

export type IntentScoreTier = "low" | "medium" | "high" | "hot";

export interface ViewerIntentSignal {
  readonly sessionId: string;
  readonly completionRatePercent: number;
  readonly timeSpentSeconds: number;
  readonly hasClickedCta: boolean;
  readonly intentScore: number;
  readonly intentTier: IntentScoreTier;
}

export function calculateViewerIntentScore(
  sessionId: string,
  completionRatePercent: number,
  timeSpentSeconds: number,
  hasClickedCta: boolean
): ViewerIntentSignal {
  const completionWeight = Math.min(50, (completionRatePercent / 100) * 50);
  const timeWeight = Math.min(30, (timeSpentSeconds / 60) * 15); // up to 30 pts for 2 mins
  const ctaWeight = hasClickedCta ? 20 : 0;

  const rawScore = Math.round(completionWeight + timeWeight + ctaWeight);
  const intentScore = Math.min(100, Math.max(0, rawScore));

  let intentTier: IntentScoreTier = "low";
  if (intentScore >= 80) intentTier = "hot";
  else if (intentScore >= 50) intentTier = "high";
  else if (intentScore >= 25) intentTier = "medium";

  return Object.freeze({
    sessionId,
    completionRatePercent,
    timeSpentSeconds,
    hasClickedCta,
    intentScore,
    intentTier
  });
}
