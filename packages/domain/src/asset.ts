export const assetTypes = ["image", "video", "audio", "document", "screenshot"] as const;
export type AssetType = (typeof assetTypes)[number];

export const assetStatuses = ["upload_pending", "ready", "failed", "deleted"] as const;
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
  createdAt: string;
  updatedAt: string;
}>;

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
  headObject(
    key: string
  ): Promise<{ size: number; mimeType: string; checksumSha256?: string } | null>;
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
}

export function parseCreateAssetInput(value: unknown): CreateAssetInput {
  if (!isRecord(value)) {
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
  const cleaned = value.trim().replace(/[/\\]/gu, "_");
  if (cleaned.length > 255) {
    throw new AssetValidationError("File name must be 255 characters or fewer.", "fileName");
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
