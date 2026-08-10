import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("editor and viewer expose reviewable AI translation controls", async () => {
  const editor = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );
  const viewer = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(editor, /AiTranslationsSettings/u);
  assert.match(editor, /Translate to/u);
  assert.match(editor, /Save Translation/u);
  assert.match(editor, /executeAiTranslationJob/u);
  assert.match(editor, /aria-label="Translation preview"/u);
  assert.match(viewer, /Translate/u);
  assert.match(viewer, /requestedTranslationLocale/u);
  assert.match(viewer, /resolveLocalizedText/u);
  assert.doesNotMatch(viewer, /dangerouslySetInnerHTML/u);
});
