/**
 * Audio/Video Media Devices & Picture-in-Picture Webcam Settings — TASK-102
 */

export type WebcamPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface AudioVideoDeviceConfig {
  readonly micDeviceId: string | null;
  readonly isMicMuted: boolean;
  readonly webcamDeviceId: string | null;
  readonly isWebcamEnabled: boolean;
  readonly webcamPosition: WebcamPosition;
}

export function createAudioVideoDeviceConfig(input: {
  micDeviceId?: string | null;
  isMicMuted?: boolean;
  webcamDeviceId?: string | null;
  isWebcamEnabled?: boolean;
  webcamPosition?: WebcamPosition;
}): AudioVideoDeviceConfig {
  return Object.freeze({
    micDeviceId: input.micDeviceId ?? null,
    isMicMuted: Boolean(input.isMicMuted),
    webcamDeviceId: input.webcamDeviceId ?? null,
    isWebcamEnabled: Boolean(input.isWebcamEnabled),
    webcamPosition: input.webcamPosition ?? "bottom-right"
  });
}

export function toggleMicrophoneMute(config: AudioVideoDeviceConfig): AudioVideoDeviceConfig {
  return Object.freeze({
    ...config,
    isMicMuted: !config.isMicMuted
  });
}
