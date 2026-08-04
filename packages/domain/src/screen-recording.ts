/**
 * Browser Screen Recording Configuration & Chunk Layout — TASK-101
 */

export type ScreenRecordingSourceMode = "screen" | "window" | "tab";

export interface ScreenRecordingSessionConfig {
  readonly sessionId: string;
  readonly mode: ScreenRecordingSourceMode;
  readonly maxDurationSeconds: number;
  readonly chunkIntervalMs: number;
  readonly createdAtIso: string;
}

export function createScreenRecordingSession(
  mode: ScreenRecordingSourceMode = "screen",
  maxDurationSeconds = 300,
  chunkIntervalMs = 5000
): ScreenRecordingSessionConfig {
  const clampedDuration = Math.max(10, Math.min(3600, maxDurationSeconds));
  const clampedChunkMs = Math.max(1000, Math.min(30000, chunkIntervalMs));

  return Object.freeze({
    sessionId: `rec-scr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode,
    maxDurationSeconds: clampedDuration,
    chunkIntervalMs: clampedChunkMs,
    createdAtIso: new Date().toISOString()
  });
}

export function calculateChunkLayout(
  totalDurationSeconds: number,
  chunkIntervalMs: number
): { totalChunks: number; chunkDurationSec: number } {
  const chunkDurationSec = chunkIntervalMs / 1000;
  const totalChunks = Math.max(1, Math.ceil(totalDurationSeconds / chunkDurationSec));
  return { totalChunks, chunkDurationSec };
}
