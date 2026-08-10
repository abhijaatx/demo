import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startRecordingSession,
  addCapturedStep,
  createCapturedScreenshotRecord,
  createCapturedClickContext,
  finalizeRecordingToDemoDocument
} from "@supademo/domain";

test("finalizeRecordingToDemoDocument converts captured steps into a demo document with hotspots", () => {
  let session = startRecordingSession("rec-fin-1", "screenshot");
  const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click = createCapturedClickContext({
    xPercent: 25,
    yPercent: 75,
    pageTitle: "Checkout Step",
    elementHint: "button#buy-now"
  });

  session = addCapturedStep(session, shot, click);
  const doc = finalizeRecordingToDemoDocument(session, "ws-123");

  assert.equal(doc.workspaceId, "ws-123");
  assert.equal(doc.steps.length, 1);
  assert.equal(doc.steps[0].title, "Checkout Step");
  assert.equal(doc.steps[0].hotspots[0].x, 25);
  assert.equal(doc.steps[0].hotspots[0].y, 75);
  assert.equal(doc.steps[0].hotspots[0].tooltipText, "Click button#buy-now");
});
