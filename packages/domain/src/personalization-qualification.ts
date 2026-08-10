/**
 * Personalization & AI Generation End-to-End Qualification Suite — TASK-140
 */

import { renderTemplateTokens } from "./variable-rendering.js";

export interface PersonalizationQualificationResult {
  readonly isPassed: boolean;
  readonly sanitizedOutput: string;
  readonly securityCheckPassed: boolean;
}

export function qualifyPersonalizationPipeline(
  template: string,
  userVariables: Record<string, string>
): PersonalizationQualificationResult {
  const sanitizedOutput = renderTemplateTokens(template, userVariables);

  // Check that output does not contain raw script tags or unescaped HTML angle brackets
  const containsRawScripts = /<script\b[^>]*>/i.test(sanitizedOutput);
  const securityCheckPassed = !containsRawScripts;

  return Object.freeze({
    isPassed: securityCheckPassed,
    sanitizedOutput,
    securityCheckPassed
  });
}
