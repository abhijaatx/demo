import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startRecordingSession,
  addCapturedStep,
  createCapturedScreenshotRecord,
  createCapturedClickContext,
  finalizeRecordingToDemoDocument,
  publishDemoDocument,
  isUrlAllowedForCapture
} from "@supademo/domain";

test("Browser recorder qualification: E2E capture-to-publish workflow", () => {
  // 1. Start recording session
  let session = startRecordingSession("rec-qual-1", "screenshot");

  // 2. Add step 1 (SPA step)
  const shot1 = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click1 = createCapturedClickContext({
    xPercent: 15,
    yPercent: 30,
    pageTitle: "Dashboard Overview",
    rawUrl: "https://app.supademo.com/dashboard?tab=overview",
    elementHint: "button#analytics"
  });
  session = addCapturedStep(session, shot1, click1);

  // 3. Add step 2 (gated step with sensitive token in URL)
  const shot2 = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click2 = createCapturedClickContext({
    xPercent: 60,
    yPercent: 75,
    pageTitle: "Billing Preferences",
    rawUrl: "https://app.supademo.com/billing?token=secret123&password=pass",
    elementHint: "button#update-card"
  });
  session = addCapturedStep(session, shot2, click2);

  // 4. Finalize recording to demo document
  const draftDoc = finalizeRecordingToDemoDocument(session, "ws-qual-1");
  assert.equal(draftDoc.steps.length, 2);
  assert.equal(draftDoc.steps[0].hotspots[0].tooltipText, "Click button#analytics");

  // 5. Publish demo document
  const manifest = publishDemoDocument(draftDoc, 0);
  assert.equal(manifest.demoId, draftDoc.demoId);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.document.steps.length, 2);
});

test("Browser recorder qualification: Privacy corpus validation", () => {
  const policy = {
    allowedDomains: ["supademo.com"],
    deniedDomains: ["admin.internal.supademo.com"],
    excludedCssSelectors: [".pII-data"],
    maskInputFields: true
  };

  assert.equal(isUrlAllowedForCapture("https://app.supademo.com/welcome", policy), true);
  assert.equal(isUrlAllowedForCapture("https://admin.internal.supademo.com/root", policy), false);
});
