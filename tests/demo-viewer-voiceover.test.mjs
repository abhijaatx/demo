import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("viewer exposes safe voiceover audio controls without rendering untrusted HTML", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /narrationUrl/u);
  assert.match(source, /<audio/u);
  assert.match(source, /preload="metadata"/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/u);
});
