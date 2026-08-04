/**
 * Recorder State Machine & Click Deduplication Engine — TASK-095
 */

import type { CapturedClickContext } from "./capture-click-context.js";
import type { CapturedScreenshotMeta } from "./screenshot-capture.js";

export type RecordingMode = "screenshot" | "html" | "video";
export type RecordingStatus = "idle" | "recording" | "paused" | "finalized" | "cancelled";

export interface RecordedStep {
  readonly id: string;
  readonly screenshot: CapturedScreenshotMeta;
  readonly clickContext: CapturedClickContext;
  readonly timestampMs: number;
}

export interface RecordingSessionState {
  readonly id: string;
  readonly mode: RecordingMode;
  readonly status: RecordingStatus;
  readonly steps: readonly RecordedStep[];
}

export function startRecordingSession(
  id: string,
  mode: RecordingMode = "screenshot"
): RecordingSessionState {
  return Object.freeze({
    id,
    mode,
    status: "recording",
    steps: Object.freeze([])
  });
}

export function addCapturedStep(
  session: RecordingSessionState,
  screenshot: CapturedScreenshotMeta,
  clickContext: CapturedClickContext
): RecordingSessionState {
  if (session.status !== "recording") return session;

  const now = Date.now();
  const lastStep = session.steps[session.steps.length - 1];

  // Deduplicate identical clicks within 300ms
  if (
    lastStep &&
    now - lastStep.timestampMs < 300 &&
    Math.abs(lastStep.clickContext.xPercent - clickContext.xPercent) < 1 &&
    Math.abs(lastStep.clickContext.yPercent - clickContext.yPercent) < 1
  ) {
    return session; // Ignore duplicate rapid click
  }

  const newStep: RecordedStep = Object.freeze({
    id: `step-${session.steps.length + 1}`,
    screenshot,
    clickContext,
    timestampMs: now
  });

  return Object.freeze({
    ...session,
    steps: Object.freeze([...session.steps, newStep])
  });
}

export function undoLastStep(session: RecordingSessionState): RecordingSessionState {
  if (session.steps.length === 0) return session;

  const copy = [...session.steps];
  copy.pop();

  return Object.freeze({
    ...session,
    steps: Object.freeze(copy)
  });
}

export function pauseRecording(session: RecordingSessionState): RecordingSessionState {
  if (session.status !== "recording") return session;
  return Object.freeze({ ...session, status: "paused" });
}

export function resumeRecording(session: RecordingSessionState): RecordingSessionState {
  if (session.status !== "paused") return session;
  return Object.freeze({ ...session, status: "recording" });
}
