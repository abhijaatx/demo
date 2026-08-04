/**
 * Desktop Workflow Capture Session & Resumable Upload State — TASK-107
 */

export type DesktopSourceType = "screen" | "window";

export interface DesktopCaptureSource {
  readonly id: string;
  readonly name: string;
  readonly type: DesktopSourceType;
  readonly thumbnailUrl: string | null;
}

export interface DesktopCaptureSession {
  readonly sessionId: string;
  readonly sourceId: string;
  readonly isRecording: boolean;
  readonly capturedBytes: number;
  readonly startedAtIso: string;
}

export function createDesktopCaptureSession(sourceId: string): DesktopCaptureSession {
  return Object.freeze({
    sessionId: `desk-cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceId,
    isRecording: true,
    capturedBytes: 0,
    startedAtIso: new Date().toISOString()
  });
}

export function updateDesktopCaptureProgress(
  session: DesktopCaptureSession,
  additionalBytes: number
): DesktopCaptureSession {
  if (additionalBytes < 0) {
    throw new Error("Additional byte count must be non-negative.");
  }
  return Object.freeze({
    ...session,
    capturedBytes: session.capturedBytes + additionalBytes
  });
}
