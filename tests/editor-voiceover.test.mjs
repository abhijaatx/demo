import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("editor voiceover controls cover AI generation, sync, expressive mode, and upload", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /VoiceoverSettings/u);
  assert.match(source, /Generate AI voiceover/u);
  assert.match(source, /Sync from hotspots/u);
  assert.match(source, /Expressive mode/u);
  assert.match(source, /accept="audio\/\*"/u);
  assert.match(source, /25 \* 1024 \* 1024/u);
});
