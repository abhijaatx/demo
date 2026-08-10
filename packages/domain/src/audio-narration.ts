/**
 * Narration & Background Audio Controls — TASK-068
 *
 * `DemoAudioNarration` lives here (shared by steps and chapters) so both
 * `demo-document.ts` and `chapter-model.ts` can use it without a circular
 * runtime import: this module depends only on the low-level URL validator.
 */

import { validateSafeUrl } from "./hotspot-schema.js";

export type DemoAudioNarration = Readonly<{
  assetId: string;
  durationSeconds: number;
  autoPlay: boolean;
  /** Optional Voiceovers 2.0 metadata retained for backwards compatibility. */
  source?: "ai" | "manual" | "upload" | "clone";
  voiceId?: string | null;
  audioUrl?: string | null;
  transcriptText?: string | null;
  expressive?: boolean;
  speed?: number;
  stability?: number;
}>;

export function parseDemoAudioNarration(input: unknown): DemoAudioNarration {
  const raw = input as Record<string, unknown>;
  const rawAudioUrl = typeof raw["audioUrl"] === "string" ? raw["audioUrl"].slice(0, 2_048) : null;
  const audioUrl = rawAudioUrl?.startsWith("blob:")
    ? rawAudioUrl
    : validateSafeUrl(rawAudioUrl)?.startsWith("https:")
      ? rawAudioUrl
      : null;
  const rawSource = String(raw["source"] ?? "manual");
  const source: "ai" | "manual" | "upload" | "clone" = ["ai", "manual", "upload", "clone"].includes(
    rawSource
  )
    ? (rawSource as "ai" | "manual" | "upload" | "clone")
    : "manual";
  return Object.freeze({
    assetId: String(raw["assetId"] ?? "audio").slice(0, 128),
    durationSeconds: Math.max(
      0,
      Math.min(
        3_600,
        Number.isFinite(Number(raw["durationSeconds"])) ? Number(raw["durationSeconds"]) : 0
      )
    ),
    autoPlay: Boolean(raw["autoPlay"] ?? true),
    source,
    voiceId: typeof raw["voiceId"] === "string" ? raw["voiceId"].slice(0, 64) : null,
    audioUrl,
    transcriptText:
      typeof raw["transcriptText"] === "string" ? raw["transcriptText"].slice(0, 4_000) : null,
    expressive: Boolean(raw["expressive"] ?? false),
    speed: Math.max(
      0.5,
      Math.min(2, Number.isFinite(Number(raw["speed"])) ? Number(raw["speed"]) : 1)
    ),
    stability: Math.max(
      0,
      Math.min(1, Number.isFinite(Number(raw["stability"])) ? Number(raw["stability"]) : 0.5)
    )
  });
}

export interface StepAudioNarration {
  readonly audioAssetId: string;
  readonly storagePath: string;
  readonly durationSeconds: number;
  readonly startOffsetMs: number;
  readonly volume: number;
  readonly transcriptText: string | null;
}

export interface DemoBackgroundAudio {
  readonly audioAssetId: string;
  readonly storagePath: string;
  /** Safe public playback URL (https or blob) resolved for the browser player. */
  readonly audioUrl: string | null;
  /** Human-friendly label (preset title or uploaded file name). */
  readonly title: string | null;
  /** Built-in preset id when the track came from a preset (allowlisted). */
  readonly presetId: string | null;
  readonly volume: number;
  readonly duckingRatio: number;
  readonly loop: boolean;
  /** Starts paused/muted in the viewer; viewers can enable it from the player. */
  readonly muted: boolean;
}

/**
 * Built-in background music presets served from the approved media CDN.
 * Presets are immutable metadata: every audio URL is a bounded https URL and
 * each id is a lowercase slug validated against this allowlist by the parser.
 */
export interface BackgroundMusicPreset {
  readonly presetId: string;
  readonly title: string;
  readonly audioUrl: string;
  readonly durationSeconds: number;
}

export const BACKGROUND_MUSIC_PRESETS: readonly BackgroundMusicPreset[] = Object.freeze([
  Object.freeze({
    presetId: "calm-ambient",
    title: "Calm Ambient",
    audioUrl: "https://cdn.supademo.com/audio/presets/calm-ambient.mp3",
    durationSeconds: 120
  }),
  Object.freeze({
    presetId: "focused-minimal",
    title: "Focused Minimal",
    audioUrl: "https://cdn.supademo.com/audio/presets/focused-minimal.mp3",
    durationSeconds: 120
  }),
  Object.freeze({
    presetId: "uplifting-pop",
    title: "Uplifting Pop",
    audioUrl: "https://cdn.supademo.com/audio/presets/uplifting-pop.mp3",
    durationSeconds: 120
  }),
  Object.freeze({
    presetId: "corporate-tech",
    title: "Corporate Tech",
    audioUrl: "https://cdn.supademo.com/audio/presets/corporate-tech.mp3",
    durationSeconds: 120
  })
]);

/**
 * Safe, bounded parser for demo-level background audio settings.
 *
 * Guarantees:
 * - Requires at least one audio source (`audioUrl` or `storagePath`); an object
 *   with neither resolves to `null` so legacy documents stay clean.
 * - `audioUrl` accepts only validated https URLs or non-null-origin blob URLs;
 *   every other scheme (javascript:, data:, http:) is dropped.
 * - All string fields are length-bounded and `presetId` is allowlisted against
 *   `BACKGROUND_MUSIC_PRESETS`.
 * - `volume`, `duckingRatio` are clamped to [0, 1] to prevent clipping.
 * - Returns a frozen object and never throws on malformed input.
 */
export function parseDemoBackgroundAudio(input: unknown): DemoBackgroundAudio | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const rawAudioUrl = typeof raw["audioUrl"] === "string" ? raw["audioUrl"].slice(0, 2_048) : null;
  // Blob URLs are only accepted when they carry a real (non-null) origin, so
  // sandboxed `blob:null/...` and malformed URLs are rejected at parse time.
  let audioUrl: string | null = null;
  if (rawAudioUrl?.startsWith("blob:")) {
    try {
      audioUrl = new URL(rawAudioUrl).origin !== "null" ? rawAudioUrl : null;
    } catch {
      audioUrl = null;
    }
  } else if (validateSafeUrl(rawAudioUrl)?.startsWith("https:")) {
    audioUrl = rawAudioUrl;
  }
  const storagePath =
    typeof raw["storagePath"] === "string" ? raw["storagePath"].slice(0, 512) : "";
  if (!audioUrl && !storagePath) return null;

  const rawPresetId = typeof raw["presetId"] === "string" ? raw["presetId"].slice(0, 64) : null;
  const presetId =
    rawPresetId && BACKGROUND_MUSIC_PRESETS.some((preset) => preset.presetId === rawPresetId)
      ? rawPresetId
      : null;

  return Object.freeze({
    audioAssetId: String(raw["audioAssetId"] ?? "background-audio").slice(0, 128),
    storagePath,
    audioUrl,
    title: typeof raw["title"] === "string" ? raw["title"].slice(0, 80) : null,
    presetId,
    volume: Math.max(
      0,
      Math.min(1, Number.isFinite(Number(raw["volume"])) ? Number(raw["volume"]) : 0.7)
    ),
    duckingRatio: Math.max(
      0,
      Math.min(1, Number.isFinite(Number(raw["duckingRatio"])) ? Number(raw["duckingRatio"]) : 0.6)
    ),
    loop: Boolean(raw["loop"] ?? true),
    muted: Boolean(raw["muted"] ?? false)
  });
}

export function calculateEffectiveAudioVolume(
  hasActiveStepVoiceover: boolean,
  backgroundAudio: DemoBackgroundAudio | null
): { stepVoiceoverVolume: number; backgroundAudioVolume: number } {
  const bgVolume = backgroundAudio ? Math.max(0, Math.min(1, backgroundAudio.volume)) : 0;

  if (!hasActiveStepVoiceover || !backgroundAudio) {
    return {
      stepVoiceoverVolume: 1.0,
      backgroundAudioVolume: bgVolume
    };
  }

  // Calculate ducked background volume
  const ducking = Math.max(0, Math.min(1, backgroundAudio.duckingRatio));
  const duckedBgVolume = bgVolume * (1 - ducking);

  return {
    stepVoiceoverVolume: 1.0,
    backgroundAudioVolume: Math.round(duckedBgVolume * 100) / 100
  };
}
