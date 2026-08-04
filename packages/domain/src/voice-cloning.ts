/**
 * Consent-Governed Voice Cloning & Authorization Workflow — TASK-139
 */

export interface VoiceConsentRecord {
  readonly voiceId: string;
  readonly speakerName: string;
  readonly consentDocumentUrl: string;
  readonly isRevoked: boolean;
  readonly createdAtIso: string;
}

export function createVoiceConsentRecord(
  speakerName: string,
  consentDocumentUrl: string
): VoiceConsentRecord {
  if (!speakerName.trim() || !consentDocumentUrl.startsWith("https://")) {
    throw new Error("Valid speaker name and HTTPS consent document URL are required.");
  }

  return Object.freeze({
    voiceId: `voice-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    speakerName: speakerName.trim(),
    consentDocumentUrl,
    isRevoked: false,
    createdAtIso: new Date().toISOString()
  });
}

export function revokeVoiceConsent(record: VoiceConsentRecord): VoiceConsentRecord {
  return Object.freeze({
    ...record,
    isRevoked: true
  });
}
