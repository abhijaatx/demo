import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("editor exposes review-before-apply AI text generation controls", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /AiTextSettings/u);
  assert.match(source, /Generate suggestion/u);
  assert.match(source, /Apply to title/u);
  assert.match(source, /Dismiss/u);
  assert.match(source, /proposeTextRewrite/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/u);
});
