import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("crop media workbench keeps framing metadata bounded and local", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/crop-media/page.tsx"),
    readWebFile("components/crop-media-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /CropMediaWorkbench/u);
  assert.match(surface, /MAX_ASSETS = 8/u);
  assert.match(surface, /MAX_FILE_BYTES = 12 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_IMAGE_BYTES = 1_200_000/u);
  assert.match(surface, /validateCropMetadata/u);
  assert.match(surface, /Apply to other steps/u);
  assert.match(surface, /Cover/u);
  assert.match(surface, /Contain/u);
  assert.match(surface, /Download crop plan/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.crop-media-workspace/u);
  assert.match(css, /\.crop-media-preview-frame/u);
});
