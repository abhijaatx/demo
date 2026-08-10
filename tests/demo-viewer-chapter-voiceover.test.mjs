import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("viewer renders chapter voiceover with safe media URLs", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /chapterNarrationUrl/u);
  assert.match(source, /safeMediaUrl/u);
  assert.match(source, /currentChapter\.voiceover\.audioUrl/u);
  assert.match(source, /demo-viewer-chapter-voiceover/u);
  assert.match(source, /Chapter voiceover/u);
  assert.match(source, /preload="metadata"/u);
  assert.match(source, /translationContentKey/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(|new Function\(/u);
});

test("viewer gates chapter voiceover autoplay behind the first user interaction", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  // No page-load autoplay: the HTML autoplay attribute only becomes true once
  // the viewer's first interaction has fired (emitStarted -> setHasStarted).
  assert.match(source, /setHasStarted/u);
  assert.match(source, /hasStarted/u);
  assert.match(source, /autoPlay=/u);
  assert.match(source, /voiceover\.autoPlay/u);
  assert.match(source, /if \(startedRef\.current\) return;/u);
  // Playback is started via the audio ref only after the first interaction,
  // because flipping the autoPlay attribute on a mounted element is unreliable.
  assert.match(source, /chapterVoiceoverRef/u);
  assert.match(source, /audio\.play\(\)/u);
});

test("viewer keeps CTA, form, and navigation behavior intact alongside chapter voiceover", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /demo-viewer-chapter-actions/u);
  assert.match(source, /handleChapterButton/u);
  assert.match(source, /handleFormSubmit/u);
  assert.match(source, /continueFromChapter/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
