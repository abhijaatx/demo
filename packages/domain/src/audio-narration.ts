/**
 * Narration & Background Audio Controls — TASK-068
 */

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
