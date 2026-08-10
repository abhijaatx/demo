/**
 * Canonical timing metadata and deterministic playback helpers for video hotspots.
 *
 * Timing controls presentation only. It must never be used as authorization evidence.
 */

export const MAX_VIDEO_HOTSPOT_TIME_SECONDS = 7_200;

export type DemoHotspotTiming = Readonly<{
  kind: "pause" | "duration";
  startSeconds: number;
  endSeconds: number | null;
}>;

export type HotspotTimelineEdge = "start" | "end";

/**
 * Smallest duration-window width (in seconds) kept between cue edges so a
 * duration cue always remains valid after rounding and half-open visibility.
 */
const MIN_DURATION_WINDOW_SECONDS = 0.01;

/**
 * Bounds a timeline time value to the video duration. Non-finite values and
 * values outside [0, duration] are clamped so malformed drag/click input can
 * never produce invalid timing.
 */
export function clampVideoHotspotTime(value: number, durationSeconds: number): number {
  const max = Number.isFinite(durationSeconds)
    ? Math.min(Math.max(0, durationSeconds), MAX_VIDEO_HOTSPOT_TIME_SECONDS)
    : MAX_VIDEO_HOTSPOT_TIME_SECONDS;
  if (Number.isNaN(value)) return 0;
  if (!Number.isFinite(value)) return value > 0 ? max : 0;
  return Math.min(Math.max(0, value), max);
}

/**
 * Resolves the timing produced by dragging an edge of a timeline cue.
 *
 * - Dragging either edge of a pause cue converts it into a duration cue
 *   anchored at the original pause moment: the right edge extends forward and
 *   the left edge extends backward. When the anchor is at the timeline end the
 *   cue stays a pause rather than collapsing to an invalid window.
 * - Dragging an edge of a duration cue resizes that edge while keeping a valid
 *   half-open window (endSeconds strictly greater than startSeconds).
 *
 * Targets are clamped to the video duration. The result always parses as valid
 * timing via parseDemoHotspotTiming.
 */
export function resolveTimelineEdgeDrag(
  timing: DemoHotspotTiming,
  edge: HotspotTimelineEdge,
  targetSeconds: number,
  durationSeconds: number
): DemoHotspotTiming {
  const max = Number.isFinite(durationSeconds)
    ? Math.min(Math.max(0, durationSeconds), MAX_VIDEO_HOTSPOT_TIME_SECONDS)
    : MAX_VIDEO_HOTSPOT_TIME_SECONDS;
  const target = clampVideoHotspotTime(targetSeconds, max);
  const anchor = clampVideoHotspotTime(timing.startSeconds, max);
  const existingEnd =
    timing.endSeconds === null ? null : clampVideoHotspotTime(timing.endSeconds, max);

  if (timing.kind === "pause") {
    if (edge === "end") {
      if (anchor >= max) return timing;
      return Object.freeze({
        kind: "duration" as const,
        startSeconds: anchor,
        endSeconds: Math.min(Math.max(anchor + MIN_DURATION_WINDOW_SECONDS, target), max)
      });
    }
    if (anchor <= 0) return timing;
    return Object.freeze({
      kind: "duration" as const,
      startSeconds: Math.max(0, Math.min(anchor - MIN_DURATION_WINDOW_SECONDS, target)),
      endSeconds: anchor
    });
  }

  if (edge === "end") {
    return Object.freeze({
      kind: "duration" as const,
      startSeconds: Math.min(anchor, Math.max(0, max - MIN_DURATION_WINDOW_SECONDS)),
      endSeconds: Math.min(Math.max(anchor + MIN_DURATION_WINDOW_SECONDS, target), max)
    });
  }
  return Object.freeze({
    kind: "duration" as const,
    startSeconds: Math.max(
      0,
      Math.min((existingEnd ?? anchor) - MIN_DURATION_WINDOW_SECONDS, target)
    ),
    endSeconds: existingEnd ?? anchor
  });
}

export type VideoHotspotCue = Readonly<{
  id: string;
  timing?: DemoHotspotTiming | null;
}>;

const EMPTY_HOTSPOT_IDS: ReadonlySet<string> = new Set<string>();

export function parseDemoHotspotTiming(input: unknown): DemoHotspotTiming | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const kind = raw["kind"];
  const startSeconds = raw["startSeconds"];

  if (
    (kind !== "pause" && kind !== "duration") ||
    typeof startSeconds !== "number" ||
    !Number.isFinite(startSeconds) ||
    startSeconds < 0 ||
    startSeconds > MAX_VIDEO_HOTSPOT_TIME_SECONDS
  ) {
    return null;
  }

  if (kind === "pause") {
    return Object.freeze({ kind, startSeconds, endSeconds: null });
  }

  const endSeconds = raw["endSeconds"];
  if (
    typeof endSeconds !== "number" ||
    !Number.isFinite(endSeconds) ||
    endSeconds <= startSeconds ||
    endSeconds > MAX_VIDEO_HOTSPOT_TIME_SECONDS
  ) {
    return null;
  }

  return Object.freeze({ kind, startSeconds, endSeconds });
}

/**
 * Legacy hotspots without timing remain visible. Duration cues use a half-open
 * window so adjacent cues do not overlap at the shared boundary.
 */
export function isDemoHotspotVisibleAtTime(
  hotspot: VideoHotspotCue,
  currentTimeSeconds: number,
  activePauseHotspotIds: ReadonlySet<string> = EMPTY_HOTSPOT_IDS
): boolean {
  const timing = hotspot.timing;
  if (!timing) return true;
  if (timing.kind === "pause") return activePauseHotspotIds.has(hotspot.id);
  if (!Number.isFinite(currentTimeSeconds) || timing.endSeconds === null) return false;
  return currentTimeSeconds >= timing.startSeconds && currentTimeSeconds < timing.endSeconds;
}

/**
 * Returns every untriggered pause cue at the earliest timestamp crossed during
 * forward playback. Grouping equal timestamps pauses once while showing every
 * hotspot scheduled for that moment.
 */
export function findCrossedPauseHotspots<T extends VideoHotspotCue>(
  hotspots: readonly T[],
  previousTimeSeconds: number,
  currentTimeSeconds: number,
  triggeredPauseHotspotIds: ReadonlySet<string> = EMPTY_HOTSPOT_IDS
): readonly T[] {
  if (
    !Number.isFinite(previousTimeSeconds) ||
    !Number.isFinite(currentTimeSeconds) ||
    currentTimeSeconds <= previousTimeSeconds
  ) {
    return Object.freeze([]);
  }

  const crossed = hotspots
    .filter((hotspot) => {
      const timing = hotspot.timing;
      return (
        timing?.kind === "pause" &&
        !triggeredPauseHotspotIds.has(hotspot.id) &&
        timing.startSeconds >= previousTimeSeconds &&
        timing.startSeconds <= currentTimeSeconds
      );
    })
    .sort((left, right) => {
      const leftTime = left.timing?.startSeconds ?? 0;
      const rightTime = right.timing?.startSeconds ?? 0;
      return leftTime - rightTime || left.id.localeCompare(right.id);
    });

  const earliestTime = crossed[0]?.timing?.startSeconds;
  if (earliestTime === undefined) return Object.freeze([]);
  return Object.freeze(crossed.filter((hotspot) => hotspot.timing?.startSeconds === earliestTime));
}

/**
 * Rebuilds the triggered set after an explicit seek. Cues before the seek time
 * stay consumed, while cues at or after it are rearmed for subsequent playback.
 */
export function pauseHotspotIdsBeforeTime(
  hotspots: readonly VideoHotspotCue[],
  currentTimeSeconds: number
): readonly string[] {
  if (!Number.isFinite(currentTimeSeconds) || currentTimeSeconds <= 0) {
    return Object.freeze([]);
  }
  return Object.freeze(
    hotspots
      .filter(
        (hotspot) =>
          hotspot.timing?.kind === "pause" && hotspot.timing.startSeconds < currentTimeSeconds
      )
      .sort((left, right) => {
        const leftTime = left.timing?.startSeconds ?? 0;
        const rightTime = right.timing?.startSeconds ?? 0;
        return leftTime - rightTime || left.id.localeCompare(right.id);
      })
      .map((hotspot) => hotspot.id)
  );
}
