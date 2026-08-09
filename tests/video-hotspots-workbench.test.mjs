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
  assert.match(surface, /maximumStart/u);
  assert.match(surface, /minimumEnd/u);
  assert.match(surface, /Download hotspot plan/u);
  assert.match(surface, /saveLocalCaptureBundle/u);
  assert.match(surface, /kind: "video"/u);
  assert.match(surface, /videoHotspots:/u);
  assert.match(surface, /Save and open editor/u);
  assert.match(surface, /localCapture=/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.video-hotspots-editor/u);
  assert.match(css, /\.video-hotspots-markers/u);
});

test("workbench timeline supports click-to-add and edge-drag conversion", async () => {
  const [surface, css] = await Promise.all([
    readWebFile("components/video-hotspots-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  // Clicking an empty moment on the timeline adds a hotspot at that timestamp.
  assert.match(surface, /const handleTrackClick/u);
  assert.match(surface, /addHotspotAt\(timeFromPointer\(event\.clientX\)\)/u);
  assert.match(surface, /Click an empty moment to add a hotspot/u);

  // Edge dragging converts a pause cue into a duration cue and resizes cues.
  assert.match(surface, /resolveTimelineEdgeDrag/u);
  assert.match(
    surface,
    /onPointerDown=\{\(event\) => beginCueDrag\(event, hotspot\.id, "start"\)\}/u
  );
  assert.match(
    surface,
    /onPointerDown=\{\(event\) => beginCueDrag\(event, hotspot\.id, "end"\)\}/u
  );
  assert.match(surface, /onPointerDown=\{\(event\) => beginCueDrag\(event, hotspot\.id, null\)\}/u);
  assert.match(surface, /setPointerCapture\?\.\(event\.pointerId\)/u);
  assert.match(surface, /video-hotspots-cue-bar/u);
  assert.match(surface, /video-hotspots-cue-handle/u);

  // Keyboard and touch accessible: slider semantics, arrow keys, pointer capture.
  assert.match(surface, /role="slider"/u);
  assert.match(surface, /aria-valuenow/u);
  assert.match(surface, /handleCueKeyDown/u);
  assert.match(surface, /CUE_KEYBOARD_STEP_SECONDS = 0\.1/u);
  assert.match(css, /\.video-hotspots-cue-handle/u);
  assert.match(css, /\.video-hotspots-cue-bar/u);
  assert.match(css, /touch-action: none/u);
  assert.match(css, /:focus-visible/u);
});

test("video hotspot local storage validates timing and metadata before editor handoff", async () => {
  const [storage, captureDocument, editor] = await Promise.all([
    readWebFile("src/lib/local-capture-storage.ts"),
    readWebFile("src/lib/local-capture-document.ts"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(storage, /MAX_VIDEO_HOTSPOTS = 20/u);
  assert.match(storage, /validateVideoHotspots/u);
  assert.match(storage, /hotspot\.endTimeSeconds <= 7_200/u);
  assert.match(captureDocument, /bundle\.videoHotspots/u);
  assert.match(captureDocument, /local-video-hotspot-/u);
  assert.match(captureDocument, /actionType: "none"/u);
  assert.match(editor, /createDocumentFromLocalCapture/u);
  assert.match(editor, /readLocalCaptureBundle/u);
});

test("viewer, editor, and workbench do not re-pause on a cue after resuming", async () => {
  const [viewer, editor, workbench] = await Promise.all([
    readWebFile("components/demo-viewer.tsx"),
    readWebFile("components/editor-shell.tsx"),
    readWebFile("components/video-hotspots-workbench.tsx")
  ]);

  // A programmatic jump to a pause cue must not re-arm the cue via onSeeked;
  // only a real viewer seek re-arms cues at/after the seek point.
  assert.match(viewer, /const pauseJumpVideoRef = useRef\(false\);/u);
  assert.match(viewer, /pauseJumpVideoRef\.current = true;/u);
  assert.match(viewer, /only a real viewer seek re-arms cues/u);
  assert.match(viewer, /pauseHotspotIdsBeforeTime\(stepHotspots, nextTime\)/u);
  assert.match(viewer, /const changed = Math\.abs\(video\.currentTime - bounded\) > 0\.001;/u);
  assert.match(viewer, /videoSeekingRef\.current = changed;/u);
  assert.match(editor, /const pauseJumpVideoRef = useRef\(false\);/u);
  assert.match(editor, /pauseJumpVideoRef\.current = true;/u);
  assert.match(editor, /const changed = Math\.abs\(video\.currentTime - bounded\) > 0\.001;/u);
  assert.match(editor, /videoSeekingRef\.current = changed;/u);
  assert.match(workbench, /const pauseJumpRef = useRef\(false\);/u);
  assert.match(workbench, /pauseJumpRef\.current = true;/u);
});
