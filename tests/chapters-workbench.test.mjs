import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Chapters workbench exposes intro, CTA, form, and safe branching controls", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/chapters/page.tsx"),
    readWebFile("components/chapters-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /ChaptersWorkbench/u);
  assert.match(surface, /Initial overlay/u);
  assert.match(surface, /End CTA/u);
  assert.match(surface, /Lead capture form/u);
  assert.match(surface, /Conditional branching/u);
  assert.match(surface, /MAX_BUTTONS = 12/u);
  assert.match(surface, /validateSafeUrl/u);
  assert.match(surface, /Background blur/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/chapters"/u);
});
