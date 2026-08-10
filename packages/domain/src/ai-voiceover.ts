/**
 * AI Voiceover Generation & Text-to-Speech (TTS) Catalog — TASK-138
 */

export interface TtsVoiceOption {
  readonly voiceId: string;
  readonly name: string;
  readonly locale: string;
  readonly gender: "male" | "female" | "neutral";
}

export interface TtsGenerationJob {
  readonly jobId: string;
  readonly text: string;
  readonly voiceId: string;
  readonly audioAssetUrl: string;
  readonly status: "ready" | "failed";
}

const TTS_VOICE_CATALOG: readonly TtsVoiceOption[] = Object.freeze([
  Object.freeze({ voiceId: "en-US-1", name: "Rachel", locale: "en-US", gender: "female" }),
  Object.freeze({ voiceId: "en-US-2", name: "Adam", locale: "en-US", gender: "male" }),
  Object.freeze({ voiceId: "es-ES-1", name: "Lucia", locale: "es-ES", gender: "female" })
]);

export function getAvailableTtsVoices(): readonly TtsVoiceOption[] {
  return TTS_VOICE_CATALOG;
}

export async function generateAiVoiceover(
  text: string,
  voiceId: string
): Promise<TtsGenerationJob> {
  if (!text.trim()) {
    throw new Error("Text-to-speech script cannot be empty.");
  }

  const voice = TTS_VOICE_CATALOG.find((v) => v.voiceId === voiceId);
  if (!voice) {
    throw new Error(`Voice ID '${voiceId}' not found in TTS catalog.`);
  }

  const jobId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const audioAssetUrl = `https://cdn.supademo.com/audio/tts_${jobId}.mp3`;

  return Object.freeze({
    jobId,
    text: text.trim(),
    voiceId,
    audioAssetUrl,
    status: "ready"
  });
}
