/**
 * Resilient Video/Audio Media Recording Controller State Machine — TASK-103
 */

import type { AudioVideoDeviceConfig } from "./media-devices.js";

export type MediaRecordingStatus =
  "idle" | "countdown" | "recording" | "paused" | "finalizing" | "completed" | "cancelled";

export interface MediaRecordingState {
  readonly status: MediaRecordingStatus;
  readonly countdownSeconds: number;
  readonly elapsedSeconds: number;
  readonly deviceConfig: AudioVideoDeviceConfig;
}

export function createMediaRecordingState(
  deviceConfig: AudioVideoDeviceConfig
): MediaRecordingState {
  return Object.freeze({
    status: "idle",
    countdownSeconds: 3,
    elapsedSeconds: 0,
    deviceConfig
  });
}

export function startMediaCountdown(state: MediaRecordingState): MediaRecordingState {
  if (state.status !== "idle") return state;
  return Object.freeze({ ...state, status: "countdown", countdownSeconds: 3 });
}

export function tickMediaCountdown(state: MediaRecordingState): MediaRecordingState {
  if (state.status !== "countdown") return state;
  if (state.countdownSeconds <= 1) {
    return Object.freeze({ ...state, status: "recording", countdownSeconds: 0 });
  }
  return Object.freeze({ ...state, countdownSeconds: state.countdownSeconds - 1 });
}

export function tickMediaElapsed(state: MediaRecordingState): MediaRecordingState {
  if (state.status !== "recording") return state;
  return Object.freeze({ ...state, elapsedSeconds: state.elapsedSeconds + 1 });
}

export function cancelMediaRecording(state: MediaRecordingState): MediaRecordingState {
  return Object.freeze({ ...state, status: "cancelled" });
}

export function finishMediaRecording(state: MediaRecordingState): MediaRecordingState {
  return Object.freeze({ ...state, status: "completed" });
}
