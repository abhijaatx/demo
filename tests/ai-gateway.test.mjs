import assert from "node:assert/strict";
import { test } from "node:test";
import { executeMockAiGateway } from "@supademo/domain";

test("executeMockAiGateway processes requests securely and computes usage tokens", async () => {
  const req = {
    promptId: "prompt-1",
    systemPrompt: "You are a helpful assistant.",
    userPrompt: "Generate a summary for this step"
  };

  const res = await executeMockAiGateway(req);

  assert.equal(res.requestId.startsWith("ai-req-"), true);
  assert.equal(res.rawText.includes("AI Generated Response"), true);
  assert.equal(res.usageTokens > 0, true);
});
