/**
 * Bounded DOM Snapshot Capturer & Element Sanitizer — TASK-142
 */

import {
  createHtmlCloningPolicyConfig,
  type HtmlCloningPolicyConfig
} from "./html-cloning-policy.js";

export interface DomNodeSnapshot {
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly textContent?: string | undefined;
  readonly children: readonly DomNodeSnapshot[];
}

export function captureDomNode(
  tagName: string,
  attributes: Record<string, string> = {},
  textContent?: string,
  children: readonly DomNodeSnapshot[] = [],
  policy: HtmlCloningPolicyConfig = createHtmlCloningPolicyConfig()
): DomNodeSnapshot | null {
  const cleanTag = tagName.toLowerCase();
  if (policy.disallowedTags.includes(cleanTag)) {
    return null; // Exclude forbidden tags (script, object, etc.)
  }

  const cleanAttrs: Record<string, string> = {};
  Object.entries(attributes).forEach(([attrKey, attrVal]) => {
    const cleanAttr = attrKey.toLowerCase();
    if (!policy.disallowedAttributes.includes(cleanAttr)) {
      cleanAttrs[cleanAttr] = attrVal;
    }
  });

  return Object.freeze({
    tagName: cleanTag,
    attributes: Object.freeze(cleanAttrs),
    textContent,
    children: Object.freeze([...children])
  });
}
