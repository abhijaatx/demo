import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const viewerSource = () =>
  readFile(new URL("../apps/web/components/demo-viewer.tsx", import.meta.url), "utf8");

test("DemoViewer renders embed chapters only as restrictive sandbox iframes", async () => {
  const source = await viewerSource();
  assert.match(source, /sanitizeEmbedUrl/u);
  assert.match(source, /chapterEmbedUrl/u);
  assert.match(source, /className="demo-viewer-chapter-embed"/u);
  assert.ok(source.includes("src={chapterEmbedUrl}"));
  assert.match(source, /loading="lazy"/u);
  assert.match(source, /referrerPolicy="no-referrer"/u);
  assert.match(source, /sandbox="allow-scripts allow-forms"/u);
  // The iframe must never be same-origin with untrusted embed content.
  assert.doesNotMatch(source, /sandbox="[^"]*allow-same-origin/u);
});

test("DemoViewer never renders arbitrary embed HTML or navigation sinks", async () => {
  const source = await viewerSource();
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/u);
  assert.ok(!source.includes("eval("));
  // Invalid or missing embed URLs render a safe placeholder and never trigger
  // navigation or a fetch for the embed source.
  assert.ok(source.includes("This embed is not available right now."));
  assert.ok(source.includes('currentChapter.type === "embed"'));
  assert.doesNotMatch(source, /embedUrl[^;]{0,160}location/u);
  assert.doesNotMatch(source, /location[^;]{0,160}embedUrl/u);
  assert.doesNotMatch(source, /fetch\([^)]*embedUrl/u);
});

test("DemoViewer keeps chapter buttons, forms, gates, and voiceovers around embeds", async () => {
  const source = await viewerSource();
  // The embed block is additive: existing viewer behaviors must remain intact.
  assert.match(source, /handleChapterButton/u);
  assert.match(source, /demo-viewer-chapter-voiceover/u);
  assert.match(source, /gateLocked && gate/u);
  assert.match(source, /demo-viewer-form/u);
  assert.match(source, /demo-viewer-chapter-actions/u);
});
