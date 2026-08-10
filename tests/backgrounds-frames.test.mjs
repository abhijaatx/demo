import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("backgrounds and frames expose bounded editor controls and viewer styling", async () => {
  const editor = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );
  const viewer = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(editor, /BackgroundSettings/u);
  assert.match(editor, /Upload custom background image/u);
  assert.match(editor, /10 \* 1024 \* 1024/u);
  assert.match(editor, /image\/png,image\/jpeg,image\/webp,image\/gif/u);
  assert.match(editor, /backgroundPreset/u);
  assert.match(viewer, /presetBackgrounds/u);
  assert.match(viewer, /safeMediaUrl\(viewerTheme\.backgroundImageUrl\)/u);
  assert.doesNotMatch(viewer, /dangerouslySetInnerHTML/u);
});
