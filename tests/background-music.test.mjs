import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  calculateEffectiveAudioVolume,
  parseDemoBackgroundAudio,
  parseDemoDocument
} from "@supademo/domain";

const viewerSource = await readFile(
  new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
  "utf8"
);
const editorSource = await readFile(
  new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
  "utf8"
);

test("viewer renders background music with a safe media URL and no untrusted HTML", () => {
  assert.match(viewerSource, /backgroundMusicRef/u);
  assert.match(viewerSource, /demo-viewer-background-music/u);
  assert.match(viewerSource, /safeMediaUrl/u);
  assert.match(viewerSource, /backgroundAudio\?\.audioUrl/u);
  assert.match(viewerSource, /preload="none"/u);
  assert.doesNotMatch(viewerSource, /dangerouslySetInnerHTML|eval\(|new Function\(/u);
});

test("viewer never autoplays background music before the first user gesture", () => {
  // Playback is gated on the viewer's first interaction (emitStarted ->
  // setHasStarted) plus the creator's start-muted flag and viewer pause/mute;
  // page load alone can never start music.
  assert.match(viewerSource, /setHasStarted/u);
  assert.match(viewerSource, /if \(startedRef\.current\) return;/u);
  assert.match(viewerSource, /hasStarted &&/u);
  assert.match(viewerSource, /bgMusicPaused/u);
  assert.match(viewerSource, /backgroundAudio\?\.muted/u);
  assert.match(viewerSource, /audio\.play\(\)\.catch/u);
  assert.match(viewerSource, /onClick=\{emitStarted\}/u);
});

test("viewer Play control reflects and toggles actual playback state", () => {
  // A track is not actually playing before the first click (or while start-muted),
  // so the control must say Play and the first explicit click must not toggle it
  // into the paused state before the gesture unlocks playback.
  assert.match(viewerSource, /const backgroundMusicPlaying = Boolean\(/u);
  assert.match(viewerSource, /aria-pressed=\{backgroundMusicPlaying\}/u);
  assert.match(viewerSource, /backgroundMusicPlaying \? "Pause music" : "Play music"/u);
  assert.match(viewerSource, /setBgMusicPaused\(backgroundMusicPlaying\)/u);
});

test("viewer syncs play state when a non-looping track ends", () => {
  assert.match(viewerSource, /onEnded=\{\(\) => setBgMusicPaused\(true\)\}/u);
  assert.match(viewerSource, /onError=\{\(\) => setBgMusicPaused\(true\)\}/u);
});

test("viewer hides the music bar when the track has no safe playback URL", () => {
  // The music section is only rendered when both settings exist and the URL
  // survives safeMediaUrl, so a legacy storagePath-only track stays silent.
  assert.match(viewerSource, /backgroundAudio && backgroundMusicUrl \? \(/u);
  assert.match(viewerSource, /safeMediaUrl/u);
});

test("viewer suppresses background music while a password gate is locked", () => {
  // The playback guard fails closed behind a locked gate and the music
  // controls are disabled (no active Play path can leak while locked).
  assert.match(viewerSource, /!gateLocked/u);
  assert.match(viewerSource, /disabled=\{gateLocked\}/u);
  assert.match(viewerSource, /is-gate-locked/u);
  assert.match(viewerSource, /\? "Unavailable"/u);
  // Consistent with the existing chapter voiceover autoplay gating.
  assert.match(viewerSource, /gateLocked/u);
});

test("viewer Play overrides the creator start-muted initial state", () => {
  // start-muted only governs the initial auto-start before any viewer
  // interaction; once the viewer engages the controls (bgUserEngaged), Play
  // explicitly unmutes and starts the track.
  assert.match(viewerSource, /bgUserEngaged/u);
  assert.match(viewerSource, /\(bgUserEngaged \|\| !backgroundAudio\?\.muted\)/u);
  assert.match(viewerSource, /setBgUserEngaged\(true\)/u);
});

test("viewer ducks background music while a voiceover is playing", () => {
  assert.match(viewerSource, /calculateEffectiveAudioVolume/u);
  assert.match(viewerSource, /voiceoverPlaying/u);
  // Both step narration and chapter voiceover report play/pause for ducking.
  const onPlayCount = viewerSource.match(/onPlay=\{\(\) => setVoiceoverPlaying\(true\)\}/gu) ?? [];
  const onPauseCount =
    viewerSource.match(/onPause=\{\(\) => setVoiceoverPlaying\(false\)\}/gu) ?? [];
  assert.ok(
    onPlayCount.length >= 2,
    `expected >= 2 narration onPlay handlers, got ${onPlayCount.length}`
  );
  assert.ok(
    onPauseCount.length >= 2,
    `expected >= 2 narration onPause handlers, got ${onPauseCount.length}`
  );
});

test("ducking math stays consistent with the domain envelope", () => {
  const bgAudio = parseDemoBackgroundAudio({
    audioAssetId: "bg",
    storagePath: "/bg.mp3",
    volume: 0.5,
    duckingRatio: 0.6,
    loop: true
  });
  assert.ok(bgAudio);
  const ducked = calculateEffectiveAudioVolume(true, bgAudio);
  assert.equal(ducked.backgroundAudioVolume, 0.2); // 0.5 * (1 - 0.6)
  assert.equal(calculateEffectiveAudioVolume(false, bgAudio).backgroundAudioVolume, 0.5);
});

test("viewer keeps voiceover, navigation, and form behavior intact alongside background music", () => {
  assert.match(viewerSource, /narrationUrl/u);
  assert.match(viewerSource, /demo-viewer-controls/u);
  assert.match(viewerSource, /handleFormSubmit/u);
  assert.match(viewerSource, /goNext/u);
  assert.doesNotMatch(viewerSource, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("editor exposes background music presets, upload, volume, loop, and mute controls", () => {
  assert.match(editorSource, /BACKGROUND_MUSIC_PRESETS/u);
  assert.match(editorSource, /parseDemoBackgroundAudio/u);
  assert.match(editorSource, /editor-background-music-panel/u);
  assert.match(editorSource, /editor-music-preset/u);
  assert.match(editorSource, /Background music/u);
  assert.match(editorSource, /Music volume/u);
  assert.match(editorSource, /Lower during voiceover/u);
  assert.match(editorSource, /Loop music/u);
  assert.match(editorSource, /Start muted/u);
  assert.match(editorSource, /accept="audio\/\*"/u);
  assert.match(editorSource, /Upload music/u);
  assert.match(editorSource, /onChange=\{\(backgroundAudio\) =>/u);
  assert.doesNotMatch(editorSource, /dangerouslySetInnerHTML|eval\(|new Function\(/u);
});

test("background music is a demo-level, backwards-compatible setting", () => {
  // Legacy documents without the key parse to null; default documents are null.
  const legacy = parseDemoDocument({ version: "1.0.0", demoId: "d", steps: [] });
  assert.equal(legacy.settings.backgroundAudio, null);
  // Round trip keeps a configured track.
  const configured = parseDemoBackgroundAudio({
    audioAssetId: "bg",
    storagePath: "/bg.mp3",
    audioUrl: "https://cdn.supademo.com/audio/bg.mp3",
    title: "Calm ambient",
    presetId: "calm-ambient",
    volume: 0.7,
    duckingRatio: 0.6,
    loop: true,
    muted: false
  });
  assert.ok(configured);
  const parsed = parseDemoDocument({
    version: "1.0.0",
    demoId: "d",
    steps: [],
    settings: { backgroundAudio: configured }
  });
  assert.equal(parsed.settings.backgroundAudio?.presetId, "calm-ambient");
  assert.equal(parsed.settings.backgroundAudio?.volume, 0.7);
});
