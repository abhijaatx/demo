import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCropMetadata, generateRedactionBurnInManifest } from "@supademo/domain";

test("validateCropMetadata clamps normalized crop percentages", () => {
  const crop = validateCropMetadata({ x: -10, y: 0, width: 80, height: 120 });
  assert.equal(crop.x, 0);
  assert.equal(crop.y, 0);
  assert.equal(crop.width, 80);
  assert.equal(crop.height, 100);
});

test("generateRedactionBurnInManifest calculates pixel coordinates for worker burn-in", () => {
  const crop = { x: 10, y: 10, width: 80, height: 80 };
  const redactions = [
    { id: "red-1", x: 20, y: 20, width: 10, height: 10, isPermanent: true },
    { id: "red-draft", x: 50, y: 50, width: 10, height: 10, isPermanent: false }
  ];

  const manifest = generateRedactionBurnInManifest("ast-100", 1920, 1080, crop, redactions);
  assert.equal(manifest.assetId, "ast-100");
  assert.equal(manifest.cropPx.left, 192); // 10% of 1920
  assert.equal(manifest.cropPx.top, 108); // 10% of 1080
  assert.equal(manifest.redactionsPx.length, 1); // only permanent redactions included
  assert.equal(manifest.redactionsPx[0].id, "red-1");
  assert.equal(manifest.redactionsPx[0].left, 384); // 20% of 1920
});
