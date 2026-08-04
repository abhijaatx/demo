import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("video hotspots workbench keeps local timeline plans bounded", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/video-hotspots/page.tsx"),
    readWebFile("components/video-hotspots-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /VideoHotspotsWorkbench/u);
  assert.match(surface, /video\/mp4/u);
  assert.match(surface, /video\/webm/u);
  assert.match(surface, /video\/quicktime/u);
  assert.match(surface, /MAX_FILE_BYTES = 40 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_HOTSPOTS = 20/u);
  assert.match(surface, /MAX_DURATION_SECONDS = 7_200/u);
  assert.match(surface, /maxLength=\{120\}/u);
  assert.match(surface, /maxLength=\{400\}/u);
  assert.match(surface, /Download hotspot plan/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.video-hotspots-editor/u);
  assert.match(css, /\.video-hotspots-markers/u);
});
