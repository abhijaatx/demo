import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createAudioVideoDeviceConfig,
  createMediaRecordingState,
  startMediaCountdown,
  tickMediaCountdown,
  tickMediaElapsed,
  finishMediaRecording
} from "@supademo/domain";

test("Media recording controller state machine ticks countdown and elapsed seconds", () => {
  const devices = createAudioVideoDeviceConfig({});
  let state = createMediaRecordingState(devices);
  assert.equal(state.status, "idle");

  state = startMediaCountdown(state);
  assert.equal(state.status, "countdown");
  assert.equal(state.countdownSeconds, 3);

  state = tickMediaCountdown(state); // 2
  state = tickMediaCountdown(state); // 1
  state = tickMediaCountdown(state); // -> recording
  assert.equal(state.status, "recording");
  assert.equal(state.countdownSeconds, 0);

  state = tickMediaElapsed(state);
  assert.equal(state.elapsedSeconds, 1);

  state = finishMediaRecording(state);
  assert.equal(state.status, "completed");
});
