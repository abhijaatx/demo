import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("desktop recorder exposes permission-aware screenshot and video capture controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/desktop-recorder/page.tsx"),
    readWebFile("components/desktop-recorder-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /DesktopRecorderWorkbench/u);
  assert.match(surface, /getDisplayMedia/u);
  assert.match(surface, /Screenshot steps/u);
  assert.match(surface, /Video/u);
  assert.match(surface, /Timed screenshots every 3s/u);
  assert.match(surface, /MAX_VIDEO_BYTES/u);
  assert.match(surface, /MAX_RECORDING_SECONDS/u);
  assert.match(surface, /permission was denied/u);
  assert.match(surface, /No screen data was uploaded/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(css, /\.desktop-recorder-stage/u);
  assert.match(css, /\.desktop-recorder-preview/u);
});
