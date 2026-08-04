import assert from "node:assert/strict";
import { test } from "node:test";
import { proposeTextRewrite } from "@supademo/domain";

test("proposeTextRewrite generates sanitized copy proposals", async () => {
  const proposal = await proposeTextRewrite("Click the button to sign up", "concise");

  assert.equal(proposal.originalText, "Click the button to sign up");
  assert.equal(proposal.tone, "concise");
  assert.equal(proposal.isApplied, false);
  assert.equal(proposal.proposedText.length > 0, true);
  assert.equal(proposal.proposedText.includes("&lt;"), false);
});
