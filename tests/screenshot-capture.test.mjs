import assert from "node:assert/strict";
import { test } from "node:test";
import { createCapturedScreenshotRecord } from "@supademo/domain";

test("createCapturedScreenshotRecord validates dimensions and clamps maximum pixel size", () => {
  const record = createCapturedScreenshotRecord("viewport", 1920, 1080, 2.0);

  assert.equal(record.mode, "viewport");
  assert.equal(record.widthPx, 1920);
  assert.equal(record.heightPx, 1080);
  assert.equal(record.devicePixelRatio, 2.0);
  assert.ok(record.captureId.startsWith("cap-"));

  const clamped = createCapturedScreenshotRecord("fullpage", 10000, 10000);
  assert.equal(clamped.widthPx, 8192); // clamped max limit
  assert.equal(clamped.heightPx, 8192);
});
