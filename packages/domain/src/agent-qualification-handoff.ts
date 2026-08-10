/**
 * Agent Lead Qualification Rules & Human Handoff Engine — TASK-166
 */

export interface LeadQualificationResult {
  readonly leadId: string;
  readonly score: number;
  readonly isQualified: boolean;
  readonly needsHumanHandoff: boolean;
}

export function evaluateLeadQualification(
  answers: Readonly<Record<string, string>>,
  minScoreThreshold = 70
): LeadQualificationResult {
  let score = 0;

  if (answers["company_size"] === "enterprise") score += 50;
  if (answers["timeline"] === "immediate") score += 30;
  if (answers["budget"] === "approved") score += 20;

  const isQualified = score >= minScoreThreshold;

  return Object.freeze({
    leadId: `lead_${Math.random().toString(36).slice(2, 10)}`,
    score,
    isQualified,
    needsHumanHandoff: isQualified
  });
}
