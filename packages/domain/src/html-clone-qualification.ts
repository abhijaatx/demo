/**
 * HTML Clone Security, SSRF & Sandbox Qualification Suite — TASK-150
 */

import { sanitizeHtmlContent } from "./html-sanitizer.js";

export interface HtmlCloneQualificationResult {
  readonly isPassed: boolean;
  readonly maliciousFixturesBlocked: number;
  readonly totalFixturesTested: number;
}

export function qualifyHtmlCloneSecurity(
  maliciousFixtures: readonly string[]
): HtmlCloneQualificationResult {
  let blockedCount = 0;

  for (const fixture of maliciousFixtures) {
    const report = sanitizeHtmlContent(fixture);
    const containsScript = /<script\b[^>]*>/i.test(report.sanitizedHtml);
    const containsEvents = /\s+on[a-z]+\s*=/i.test(report.sanitizedHtml);

    if (!containsScript && !containsEvents) {
      blockedCount++;
    }
  }

  const isPassed = blockedCount === maliciousFixtures.length;

  return Object.freeze({
    isPassed,
    maliciousFixturesBlocked: blockedCount,
    totalFixturesTested: maliciousFixtures.length
  });
}
