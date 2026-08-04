import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateEffectiveAudioVolume } from "@supademo/domain";

test("calculateEffectiveAudioVolume ducks background audio during active voiceover", () => {
  const bgAudio = {
    audioAssetId: "bg-1",
    storagePath: "/bg.mp3",
    volume: 0.8,
    duckingRatio: 0.7, // reduce by 70% during voiceover
    loop: true
  };

  const volumeDucked = calculateEffectiveAudioVolume(true, bgAudio);
  assert.equal(volumeDucked.stepVoiceoverVolume, 1.0);
  assert.equal(volumeDucked.backgroundAudioVolume, 0.24); // 0.8 * (1 - 0.7) = 0.24

  const volumeNormal = calculateEffectiveAudioVolume(false, bgAudio);
  assert.equal(volumeNormal.backgroundAudioVolume, 0.8);
});
