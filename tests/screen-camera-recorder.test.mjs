import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("screen and camera recorder exposes bounded local capture controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/screen-recorder/page.tsx"),
    readWebFile("components/screen-camera-recorder-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /ScreenCameraRecorderWorkbench/u);
  assert.match(surface, /getDisplayMedia/u);
  assert.match(surface, /getUserMedia/u);
  assert.match(surface, /Screen only/u);
  assert.match(surface, /Camera only/u);
  assert.match(surface, /Screen \+ camera/u);
  assert.match(surface, /Include microphone/u);
  assert.match(surface, /Include system audio/u);
  assert.match(surface, /MAX_RECORDING_SECONDS = 120/u);
  assert.match(surface, /MAX_VIDEO_BYTES/u);
  assert.match(surface, /saveLocalCaptureBundle/u);
  assert.match(surface, /localCapture=/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /No recording data was uploaded/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.screen-camera-recorder-stage/u);
  assert.match(css, /\.screen-camera-recorder-preview/u);
});
