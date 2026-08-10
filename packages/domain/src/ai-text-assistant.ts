/**
 * AI Text & Script Copywriting Assistant — TASK-136
 */

import { executeMockAiGateway } from "./ai-gateway.js";

export type RewriteTone = "professional" | "concise" | "casual" | "persuasive";

export interface TextRewriteProposal {
  readonly originalText: string;
  readonly proposedText: string;
  readonly tone: RewriteTone;
  readonly isApplied: boolean;
}

function sanitizeAiText(value: string): string {
  const withoutControls = Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("");
  return withoutControls
    .replace(/<[^>]*>/g, "")
    .slice(0, 4_000)
    .trim();
}

export async function proposeTextRewrite(
  originalText: string,
  tone: RewriteTone = "professional"
): Promise<TextRewriteProposal> {
  const aiRes = await executeMockAiGateway({
    promptId: "text-rewrite-v1",
    systemPrompt: `You are an expert SaaS copywriter. Rewrite text in a ${tone} tone.`,
    userPrompt: originalText
  });

  // The proposal is rendered through React text nodes by callers. Keep it as
  // bounded plain text rather than pre-escaping it into visible entities.
  const sanitizedProposal = sanitizeAiText(aiRes.rawText);

  return Object.freeze({
    originalText,
    proposedText: sanitizedProposal,
    tone,
    isApplied: false
  });
}
