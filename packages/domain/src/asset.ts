export const assetTypes = ["image", "video", "audio", "document", "screenshot"] as const;
export type AssetType = (typeof assetTypes)[number];

export const assetStatuses = [
  "upload_pending",
  "validating",
  "quarantined",
  "processing",
  "ready",
  "failed",
  "deleted"
] as const;
export type AssetStatus = (typeof assetStatuses)[number];

export type Asset = Readonly<{
  id: string;
  workspaceId: string;
  uploaderUserId: string;
  type: AssetType;
  status: AssetStatus;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  storagePath: string;
  checksumSha256: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  thumbnailPath: string | null;
  quarantineReason: string | null;
  rejectionCode: AssetRejectionCode | null;
  processingJobId: string | null;
  storageUsedBytes: number;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
}>;

export const assetRejectionCodes = [
  "mime_mismatch",
  "signature_mismatch",
  "malware_detected",
  "size_limit_exceeded",
  "type_not_allowed",
  "corrupt_file",
  "processing_failed"
] as const;
export type AssetRejectionCode = (typeof assetRejectionCodes)[number];

export type AssetDerivative = Readonly<{
  id: string;
  assetId: string;
  workspaceId: string;
  kind: AssetDerivativeKind;
  mimeType: string;
  storagePath: string;
  sizeInBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: string;
}>;

export const assetDerivativeKinds = [
  "thumbnail_sm",
  "thumbnail_md",
  "thumbnail_lg",
  "webp",
  "avif",
  "mp4_360p",
  "mp4_720p",
  "mp4_1080p",
  "mp3_128k",
  "waveform_json",
  "poster_frame"
] as const;
export type AssetDerivativeKind = (typeof assetDerivativeKinds)[number];

export type AssetQuotaInfo = Readonly<{
  workspaceId: string;
  totalStorageUsedBytes: number;
  assetCount: number;
  storageLimitBytes: number;
  assetCountLimit: number;
}>;

export type AssetReference = Readonly<{
  assetId: string;
  workspaceId: string;
  demoId: string;
  referenceCount: number;
}>;

export class AssetQuotaExceededError extends Error {
  constructor(message = "Workspace storage quota exceeded.") {
    super(message);
    this.name = "AssetQuotaExceededError";
  }
}

export class AssetRejectedError extends Error {
  readonly code: AssetRejectionCode;

  constructor(code: AssetRejectionCode, message: string) {
    super(message);
    this.name = "AssetRejectedError";
    this.code = code;
  }
}

export type CreateAssetInput = Readonly<{
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  checksumSha256: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}>;

export type PresignedUploadResult = Readonly<{
  asset: Asset;
  uploadUrl: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}>;

export type MultipartUploadHandle = Readonly<{
  uploadId: string;
}>;

export type MultipartUploadPart = Readonly<{
  partNumber: number;
  etag: string;
  checksumSha256Base64: string;
  sizeInBytes: number;
}>;

export type MultipartUploadUrl = Readonly<{
  uploadUrl: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}>;

export type CompletedMultipartUpload = Readonly<{
  etag: string | null;
  checksumSha256Base64: string | null;
}>;

export type StoredObjectMetadata = Readonly<{
  sizeInBytes: number;
  mimeType: string;
  etag: string | null;
  checksumSha256Base64: string | null;
}>;

export class AssetValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "AssetValidationError";
    this.field = field;
  }
}

export class AssetNotFoundError extends Error {
  constructor(message = "Asset not found.") {
    super(message);
    this.name = "AssetNotFoundError";
  }
}

export class AssetConflictError extends Error {
  constructor(message = "The asset is not available in its current state.") {
    super(message);
    this.name = "AssetConflictError";
  }
}

export class AssetStoreError extends Error {
  constructor(message = "The asset record could not be saved or updated.") {
    super(message);
    this.name = "AssetStoreError";
  }
}

export interface ObjectStorageAdapter {
  generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds: number
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }>;
  generateDownloadUrl(key: string, expiresSeconds: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<StoredObjectMetadata | null>;
  getObjectStream(key: string, signal?: AbortSignal): Promise<AsyncIterable<Uint8Array>>;
  createMultipartUpload(key: string, contentType: string): Promise<MultipartUploadHandle>;
  generateMultipartPartUploadUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    sizeInBytes: number,
    checksumSha256Base64: string,
    expiresSeconds: number
  ): Promise<MultipartUploadUrl>;
  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: readonly MultipartUploadPart[]
  ): Promise<CompletedMultipartUpload>;
  listMultipartUploadParts(key: string, uploadId: string): Promise<readonly MultipartUploadPart[]>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}

export interface AssetRepository {
  getById(actorUserId: string, workspaceId: string, assetId: string): Promise<Asset>;
  createPresignedUpload(
    actorUserId: string,
    workspaceId: string,
    input: CreateAssetInput
  ): Promise<PresignedUploadResult>;
  completeUpload(
    actorUserId: string,
    workspaceId: string,
    assetId: string,
    checksumSha256?: string
  ): Promise<Asset>;
  getPresignedDownloadUrl(
    actorUserId: string,
    workspaceId: string,
    assetId: string,
    expiresSeconds?: number
  ): Promise<string>;
  deleteAsset(actorUserId: string, workspaceId: string, assetId: string): Promise<boolean>;

  // TASK-044: Validation and quarantine
  markValidating(workspaceId: string, assetId: string): Promise<Asset>;
  quarantine(
    workspaceId: string,
    assetId: string,
    code: AssetRejectionCode,
    reason: string
  ): Promise<Asset>;
  markFailed(workspaceId: string, assetId: string, reason: string): Promise<Asset>;

  // TASK-045/046: Processing
  markProcessing(workspaceId: string, assetId: string, jobId: string): Promise<Asset>;
  markReady(
    workspaceId: string,
    assetId: string,
    metadata: Partial<{
      thumbnailPath: string;
      width: number;
      height: number;
      durationSeconds: number;
    }>
  ): Promise<Asset>;
  saveDerivative(derivative: Omit<AssetDerivative, "id" | "createdAt">): Promise<AssetDerivative>;
  listDerivatives(workspaceId: string, assetId: string): Promise<readonly AssetDerivative[]>;

  // TASK-047: Asset library
  list(
    actorUserId: string,
    workspaceId: string,
    options?: AssetListOptions
  ): Promise<AssetListResult>;

  // TASK-048: Quota and references
  getQuota(workspaceId: string): Promise<AssetQuotaInfo>;
  incrementReferenceCount(workspaceId: string, assetId: string, demoId: string): Promise<void>;
  decrementReferenceCount(workspaceId: string, assetId: string, demoId: string): Promise<void>;
  softDelete(workspaceId: string, assetId: string): Promise<boolean>;
  cleanupExpiredSessions(olderThanSeconds: number): Promise<number>;
  cleanupDeletedAssets(olderThanDays: number): Promise<number>;
}

export type AssetListOptions = Readonly<{
  type?: AssetType;
  status?: AssetStatus;
  query?: string;
  limit?: number;
  cursor?: string;
}>;

export type AssetListResult = Readonly<{
  assets: readonly Asset[];
  nextCursor: string | null;
  totalCount: number;
}>;

export function parseCreateAssetInput(value: unknown): CreateAssetInput {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "fileName",
      "mimeType",
      "sizeInBytes",
      "checksumSha256",
      "width",
      "height",
      "durationSeconds"
    ])
  ) {
    throw new AssetValidationError("The create asset request is invalid.");
  }
  const fileName = sanitizeFileName(value["fileName"]);
  const mimeType = sanitizeMimeType(value["mimeType"]);
  const sizeInBytes = validateSizeInBytes(value["sizeInBytes"]);
  const checksumSha256 = validateChecksumSha256(value["checksumSha256"]);
  const width = validateOptionalPositiveInt(value["width"], "width");
  const height = validateOptionalPositiveInt(value["height"], "height");
  const durationSeconds = validateOptionalPositiveNumber(
    value["durationSeconds"],
    "durationSeconds"
  );

  return Object.freeze({
    fileName,
    mimeType,
    sizeInBytes,
    checksumSha256,
    width,
    height,
    durationSeconds
  });
}

export function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

function sanitizeFileName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AssetValidationError("Enter a valid file name.", "fileName");
  }
  const cleaned = value.trim().normalize("NFC");
  if (new TextEncoder().encode(cleaned).byteLength > 255) {
    throw new AssetValidationError("File name must be 255 bytes or fewer.", "fileName");
  }
  if (
    cleaned === "." ||
    cleaned === ".." ||
    cleaned.includes("/") ||
    cleaned.includes("\\") ||
    hasControlCharacters(cleaned) ||
    /[\u202a-\u202e\u2066-\u2069]/u.test(cleaned)
  ) {
    throw new AssetValidationError("Enter a valid file name.", "fileName");
  }
  return cleaned;
}

function sanitizeMimeType(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9!#$&^_.+-]{0,126}$/iu.test(value.trim())
  ) {
    throw new AssetValidationError("Choose a valid MIME type.", "mimeType");
  }
  return value.trim().toLowerCase();
}

function validateSizeInBytes(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > 5 * 1024 * 1024 * 1024
  ) {
    throw new AssetValidationError("File size must be between 1 byte and 5GB.", "sizeInBytes");
  }
  return value;
}

function validateChecksumSha256(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/iu.test(value.trim())) {
    throw new AssetValidationError(
      "A valid 64-character SHA-256 checksum is required.",
      "checksumSha256"
    );
  }
  return value.trim().toLowerCase();
}

function validateOptionalPositiveInt(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new AssetValidationError(`Field ${field} must be a positive integer.`, field);
  }
  return value;
}

function validateOptionalPositiveNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || value <= 0) {
    throw new AssetValidationError(`Field ${field} must be a positive number.`, field);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}
