import assert from "node:assert/strict";
import { test } from "node:test";
import { proposeVideoToDemoSteps } from "@supademo/domain";

test("proposeVideoToDemoSteps converts scene cuts into proposed demo steps", () => {
  const cuts = [
    { timestampSeconds: 5.2, confidenceScore: 0.92, candidateTitle: "Intro Screen" },
    { timestampSeconds: 12.8, confidenceScore: 0.88, candidateTitle: "Click Action" }
  ];

  const doc = proposeVideoToDemoSteps("vid-100", cuts, "ws-v2d-1");

  assert.equal(doc.workspaceId, "ws-v2d-1");
  assert.equal(doc.steps.length, 2);
  assert.equal(doc.steps[0].title, "Intro Screen");
  assert.equal(doc.steps[0].media.assetType, "video");
  assert.equal(doc.steps[0].media.durationSeconds, 5.2);
});
