/**
 * AI Demo Audit & Optimization Recommendations — TASK-169
 */

export interface DemoAuditScore {
  readonly overallScore: number;
  readonly copyScore: number;
  readonly flowScore: number;
  readonly accessibilityScore: number;
  readonly recommendations: readonly string[];
}

export function performAiDemoAudit(stepCount: number, totalWordCount: number): DemoAuditScore {
  let copyScore = 90;
  let flowScore = 85;
  const accessibilityScore = 95;
  const recs: string[] = [];

  if (stepCount > 15) {
    flowScore -= 20;
    recs.push("Demo contains over 15 steps; consider splitting into shorter focused demos.");
  }

  const avgWords = stepCount > 0 ? totalWordCount / stepCount : 0;
  if (avgWords > 30) {
    copyScore -= 20;
    recs.push(
      "Average words per step exceeds 30 words; simplify copy for higher viewer engagement."
    );
  }

  const overallScore = Math.round((copyScore + flowScore + accessibilityScore) / 3);

  return Object.freeze({
    overallScore,
    copyScore,
    flowScore,
    accessibilityScore,
    recommendations: Object.freeze(recs)
  });
}
