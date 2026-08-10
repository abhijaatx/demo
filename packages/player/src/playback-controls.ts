/**
 * Autoplay, Presenter Mode & Playback Controls — TASK-077
 */

export interface PlaybackOptions {
  readonly autoPlay: boolean;
  readonly autoPlaySpeedMs: number;
  readonly loop: boolean;
  readonly isMuted: boolean;
  readonly speedMultiplier: number;
  readonly clickAnywhereToAdvance: boolean;
}

export function calculateNextAutoplayDelay(baseDelayMs: number, speedMultiplier: number): number {
  const mult = Math.max(0.5, Math.min(3.0, speedMultiplier));
  return Math.round(baseDelayMs / mult);
}

export function sanitizeAudienceOutputText(
  presenterNotes: string | null,
  isAudienceView: boolean
): string | null {
  if (isAudienceView) return null; // Private presenter notes never leak into audience view
  return presenterNotes;
}
