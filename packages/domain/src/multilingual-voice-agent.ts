/**
 * Multilingual Voice-Led Agent Runtime & Speech Adapter — TASK-167
 */

export interface VoiceAgentConfig {
  readonly agentId: string;
  readonly languageLocale: string;
  readonly isVoiceOutputEnabled: boolean;
  readonly voiceId: string;
}

export function createVoiceAgentConfig(
  agentId: string,
  languageLocale = "en-US",
  voiceId = "voice_en_female_1"
): VoiceAgentConfig {
  if (!agentId.trim()) {
    throw new Error("Voice agent configuration requires a valid agent ID.");
  }

  return Object.freeze({
    agentId: agentId.trim(),
    languageLocale: languageLocale.trim(),
    isVoiceOutputEnabled: true,
    voiceId: voiceId.trim()
  });
}
