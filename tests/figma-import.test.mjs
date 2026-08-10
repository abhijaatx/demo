import assert from "node:assert/strict";
import { test } from "node:test";
import { createFigmaImportPayload, convertFigmaFramesToDemoDocument } from "@supademo/domain";

test("createFigmaImportPayload & convertFigmaFramesToDemoDocument converts Figma frames into demo steps", () => {
  const frame1 = {
    frameId: "f1",
    frameName: "Login",
    imageUrl: "https://figma.com/f1.png",
    widthPx: 1440,
    heightPx: 900,
    orderIndex: 0
  };
  const frame2 = {
    frameId: "f2",
    frameName: "Dashboard",
    imageUrl: "https://figma.com/f2.png",
    widthPx: 1440,
    heightPx: 900,
    orderIndex: 1
  };

  const payload = createFigmaImportPayload("fig-123", [frame2, frame1]); // passed out-of-order
  assert.equal(payload.frames[0].frameId, "f1"); // sorted

  const doc = convertFigmaFramesToDemoDocument(payload, "ws-figma-1");
  assert.equal(doc.workspaceId, "ws-figma-1");
  assert.equal(doc.steps.length, 2);
  assert.equal(doc.steps[0].title, "Login");
  assert.equal(doc.steps[1].title, "Dashboard");
});
