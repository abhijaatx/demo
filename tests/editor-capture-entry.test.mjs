import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("capture entry exposes bounded media imports and preserves the browser trust boundary", async () => {
  const [editor, route, surface] = await Promise.all([
    readWebFile("components/editor-shell.tsx"),
    readWebFile("app/demos/[demoId]/edit/page.tsx"),
    readWebFile("components/workspace-reference-surface.tsx")
  ]);

  assert.match(editor, /accept="image\/\*,video\/\*"/u);
  assert.match(editor, /100 \* 1024 \* 1024/u);
  assert.match(editor, /file\.type\.startsWith\("image\/"\)/u);
  assert.match(editor, /file\.type\.startsWith\("video\/"\)/u);
  assert.match(editor, /URL\.createObjectURL\(file\)/u);
  assert.match(editor, /URL\.revokeObjectURL\(url\)/u);
  assert.match(editor, /data:image/u);
  assert.match(editor, /value\.length <= 1_800_000/u);
  assert.match(editor, /assetType: isVideo \? "video" : "screenshot"/u);
  assert.match(editor, /href="\/video-hotspots"/u);
  assert.match(editor, /href="\/video-editor"/u);
  assert.match(editor, /href="\/crop-media"/u);
  assert.match(editor, /href="\/ai-audit"/u);
  assert.match(editor, /href="\/step-manager"/u);
  assert.match(editor, /href="\/animation"/u);
  assert.match(editor, /href="\/autoplay"/u);
  assert.match(editor, /href="\/voiceovers"/u);
  assert.match(editor, /href="\/ai-command"/u);
  assert.match(editor, /href="\/edit-html"/u);
  assert.match(editor, /href="\/personalize"/u);
  assert.match(editor, /href="\/mcp-server"/u);
  assert.match(editor, /href="\/find-replace"/u);
  assert.match(editor, /href="\/chapters"/u);
  assert.match(editor, /href="\/blur-annotate"/u);
  assert.match(editor, /href="\/comments"/u);
  assert.doesNotMatch(editor, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);

  assert.match(route, /searchParams\?/u);
  assert.match(route, /resolvedSearchParams\.sample === "1"/u);
  assert.match(route, /const captureModes = \[[\s\S]*"figma"/u);
  assert.match(surface, /encodeURIComponent\(selectedMode\)/u);
});
