/**
 * Non-Destructive Video Edit Timelines & Crop/Trim Metadata — TASK-104
 */

export type AspectRatioPreset = "16:9" | "4:3" | "1:1" | "9:16";
export type OverlayPlacement = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "hidden";

export interface VideoEditTimeline {
  readonly totalDurationSeconds: number;
  readonly trimStartSeconds: number;
  readonly trimEndSeconds: number;
  readonly posterTimestampSeconds: number;
  readonly aspectRatio: AspectRatioPreset;
  readonly webcamPlacement: OverlayPlacement;
}

export function createVideoEditTimeline(
  totalDurationSeconds: number,
  edits: {
    trimStartSeconds?: number;
    trimEndSeconds?: number;
    posterTimestampSeconds?: number;
    aspectRatio?: AspectRatioPreset;
    webcamPlacement?: OverlayPlacement;
  } = {}
): VideoEditTimeline {
  if (totalDurationSeconds <= 0) {
    throw new Error("Total duration must be greater than zero.");
  }

  const start = Math.max(0, edits.trimStartSeconds ?? 0);
  const end = Math.min(totalDurationSeconds, edits.trimEndSeconds ?? totalDurationSeconds);

  if (start >= end) {
    throw new Error("Trim start time must be less than trim end time.");
  }

  const poster = Math.max(start, Math.min(end, edits.posterTimestampSeconds ?? start));

  return Object.freeze({
    totalDurationSeconds,
    trimStartSeconds: start,
    trimEndSeconds: end,
    posterTimestampSeconds: poster,
    aspectRatio: edits.aspectRatio ?? "16:9",
    webcamPlacement: edits.webcamPlacement ?? "bottom-right"
  });
}

export function calculateTrimmedDuration(timeline: VideoEditTimeline): number {
  return timeline.trimEndSeconds - timeline.trimStartSeconds;
}
