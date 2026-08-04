import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("upload import workbench keeps local media bounded and supports editor handoff", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/upload/page.tsx"),
    readWebFile("components/upload-import-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /UploadImportWorkbench/u);
  assert.match(surface, /MAX_ASSETS = 8/u);
  assert.match(surface, /MAX_FILE_BYTES = 12 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_IMAGE_BYTES = 1_200_000/u);
  assert.match(surface, /application\/pdf/u);
  assert.match(surface, /video\/mp4/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.match(surface, /localStorage\.setItem/u);
  assert.match(surface, /router\.push/u);
  assert.match(surface, /moveAsset/u);
  assert.match(surface, /Description for viewers/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.upload-import-dropzone/u);
  assert.match(css, /\.upload-import-workspace/u);
});
