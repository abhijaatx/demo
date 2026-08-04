/**
 * Text & Data Overrides for Sandboxed HTML Demos — TASK-146
 */

import { escapeHtml } from "./variable-rendering.js";

export interface DataOverlayRule {
  readonly selector: string;
  readonly originalText: string;
  readonly overrideText: string;
}

export function applyDataOverlays(htmlContent: string, rules: readonly DataOverlayRule[]): string {
  let result = htmlContent;

  for (const rule of rules) {
    if (!rule.originalText || !rule.overrideText) continue;
    const safeReplacement = escapeHtml(rule.overrideText);
    result = result.replaceAll(rule.originalText, safeReplacement);
  }

  return result;
}
