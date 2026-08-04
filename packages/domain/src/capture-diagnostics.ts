/**
 * Capture Diagnostics, Recapture & Anchor Remapping — TASK-099
 */

import type { CapturedClickContext } from "./capture-click-context.js";
import type { RecordedStep, RecordingSessionState } from "./recording-session.js";

export interface CaptureDiagnosticsReport {
  readonly sessionId: string;
  readonly capturedStepsCount: number;
  readonly status: string;
  readonly sanitizedLogs: readonly string[];
}

export function generateCaptureDiagnostics(
  session: RecordingSessionState
): CaptureDiagnosticsReport {
  const sanitizedLogs = session.steps.map((step) => {
    return `[STEP ${step.id}] title="${step.clickContext.pageTitle}" url="${step.clickContext.originUrl}"`;
  });

  return Object.freeze({
    sessionId: session.id,
    capturedStepsCount: session.steps.length,
    status: session.status,
    sanitizedLogs: Object.freeze(sanitizedLogs)
  });
}

export function remapStepAnchor(
  step: RecordedStep,
  newClickContext: CapturedClickContext,
  confidenceScore: number
): RecordedStep {
  if (confidenceScore < 0.8) {
    throw new Error("Cannot silently remap step anchor with low confidence score (< 0.8).");
  }

  return Object.freeze({
    ...step,
    clickContext: newClickContext
  });
}
