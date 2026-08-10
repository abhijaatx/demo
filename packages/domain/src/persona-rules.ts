/**
 * Persona Rules & Declarative Conditional Content Evaluator — TASK-133
 */

export interface ConditionalRule {
  readonly ruleId: string;
  readonly variableName: string;
  readonly equalsValue: string;
  readonly overrideText: string;
}

export function evaluateConditionalText(
  baseText: string,
  rules: readonly ConditionalRule[],
  viewerVariables: Readonly<Record<string, string>>
): string {
  for (const rule of rules) {
    const varValue = viewerVariables[rule.variableName.toLowerCase()];
    if (varValue && varValue.toLowerCase() === rule.equalsValue.toLowerCase()) {
      return rule.overrideText;
    }
  }

  return baseText;
}
