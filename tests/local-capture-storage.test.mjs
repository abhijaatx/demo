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
