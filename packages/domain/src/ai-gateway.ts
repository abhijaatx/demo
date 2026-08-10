/**
 * Server-Side AI Gateway & Provider Abstraction — TASK-135
 */

export interface AiPromptRequest {
  readonly promptId: string;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly maxTokens?: number;
}

export interface AiGatewayResponse {
  readonly requestId: string;
  readonly rawText: string;
  readonly usageTokens: number;
}

export async function executeMockAiGateway(request: AiPromptRequest): Promise<AiGatewayResponse> {
  if (!request.userPrompt.trim()) {
    throw new Error("AI gateway prompt cannot be empty.");
  }

  const requestId = `ai-req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const rawText = `[AI Generated Response to: ${request.userPrompt.trim().slice(0, 30)}]`;
  const usageTokens = Math.min(
    request.maxTokens ?? 500,
    Math.ceil(request.userPrompt.length / 4) + 20
  );

  return Object.freeze({
    requestId,
    rawText,
    usageTokens
  });
}
