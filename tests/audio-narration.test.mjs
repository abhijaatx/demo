import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BACKGROUND_MUSIC_PRESETS,
  calculateEffectiveAudioVolume,
  parseDemoBackgroundAudio
} from "@supademo/domain";

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

test("parseDemoBackgroundAudio parses a safe, bounded background audio object", () => {
  const parsed = parseDemoBackgroundAudio({
    audioAssetId: "bg-1",
    storagePath: "/music/bg.mp3",
    audioUrl: "https://cdn.supademo.com/audio/bg.mp3",
    title: "Calm ambient",
    presetId: "calm-ambient",
    volume: 2,
    duckingRatio: -1,
    loop: true,
    muted: true
  });

  assert.ok(parsed);
  assert.equal(parsed.audioUrl, "https://cdn.supademo.com/audio/bg.mp3");
  assert.equal(parsed.storagePath, "/music/bg.mp3");
  assert.equal(parsed.title, "Calm ambient");
  assert.equal(parsed.presetId, "calm-ambient");
  assert.equal(parsed.volume, 1); // clamped to avoid clipping
  assert.equal(parsed.duckingRatio, 0); // clamped
  assert.equal(parsed.loop, true);
  assert.equal(parsed.muted, true);
});

test("parseDemoBackgroundAudio rejects unsafe URLs and unknown presets with safe defaults", () => {
  const parsed = parseDemoBackgroundAudio({
    audioAssetId: "bg",
    storagePath: "/bg.mp3",
    audioUrl: "javascript:alert(1)",
    presetId: "javascript:evil"
  });

  assert.ok(parsed);
  assert.equal(parsed.audioUrl, null);
  assert.equal(parsed.presetId, null);
  assert.equal(parsed.volume, 0.7);
  assert.equal(parsed.duckingRatio, 0.6);
  assert.equal(parsed.loop, true);
  assert.equal(parsed.muted, false);
});

test("parseDemoBackgroundAudio accepts only https or origin-bearing blob URLs", () => {
  assert.equal(
    parseDemoBackgroundAudio({ storagePath: "/x.mp3", audioUrl: "http://example.com/x.mp3" })
      ?.audioUrl,
    null
  );
  assert.equal(
    parseDemoBackgroundAudio({ storagePath: "/x.mp3", audioUrl: "data:audio/mpeg;base64,AAAA" })
      ?.audioUrl,
    null
  );
  assert.equal(
    parseDemoBackgroundAudio({ storagePath: "/x.mp3", audioUrl: "blob:https://example.com/abc" })
      ?.audioUrl,
    "blob:https://example.com/abc"
  );
  // Sandboxed blob URLs without a real origin are rejected at parse time.
  assert.equal(
    parseDemoBackgroundAudio({ storagePath: "/x.mp3", audioUrl: "blob:null/abc-123" })?.audioUrl,
    null
  );
  assert.equal(
    parseDemoBackgroundAudio({ storagePath: "/x.mp3", audioUrl: "blob:not-a-url" })?.audioUrl,
    null
  );
});

test("parseDemoBackgroundAudio returns null without any audio source", () => {
  assert.equal(parseDemoBackgroundAudio(null), null);
  assert.equal(parseDemoBackgroundAudio("nope"), null);
  assert.equal(parseDemoBackgroundAudio({ audioAssetId: "x" }), null);
  assert.equal(parseDemoBackgroundAudio({ audioUrl: "https://example.com/x.mp3" }) !== null, true);
  // Backwards-compatible minimal shape: a storage path alone is still valid.
  assert.equal(parseDemoBackgroundAudio({ storagePath: "/bg.mp3" }) !== null, true);
});

test("background music presets are safe https URLs with unique bounded ids", () => {
  assert.ok(BACKGROUND_MUSIC_PRESETS.length >= 2);
  const ids = new Set(BACKGROUND_MUSIC_PRESETS.map((preset) => preset.presetId));
  assert.equal(ids.size, BACKGROUND_MUSIC_PRESETS.length);
  for (const preset of BACKGROUND_MUSIC_PRESETS) {
    assert.match(preset.audioUrl, /^https:\/\//u);
    assert.equal(preset.audioUrl.length <= 2_048, true);
    assert.ok(preset.title.length > 0 && preset.title.length <= 80);
    assert.ok(preset.presetId.length > 0 && preset.presetId.length <= 64);
    assert.match(preset.presetId, /^[a-z0-9-]+$/u);
    assert.ok(preset.durationSeconds > 0);
  }
});
