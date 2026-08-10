import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startRecordingSession,
  addCapturedStep,
  createCapturedScreenshotRecord,
  createCapturedClickContext,
  saveRecordingJournalDraft,
  loadRecordingJournalDraft,
  clearRecordingJournalDraft
} from "@supademo/domain";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

test("Recording journal draft is saved and recovered across service worker suspensions", () => {
  let session = startRecordingSession("rec-journal-1", "screenshot");
  const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
  const click = createCapturedClickContext({ xPercent: 50, yPercent: 50 });
  session = addCapturedStep(session, shot, click);

  saveRecordingJournalDraft(session);
  const recovered = loadRecordingJournalDraft("rec-journal-1");

  assert.ok(recovered);
  assert.equal(recovered.id, "rec-journal-1");
  assert.equal(recovered.steps.length, 1);

  clearRecordingJournalDraft("rec-journal-1");
  assert.equal(loadRecordingJournalDraft("rec-journal-1"), null);
});

test("50+ step recording session benchmark remains responsive under 50ms", () => {
  let session = startRecordingSession("rec-50-steps", "screenshot");
  const start = performance.now();

  for (let i = 0; i < 55; i++) {
    const shot = createCapturedScreenshotRecord("viewport", 1920, 1080);
    const click = createCapturedClickContext({
      xPercent: (i * 1.5) % 100,
      yPercent: (i * 1.8) % 100
    });
    session = addCapturedStep(session, shot, click);
  }

  saveRecordingJournalDraft(session);
  const duration = performance.now() - start;

  assert.equal(session.steps.length, 55);
  assert.ok(duration < 50, `55-step session took ${duration.toFixed(2)}ms, expected < 50ms`);
});
