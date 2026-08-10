import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startRecordingSession,
  addCapturedStep,
  undoLastStep,
  pauseRecording,
  resumeRecording,
  createCapturedScreenshotRecord,
  createCapturedClickContext
} from "@supademo/domain";

test("Recording session captures steps and deduplicates rapid clicks", () => {
  let session = startRecordingSession("rec-1", "screenshot");
  assert.equal(session.status, "recording");

  const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click = createCapturedClickContext({ xPercent: 10, yPercent: 20 });

  session = addCapturedStep(session, shot, click);
  assert.equal(session.steps.length, 1);

  // Rapid duplicate click within 300ms at same coordinates is ignored
  session = addCapturedStep(session, shot, click);
  assert.equal(session.steps.length, 1);

  session = undoLastStep(session);
  assert.equal(session.steps.length, 0);

  session = pauseRecording(session);
  assert.equal(session.status, "paused");

  session = resumeRecording(session);
  assert.equal(session.status, "recording");
});
