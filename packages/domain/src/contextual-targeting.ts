/**
 * Contextual In-App Widget & Tour Targeting Engine — TASK-154
 */

export interface TargetingRule {
  readonly ruleId: string;
  readonly urlPattern: string;
  readonly elementSelector?: string | undefined;
  readonly frequencyCapMaxPerSession: number;
}

export function createTargetingRule(
  ruleId: string,
  urlPattern: string,
  elementSelector?: string,
  frequencyCapMaxPerSession = 3
): TargetingRule {
  if (!ruleId.trim() || !urlPattern.trim()) {
    throw new Error("Targeting rule requires rule ID and URL pattern.");
  }

  return Object.freeze({
    ruleId: ruleId.trim(),
    urlPattern: urlPattern.trim(),
    elementSelector: elementSelector?.trim(),
    frequencyCapMaxPerSession
  });
}

export function evaluateTargetingRule(
  rule: TargetingRule,
  currentUrl: string,
  sessionImpressionCount: number
): boolean {
  if (sessionImpressionCount >= rule.frequencyCapMaxPerSession) {
    return false;
  }

  try {
    const regex = new RegExp(rule.urlPattern.replaceAll("*", ".*"), "i");
    return regex.test(currentUrl);
  } catch {
    return false;
  }
}
