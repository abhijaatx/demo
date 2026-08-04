/**
 * AI Text & Script Copywriting Assistant — TASK-136
 */

import { executeMockAiGateway } from "./ai-gateway.js";
import { escapeHtml } from "./variable-rendering.js";

export type RewriteTone = "professional" | "concise" | "casual" | "persuasive";

export interface TextRewriteProposal {
  readonly originalText: string;
  readonly proposedText: string;
  readonly tone: RewriteTone;
  readonly isApplied: boolean;
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

  const sanitizedProposal = escapeHtml(aiRes.rawText);

  return Object.freeze({
    originalText,
    proposedText: sanitizedProposal,
    tone,
    isApplied: false
  });
}
