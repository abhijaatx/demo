import assert from "node:assert/strict";
import { test } from "node:test";
import { createCaptionCue, exportVttCaptions } from "@supademo/domain";

test("createCaptionCue & exportVttCaptions produce valid WebVTT tracks", () => {
  const cue1 = createCaptionCue("cue-1", 0, 4.5, "Welcome to Supademo!");
  const cue2 = createCaptionCue("cue-2", 4.5, 9.0, "Click the button to continue.");

  const track = {
    languageCode: "en-US",
    label: "English",
    cues: [cue1, cue2]
  };

  const vtt = exportVttCaptions(track);
  assert.equal(vtt.includes("WEBVTT"), true);
  assert.equal(vtt.includes("00:00:00.000 --> 00:00:04.500"), true);
  assert.equal(vtt.includes("Welcome to Supademo!"), true);
});
