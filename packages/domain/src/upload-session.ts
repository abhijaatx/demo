// ── Upload Session Domain Model ────────────────────────────────────────────────
// Multipart upload sessions allow large files to be uploaded directly to object
// storage in ordered parts. The server controls key generation and size limits.
// Session state is persisted to support resume and idempotent finalization.

export const uploadSessionStatuses = [
  "pending", // awaiting part uploads
  "finalizing", // checksum verification in progress
  "complete", // asset has been created and is ready
  "aborted" // explicitly cancelled or expired
] as const;
export type UploadSessionStatus = (typeof uploadSessionStatuses)[number];

export const MAX_PART_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB per part
export const MIN_PART_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB minimum (except last)
export const MAX_PARTS = 1000; // S3 limit
export const MAX_UPLOAD_SESSION_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB total
export const UPLOAD_SESSION_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours
export const PART_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes per part URL

/** A multipart upload session record. */
export type UploadSession = Readonly<{
  id: string;
  workspaceId: string;
  uploaderUserId: string;
  fileName: string;
  mimeType: string;
  totalSizeInBytes: number;
  checksumSha256: string;
  storageKey: string;
  providerUploadId: string | null;
  status: UploadSessionStatus;
  partCount: number;
  partSizeInBytes: number;
  completedPartCount: number;
  assetId: string | null;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}>;

/** A single presigned URL for one upload part. */
export type UploadPart = Readonly<{
  partNumber: number; // 1-indexed
  uploadUrl: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}>;

/** Input for initializing a multipart upload. */
export type InitiateUploadSessionInput = Readonly<{
  fileName: string;
  mimeType: string;
  totalSizeInBytes: number;
  checksumSha256: string;
  idempotencyKey: string;
}>;

/** Response from initiating a session. */
export type UploadSessionInitResult = Readonly<{
  session: UploadSession;
  parts: readonly UploadPart[];
}>;

/** Input for finalizing a session (marks asset ready). */
export type FinalizeUploadSessionInput = Readonly<{
  checksumSha256?: string;
}>;

export class UploadSessionValidationError extends Error {
  readonly field: string | undefined;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "UploadSessionValidationError";
    this.field = field;
  }
}

export class UploadSessionNotFoundError extends Error {
  constructor(message = "Upload session not found.") {
    super(message);
    this.name = "UploadSessionNotFoundError";
  }
}

export class UploadSessionConflictError extends Error {
  constructor(message = "Upload session is in an incompatible state.") {
    super(message);
    this.name = "UploadSessionConflictError";
  }
}

export class UploadSessionStoreError extends Error {
  constructor(message = "The upload session record could not be saved or updated.") {
    super(message);
    this.name = "UploadSessionStoreError";
  }
}

/** Repository interface for upload session lifecycle. */
export interface UploadSessionRepository {
  initiate(
    actorUserId: string,
    workspaceId: string,
    input: InitiateUploadSessionInput
  ): Promise<UploadSessionInitResult>;

  getPartUrl(
    actorUserId: string,
    workspaceId: string,
    sessionId: string,
    partNumber: number
  ): Promise<UploadPart>;

  finalize(
    actorUserId: string,
    workspaceId: string,
    sessionId: string,
    input: FinalizeUploadSessionInput
  ): Promise<{ session: UploadSession; assetId: string }>;

  abort(actorUserId: string, workspaceId: string, sessionId: string): Promise<void>;

  getSession(actorUserId: string, workspaceId: string, sessionId: string): Promise<UploadSession>;
}

// ── Parsers ────────────────────────────────────────────────────────────────────

export function parseInitiateUploadSessionInput(value: unknown): InitiateUploadSessionInput {
  if (!isRecord(value)) {
    throw new UploadSessionValidationError("The upload session request is invalid.");
  }

  const fileName = sanitizeFileName(value["fileName"]);
  const mimeType = sanitizeMimeType(value["mimeType"]);
  const totalSizeInBytes = validateTotalSize(value["totalSizeInBytes"]);
  const checksumSha256 = validateChecksumSha256(value["checksumSha256"]);
  const idempotencyKey = validateIdempotencyKey(value["idempotencyKey"]);

  return Object.freeze({ fileName, mimeType, totalSizeInBytes, checksumSha256, idempotencyKey });
}

export function parseFinalizeUploadSessionInput(value: unknown): FinalizeUploadSessionInput {
  if (!isRecord(value)) {
    throw new UploadSessionValidationError("The finalize request is invalid.");
  }
  const raw = value["checksumSha256"];
  if (raw === undefined || raw === null) return Object.freeze({});

  const checksumSha256 = validateChecksumSha256(raw);
  return Object.freeze({ checksumSha256 });
}

/** Compute how many parts a given total size requires given a target part size. */
export function calculatePartLayout(totalSizeInBytes: number): {
  partCount: number;
  partSizeInBytes: number;
} {
  if (totalSizeInBytes <= MAX_PART_SIZE_BYTES) {
    return { partCount: 1, partSizeInBytes: totalSizeInBytes };
  }
  // Use a minimum 8MB part size for efficiency, grow to stay within MAX_PARTS limit
  const targetPartSize = Math.max(MIN_PART_SIZE_BYTES, Math.ceil(totalSizeInBytes / MAX_PARTS));
  const partCount = Math.ceil(totalSizeInBytes / targetPartSize);
  return { partCount, partSizeInBytes: targetPartSize };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function sanitizeFileName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new UploadSessionValidationError("Enter a valid file name.", "fileName");
  }
  const cleaned = value.trim().replace(/[/\\]/gu, "_");
  if (cleaned.length > 255) {
    throw new UploadSessionValidationError(
      "File name must be 255 characters or fewer.",
      "fileName"
    );
  }
  return cleaned;
}

function sanitizeMimeType(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9!#$&^_.+-]{0,126}$/iu.test(value.trim())
  ) {
    throw new UploadSessionValidationError("Choose a valid MIME type.", "mimeType");
  }
  return value.trim().toLowerCase();
}

function validateTotalSize(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > MAX_UPLOAD_SESSION_SIZE_BYTES
  ) {
    throw new UploadSessionValidationError(
      "File size must be between 1 byte and 5 GB.",
      "totalSizeInBytes"
    );
  }
  return value;
}

function validateChecksumSha256(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/iu.test(value.trim())) {
    throw new UploadSessionValidationError(
      "A valid 64-character SHA-256 checksum is required.",
      "checksumSha256"
    );
  }
  return value.trim().toLowerCase();
}

function validateIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 128) {
    throw new UploadSessionValidationError(
      "A valid idempotency key (1–128 characters) is required.",
      "idempotencyKey"
    );
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
