import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  DEVICE_PRESETS,
  initializeViewerPlayback,
  sanitizeViewerDocument
} from "@supademo/domain";

test("DEVICE_PRESETS defines expected device viewport dimensions and frame types", () => {
  assert.equal(DEVICE_PRESETS.desktop.widthPx, 1280);
  assert.equal(DEVICE_PRESETS.desktop.frame, "browser");

  assert.equal(DEVICE_PRESETS.macbook.widthPx, 1440);
  assert.equal(DEVICE_PRESETS.macbook.frame, "macbook");

  assert.equal(DEVICE_PRESETS.mobile.widthPx, 375);
  assert.equal(DEVICE_PRESETS.mobile.frame, "iphone");
});

test("initializeViewerPlayback creates initial playback state", () => {
  const doc = createDefaultDemoDocument("demo-prev-1");
  const state = initializeViewerPlayback(doc);

  assert.equal(state.currentStepIndex, 0);
  assert.equal(state.totalSteps, 0);
  assert.equal(state.isPlaying, false);
  assert.equal(state.isCompleted, false);
  assert.equal(state.hotspotsClickable, true);
});

test("sanitizeViewerDocument returns clean document for viewer playback", () => {
  const doc = createDefaultDemoDocument("demo-prev-2");
  const sanitized = sanitizeViewerDocument(doc);

  assert.equal(sanitized.demoId, "demo-prev-2");
  assert.equal(sanitized.version, doc.version);
});
