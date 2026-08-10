import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("video editor exposes bounded, non-destructive timeline controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/video-editor/page.tsx"),
    readWebFile("components/video-editor-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /VideoEditorWorkbench/u);
  assert.match(surface, /createVideoEditTimeline/u);
  assert.match(surface, /video\/mp4/u);
  assert.match(surface, /MAX_FILE_BYTES = 40 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_SEGMENTS = 40/u);
  assert.match(surface, /Split at playhead/u);
  assert.match(surface, /Playback speed/u);
  assert.match(surface, /Mute this segment/u);
  assert.match(surface, /Download edit plan/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.video-editor-workspace/u);
  assert.match(css, /\.video-editor-segments/u);
});
