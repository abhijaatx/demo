import assert from "node:assert/strict";
import { test } from "node:test";
import { createDesktopCaptureSession, updateDesktopCaptureProgress } from "@supademo/domain";

test("createDesktopCaptureSession & updateDesktopCaptureProgress track byte upload metrics", () => {
  let session = createDesktopCaptureSession("screen-1");

  assert.equal(session.sourceId, "screen-1");
  assert.equal(session.capturedBytes, 0);

  session = updateDesktopCaptureProgress(session, 1048576); // +1MB
  assert.equal(session.capturedBytes, 1048576);

  assert.throws(() => updateDesktopCaptureProgress(session, -100), /non-negative/);
});
