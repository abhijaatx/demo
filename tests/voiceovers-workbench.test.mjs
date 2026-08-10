import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Voiceovers 2.0 workbench keeps scripts, uploads, clone, and pronunciation data bounded", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/voiceovers/page.tsx"),
    readWebFile("components/voiceovers-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /VoiceoversWorkbench/u);
  assert.match(surface, /MAX_SCRIPT_LENGTH = 4_000/u);
  assert.match(surface, /MAX_PRONUNCIATION_ENTRIES = 64/u);
  assert.match(surface, /MAX_AUDIO_BYTES = 25 \* 1024 \* 1024/u);
  assert.match(surface, /Sync voice settings across steps/u);
  assert.match(surface, /Clone a voice/u);
  assert.match(surface, /Record my voice/u);
  assert.match(surface, /Pronunciation library/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.match(surface, /captured: false/u);
  assert.match(surface, /does not capture microphone data/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.voiceovers-workbench-tool-card/u);
  assert.match(css, /\.voiceovers-workbench-pronunciation/u);
});
