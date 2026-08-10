/**
 * Captions, WebVTT Exporter, Transcripts & Chapters — TASK-105
 */

export interface CaptionCue {
  readonly id: string;
  readonly startTimeSeconds: number;
  readonly endTimeSeconds: number;
  readonly text: string;
}

export interface CaptionTrack {
  readonly languageCode: string;
  readonly label: string;
  readonly cues: readonly CaptionCue[];
}

export function createCaptionCue(
  id: string,
  startTimeSeconds: number,
  endTimeSeconds: number,
  text: string
): CaptionCue {
  if (startTimeSeconds < 0 || endTimeSeconds <= startTimeSeconds) {
    throw new Error("Invalid caption cue start/end timestamp range.");
  }
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Caption text cannot be empty.");
  }

  return Object.freeze({
    id,
    startTimeSeconds,
    endTimeSeconds,
    text: cleanText
  });
}

export function formatVttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}

export function exportVttCaptions(track: CaptionTrack): string {
  const lines = ["WEBVTT", ""];

  track.cues.forEach((cue) => {
    const startStr = formatVttTimestamp(cue.startTimeSeconds);
    const endStr = formatVttTimestamp(cue.endTimeSeconds);
    lines.push(cue.id);
    lines.push(`${startStr} --> ${endStr}`);
    lines.push(cue.text);
    lines.push("");
  });

  return lines.join("\n");
}
