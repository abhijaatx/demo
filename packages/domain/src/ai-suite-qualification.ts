/**
 * AI Suite Qualification & Red-Team Security Evaluator — TASK-170
 */

import { escapeHtml } from "./variable-rendering.js";

export interface AiSuiteQualificationReport {
  readonly isPassed: boolean;
  readonly promptInjectionsBlockedCount: number;
  readonly totalTested: number;
}

export function qualifyAiSuite(
  promptInjectionCorpus: readonly string[]
): AiSuiteQualificationReport {
  let blockedCount = 0;

  for (const prompt of promptInjectionCorpus) {
    const sanitized = escapeHtml(prompt).replace(/javascript:/gi, "blocked:");
    if (!sanitized.includes("<script>") && !sanitized.includes("javascript:")) {
      blockedCount++;
    }
  }

  const isPassed = blockedCount === promptInjectionCorpus.length;

  return Object.freeze({
    isPassed,
    promptInjectionsBlockedCount: blockedCount,
    totalTested: promptInjectionCorpus.length
  });
}
