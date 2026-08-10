import assert from "node:assert/strict";
import { test } from "node:test";
import { createMobileImportItem, detectOrientation } from "@supademo/domain";

test("createMobileImportItem detects orientation and assigns device frame presets", () => {
  const item1 = createMobileImportItem("img-1", 1170, 2532, "iphone-15-pro");
  assert.equal(item1.orientation, "portrait");
  assert.equal(item1.deviceFrame, "iphone-15-pro");

  const item2 = createMobileImportItem("img-2", 2532, 1170, "pixel-8");
  assert.equal(item2.orientation, "landscape");

  assert.equal(detectOrientation(1000, 1000), "portrait");
});
