import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("editor sharing exposes link, embed, export, and present flows with bounded output", async () => {
  const [editor, viewer, route] = await Promise.all([
    readWebFile("components/editor-shell.tsx"),
    readWebFile("components/demo-viewer.tsx"),
    readWebFile("app/demos/[demoId]/view/page.tsx")
  ]);

  assert.match(editor, /type ShareTab = "Link" \| "Embed" \| "Export" \| "Present"/u);
  assert.match(editor, /publishDemoDocument\(exportDocument/u);
  assert.match(editor, /generateIframeSnippet/u);
  assert.match(editor, /generateSopMarkdownExport/u);
  assert.match(editor, /Trackable link label/u);
  assert.match(editor, /Copy embed code/u);
  assert.match(editor, /Download SOP \(Markdown\)/u);
  assert.match(editor, /Open viewer preview/u);
  assert.match(editor, /sanitizeTrackingKey/u);
  assert.match(editor, /isSafeMediaUrl/u);
  assert.match(editor, /supademo_draft_/u);
  assert.match(editor, /parseDemoDocument\(JSON\.parse\(raw\)\)/u);
  assert.match(editor, /Destination URL/u);
  assert.match(editor, /ChapterEditor/u);
  assert.match(editor, /handleAddChapter/u);
  assert.match(editor, /Delete chapter/u);
  assert.match(editor, /mediaUrl/u);
  assert.doesNotMatch(editor, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);

  assert.match(viewer, /parseDemoDocument/u);
  assert.match(viewer, /supademo_published_/u);
  assert.match(viewer, /supademo_view_events_/u);
  assert.match(viewer, /safeMediaUrl/u);
  assert.match(viewer, /validateSafeUrl/u);
  assert.match(viewer, /actionType === "open_url"/u);
  assert.match(viewer, /demo-viewer-chapter/u);
  assert.match(viewer, /handleChapterButton/u);
  assert.match(viewer, /Next step/u);
  assert.match(viewer, /Previous/u);
  assert.doesNotMatch(viewer, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);

  assert.match(route, /createDefaultDemoDocument\(demoId\)/u);
  assert.match(route, /DemoViewer/u);
});
