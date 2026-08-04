import assert from "node:assert/strict";
import { test } from "node:test";
import { createScreenRecordingSession, calculateChunkLayout } from "@supademo/domain";

test("createScreenRecordingSession normalizes duration and chunk boundaries", () => {
  const session = createScreenRecordingSession("tab", 300, 5000);

  assert.equal(session.mode, "tab");
  assert.equal(session.maxDurationSeconds, 300);
  assert.equal(session.chunkIntervalMs, 5000);
  assert.ok(session.sessionId.startsWith("rec-scr-"));
});

test("calculateChunkLayout calculates total chunk count accurately", () => {
  const layout = calculateChunkLayout(12.5, 5000);

  assert.equal(layout.totalChunks, 3);
  assert.equal(layout.chunkDurationSec, 5);
});
