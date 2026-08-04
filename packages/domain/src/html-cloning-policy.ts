/**
 * HTML-Cloning Security Threat Model, CSP Rules & Sandbox Policy — TASK-141
 */

export interface HtmlCloningPolicyConfig {
  readonly maxDomDepth: number;
  readonly maxNodeCount: number;
  readonly disallowedTags: readonly string[];
  readonly disallowedAttributes: readonly string[];
  readonly sandboxFlags: string;
}

export function createHtmlCloningPolicyConfig(): HtmlCloningPolicyConfig {
  return Object.freeze({
    maxDomDepth: 50,
    maxNodeCount: 10000,
    disallowedTags: Object.freeze(["script", "iframe", "object", "embed", "form", "base", "meta"]),
    disallowedAttributes: Object.freeze(["onclick", "onload", "onerror", "onmouseover", "onfocus"]),
    sandboxFlags: "allow-same-origin" // strict sandbox (no allow-scripts by default)
  });
}
