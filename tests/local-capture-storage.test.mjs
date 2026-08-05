import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("local recorder handoffs stay bounded in browser-only IndexedDB storage", async () => {
  const source = await readWebFile("src/lib/local-capture-storage.ts");

  assert.match(source, /indexedDB\.open/u);
  assert.match(source, /MAX_BUNDLE_BYTES = 100 \* 1024 \* 1024/u);
  assert.match(source, /MAX_SCREENSHOTS = 30/u);
  assert.match(source, /normalizeLocalCaptureId/u);
  assert.match(source, /dataUrlToBlob|base64/u);
  assert.match(source, /instanceof Blob/u);
  assert.match(source, /deleteLocalCaptureBundle/u);
  assert.match(source, /video-split/u);
  assert.match(source, /upload/u);
  assert.match(source, /MAX_UPLOAD_ASSETS = 8/u);
  assert.match(source, /MAX_SEGMENTS = 40/u);
  assert.doesNotMatch(source, /fetch\(|sendBeacon|eval\(|new Function\(/u);
});

test("recorder surfaces expose an editor handoff without sending captured media to an API", async () => {
  const [screen, desktop, editor] = await Promise.all([
    readWebFile("components/screen-camera-recorder-workbench.tsx"),
    readWebFile("components/desktop-recorder-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(screen, /saveLocalCaptureBundle/u);
  assert.match(screen, /localCapture=/u);
  assert.match(desktop, /dataUrlToBlob/u);
  assert.match(desktop, /Open editor/u);
  assert.match(desktop, /localCapture=/u);
  assert.match(editor, /readLocalCaptureBundle/u);
  assert.match(editor, /createDocumentFromLocalCapture/u);
  assert.doesNotMatch(screen + desktop, /fetch\(|sendBeacon/u);
});

test("video splitting and uploads persist their media blobs for an editor handoff", async () => {
  const [video, upload, editor] = await Promise.all([
    readWebFile("components/video-editor-workbench.tsx"),
    readWebFile("components/upload-import-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(video, /Create image step/u);
  assert.match(video, /canvas\.toBlob/u);
  assert.match(video, /MAX_IMAGE_STEPS = 20/u);
  assert.match(video, /kind: "video-split"/u);
  assert.match(video, /Open steps in editor/u);
  assert.match(upload, /kind: "upload"/u);
  assert.match(upload, /asset\.blob/u);
  assert.match(upload, /localCapture=/u);
  assert.match(editor, /bundle\.kind === "video-split"/u);
  assert.match(editor, /bundle\.kind === "upload"/u);
  assert.doesNotMatch(video + upload, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
