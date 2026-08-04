import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startRecordingSession,
  addCapturedStep,
  createCapturedScreenshotRecord,
  createCapturedClickContext,
  generateCaptureDiagnostics,
  remapStepAnchor
} from "@supademo/domain";

test("generateCaptureDiagnostics creates sanitized reports", () => {
  let session = startRecordingSession("rec-diag-1", "screenshot");
  const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click = createCapturedClickContext({
    xPercent: 10,
    yPercent: 20,
    pageTitle: "Home",
    rawUrl: "https://example.com/app?token=secret123"
  });
  session = addCapturedStep(session, shot, click);

  const diag = generateCaptureDiagnostics(session);
  assert.equal(diag.sessionId, "rec-diag-1");
  assert.equal(diag.capturedStepsCount, 1);
  assert.equal(diag.sanitizedLogs[0].includes("token="), false);
});

test("remapStepAnchor enforces confidence threshold >= 0.8", () => {
  let session = startRecordingSession("rec-remap-1", "screenshot");
  const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click1 = createCapturedClickContext({ xPercent: 10, yPercent: 20 });
  const click2 = createCapturedClickContext({ xPercent: 12, yPercent: 22 });
  session = addCapturedStep(session, shot, click1);

  const step = session.steps[0];
  const remapped = remapStepAnchor(step, click2, 0.95);
  assert.equal(remapped.clickContext.xPercent, 12);

  assert.throws(() => remapStepAnchor(step, click2, 0.5), /low confidence score/);
});
