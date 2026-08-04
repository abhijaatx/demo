export const applicationName = "@supademo/media-worker" as const;

export {
  validateAssetUpload,
  runValidationJob,
  NoOpMalwareScanAdapter,
  type MalwareScanAdapter,
  type MalwareScanResult,
  type ValidationResult
} from "./asset-validation.js";

export {
  processImageAsset,
  StubImageProcessorAdapter,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_INPUT_BYTES,
  THUMBNAIL_SIZES,
  type ImageProcessorAdapter,
  type ImageProbeResult,
  type ImageProcessingJobOptions,
  type ImageProcessingResult,
  type CropRegion
} from "./image-processing.js";

export {
  processAvAsset,
  StubFfmpegAdapter,
  VIDEO_RENDITIONS,
  AUDIO_RENDITIONS,
  MAX_AV_INPUT_BYTES,
  MAX_AV_DURATION_SECONDS,
  FFMPEG_TIMEOUT_MS,
  type FfmpegAdapter,
  type MediaProbeResult,
  type AvProcessingOptions,
  type AvProcessingResult,
  type TranscodeOptions,
  type WaveformResult
} from "./av-processing.js";
