import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Embed workbench keeps demo/showcase snippets allowlisted and reviewable", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/embed/page.tsx"),
    readWebFile("components/embed-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /EmbedWorkbench/u);
  assert.match(surface, /generateIframeSnippet/u);
  assert.match(surface, /generatePopupEmbedSnippet/u);
  assert.match(surface, /Multi-demo Showcase/u);
  assert.match(surface, /Lazy-load iframe/u);
  assert.match(surface, /sanitizeId/u);
  assert.match(surface, /does not load third-party content/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/embed"/u);
});
