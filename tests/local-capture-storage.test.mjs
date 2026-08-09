import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

let storageModulePromise;

const loadStorageModule = () => {
  storageModulePromise ||= readWebFile("src/lib/local-capture-storage.ts").then((source) => {
    const javascript = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022
      }
    }).outputText;
    return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
  });
  return storageModulePromise;
};

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
  assert.match(source, /MAX_VIDEO_HOTSPOTS = 20/u);
  assert.match(source, /MAX_HTML_NODES = 60/u);
  assert.match(source, /MAX_STORED_BUNDLES = 5/u);
  assert.match(source, /MAX_STORED_CAPTURE_BYTES = 200 \* 1024 \* 1024/u);
  assert.match(source, /scheduleCaptureRetention/u);
  assert.match(source, /openCursor/u);
  assert.match(source, /store\.delete\(key\)/u);
  assert.match(source, /validateVideoHotspots/u);
  assert.match(source, /htmlNodes/u);
  assert.match(source, /crop\?: CropMetadata/u);
  assert.doesNotMatch(source, /fetch\(|sendBeacon|eval\(|new Function\(/u);
});

test("local capture retention evicts corrupt, expired, and oldest oversized entries", async () => {
  const {
    MAX_BUNDLE_AGE_MS,
    MAX_STORED_BUNDLES,
    MAX_STORED_CAPTURE_BYTES,
    selectLocalCaptureRetentionKeys
  } = await loadStorageModule();
  const nowMs = Date.UTC(2026, 7, 6, 12);
  const mebibyte = 1024 * 1024;
  const candidate = (id, storedAtMs, estimatedBytes, valid = true) => ({
    storageKey: id,
    id,
    storedAtMs,
    estimatedBytes,
    valid
  });

  assert.equal(MAX_STORED_BUNDLES, 5);
  assert.equal(MAX_STORED_CAPTURE_BYTES, 200 * mebibyte);

  const deleted = selectLocalCaptureRetentionKeys(
    [
      candidate("corrupt", nowMs - 500, 0, false),
      candidate("expired", nowMs - MAX_BUNDLE_AGE_MS - 1, mebibyte),
      candidate("oldest", nowMs - 2_000, 60 * mebibyte),
      candidate("recent", nowMs - 1_000, 70 * mebibyte),
      candidate("current", nowMs, 90 * mebibyte)
    ],
    "current",
    nowMs
  );

  assert.deepEqual(new Set(deleted), new Set(["corrupt", "expired", "oldest"]));
});

test("local capture retention caps entry count while preserving the current save", async () => {
  const { selectLocalCaptureRetentionKeys } = await loadStorageModule();
  const nowMs = Date.UTC(2026, 7, 6, 12);
  const candidates = Array.from({ length: 6 }, (_, index) => ({
    storageKey: `capture-${index}`,
    id: `capture-${index}`,
    storedAtMs: nowMs - (6 - index) * 1_000,
    estimatedBytes: 1024,
    valid: true
  }));

  const deleted = selectLocalCaptureRetentionKeys(candidates, "capture-5", nowMs);

  assert.deepEqual(deleted, ["capture-0"]);
  assert.ok(!deleted.includes("capture-5"));
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

test("hotspots, crops, and structured HTML plans remain local-only editor inputs", async () => {
  const [hotspots, crop, html, editor] = await Promise.all([
    readWebFile("components/video-hotspots-workbench.tsx"),
    readWebFile("components/crop-media-workbench.tsx"),
    readWebFile("components/html-edit-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(hotspots, /videoHotspots:/u);
  assert.match(crop, /crop: step\.crop/u);
  assert.match(html, /htmlNodes/u);
  assert.match(editor, /bundle\.kind === "html"/u);
  assert.doesNotMatch(hotspots + crop + html, /fetch\(|sendBeacon/u);
});
