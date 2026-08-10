import assert from "node:assert/strict";
import { test } from "node:test";
import { getAvailableTtsVoices, generateAiVoiceover } from "@supademo/domain";

test("getAvailableTtsVoices returns valid voice options catalog", () => {
  const voices = getAvailableTtsVoices();
  assert.equal(voices.length >= 2, true);
  assert.equal(voices[0].voiceId, "en-US-1");
});

test("generateAiVoiceover creates audio assets for selected voices", async () => {
  const job = await generateAiVoiceover("Welcome to the app!", "en-US-1");

  assert.equal(job.status, "ready");
  assert.equal(job.voiceId, "en-US-1");
  assert.equal(job.audioAssetUrl.includes(".mp3"), true);

  await assert.rejects(
    () => generateAiVoiceover("text", "invalid-voice"),
    /not found in TTS catalog/
  );
});
