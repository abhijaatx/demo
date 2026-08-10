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
  readonly volume: number;
  readonly duckingRatio: number;
  readonly loop: boolean;
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
