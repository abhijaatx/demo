import {
  AuthorizationDeniedError,
  AssetNotFoundError,
  AssetStoreError,
  inferAssetType,
  normalizeUserId,
  UploadSessionConflictError,
  UploadSessionNotFoundError,
  UploadSessionStoreError,
  UploadSessionValidationError,
  parseInitiateUploadSessionInput,
  parseFinalizeUploadSessionInput,
  calculatePartLayout,
  UPLOAD_SESSION_EXPIRY_SECONDS,
  PART_URL_EXPIRY_SECONDS,
  type AssetStatus,
  type AssetType,
  type ObjectStorageAdapter,
  type UploadSession,
  type UploadSessionStatus,
  type UploadPart,
  type UploadSessionInitResult,
  type FinalizeUploadSessionInput,
  type InitiateUploadSessionInput,
  type UploadSessionRepository,
  type WorkspaceRole
} from "@supademo/domain";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type UploadSessionRow = Readonly<{
  id: string;
  workspace_id: string;
  uploader_user_id: string;
  file_name: string;
  mime_type: string;
  total_size_in_bytes: string | number;
  checksum_sha256: string;
  storage_key: string;
  provider_upload_id: string | null;
  status: UploadSessionStatus;
  part_count: number | string;
  part_size_in_bytes: string | number;
  completed_part_count: number | string;
  asset_id: string | null;
  idempotency_key: string;
  expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}>;

type AssetRow = Readonly<{
  id: string;
  workspace_id: string;
  uploader_user_id: string;
  type: AssetType;
  status: AssetStatus;
  file_name: string;
  mime_type: string;
  size_in_bytes: string | number;
  storage_path: string;
  checksum_sha256: string;
  width: number | null;
  height: number | null;
  duration_seconds: string | number | null;
  created_at: Date | string;
  updated_at: Date | string;
}>;

const sessionColumns = [
  "id",
  "workspace_id",
  "uploader_user_id",
  "file_name",
  "mime_type",
  "total_size_in_bytes",
  "checksum_sha256",
  "storage_key",
  "provider_upload_id",
  "status",
  "part_count",
  "part_size_in_bytes",
  "completed_part_count",
  "asset_id",
  "idempotency_key",
  "expires_at",
  "created_at",
  "updated_at"
].join(", ");

export class DatabaseUploadSessionRepository implements UploadSessionRepository {
  constructor(
    private readonly pool: import("pg").Pool,
    private readonly storageAdapter: ObjectStorageAdapter
  ) {}

  async initiate(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputRaw: InitiateUploadSessionInput
  ): Promise<UploadSessionInitResult> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const input = parseInitiateUploadSessionInput(inputRaw);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        // Idempotency: return existing session if idempotency key matches
        const existing = await query<UploadSessionRow>(
          client,
          `SELECT ${sessionColumns} FROM upload_sessions
           WHERE workspace_id = $1 AND idempotency_key = $2 AND status = 'pending'`,
          [workspaceId, input.idempotencyKey]
        );

        if (existing.rows[0]) {
          const session = mapSession(existing.rows[0]);
          const parts = await buildPresignedParts(
            this.storageAdapter,
            session.storageKey,
            session.mimeType,
            session.partCount,
            session.partSizeInBytes,
            session.totalSizeInBytes
          );
          return Object.freeze({ session, parts });
        }

        const sessionId = createUuidV7();
        const assetType = inferAssetType(input.mimeType);
        const storageKey = `workspaces/${workspaceId}/uploads/${sessionId}/${input.fileName}`;
        const { partCount, partSizeInBytes } = calculatePartLayout(input.totalSizeInBytes);
        const expiresAt = new Date(Date.now() + UPLOAD_SESSION_EXPIRY_SECONDS * 1000).toISOString();

        // Insert session record
        const result = await query<UploadSessionRow>(
          client,
          `INSERT INTO upload_sessions (
            id, workspace_id, uploader_user_id, file_name, mime_type,
            total_size_in_bytes, checksum_sha256, storage_key, status,
            part_count, part_size_in_bytes, idempotency_key, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12)
          RETURNING ${sessionColumns}`,
          [
            sessionId,
            workspaceId,
            actorUserId,
            input.fileName,
            input.mimeType,
            input.totalSizeInBytes,
            input.checksumSha256,
            storageKey,
            partCount,
            partSizeInBytes,
            input.idempotencyKey,
            expiresAt
          ]
        );

        const row = result.rows[0];
        if (!row) throw new UploadSessionStoreError();

        // Pre-create part rows (partNumber tracking)
        for (let i = 1; i <= partCount; i++) {
          await query(
            client,
            `INSERT INTO upload_parts (session_id, part_number) VALUES ($1, $2)
             ON CONFLICT (session_id, part_number) DO NOTHING`,
            [sessionId, i]
          );
        }

        // Generate presigned part URLs outside transaction to avoid long locks
        const session = mapSession(row);
        const parts = await buildPresignedParts(
          this.storageAdapter,
          storageKey,
          input.mimeType,
          partCount,
          partSizeInBytes,
          input.totalSizeInBytes
        );

        void assetType; // assetType will be used at finalize time
        return Object.freeze({ session, parts });
      });
    } catch (error) {
      throw normalizeSessionError(error);
    }
  }

  async getPartUrl(
    actorUserIdInput: string,
    workspaceIdInput: string,
    sessionIdInput: string,
    partNumber: number
  ): Promise<UploadPart> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const sessionId = normalizeUserId(sessionIdInput);

    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 1000) {
      throw new UploadSessionValidationError(
        "Part number must be an integer between 1 and 1000.",
        "partNumber"
      );
    }

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const result = await query<UploadSessionRow>(
          client,
          `SELECT ${sessionColumns} FROM upload_sessions
           WHERE id = $1 AND workspace_id = $2 AND uploader_user_id = $3`,
          [sessionId, workspaceId, actorUserId]
        );

        const row = result.rows[0];
        if (!row) throw new UploadSessionNotFoundError();

        const session = mapSession(row);
        if (session.status !== "pending") {
          throw new UploadSessionConflictError(
            `Cannot get part URL for session in '${session.status}' state.`
          );
        }
        if (new Date(session.expiresAt) < new Date()) {
          throw new UploadSessionConflictError("Upload session has expired.");
        }
        if (partNumber > session.partCount) {
          throw new UploadSessionValidationError(
            `Part number ${partNumber} exceeds the session's ${session.partCount} parts.`,
            "partNumber"
          );
        }

        const url = await this.storageAdapter.generateUploadUrl(
          `${session.storageKey}.part${partNumber}`,
          session.mimeType,
          PART_URL_EXPIRY_SECONDS
        );

        return Object.freeze({
          partNumber,
          uploadUrl: url.uploadUrl,
          headers: url.headers,
          expiresInSeconds: PART_URL_EXPIRY_SECONDS
        });
      });
    } catch (error) {
      throw normalizeSessionError(error);
    }
  }

  async finalize(
    actorUserIdInput: string,
    workspaceIdInput: string,
    sessionIdInput: string,
    inputRaw: FinalizeUploadSessionInput
  ): Promise<{ session: UploadSession; assetId: string }> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const sessionId = normalizeUserId(sessionIdInput);
    const input = parseFinalizeUploadSessionInput(inputRaw);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const result = await query<UploadSessionRow>(
          client,
          `SELECT ${sessionColumns} FROM upload_sessions
           WHERE id = $1 AND workspace_id = $2 AND uploader_user_id = $3
           FOR UPDATE`,
          [sessionId, workspaceId, actorUserId]
        );

        const row = result.rows[0];
        if (!row) throw new UploadSessionNotFoundError();

        const session = mapSession(row);

        // Idempotent: if already complete return existing asset
        if (session.status === "complete" && session.assetId) {
          return Object.freeze({ session, assetId: session.assetId });
        }

        if (session.status !== "pending") {
          throw new UploadSessionConflictError(
            `Cannot finalize session in '${session.status}' state.`
          );
        }

        if (new Date(session.expiresAt) < new Date()) {
          throw new UploadSessionConflictError("Upload session has expired.");
        }

        // Optional checksum verification
        if (
          input.checksumSha256 &&
          input.checksumSha256.toLowerCase() !== session.checksumSha256.toLowerCase()
        ) {
          throw new UploadSessionValidationError(
            "Uploaded file checksum does not match the expected value.",
            "checksumSha256"
          );
        }

        // Mark session as finalizing
        await query(
          client,
          `UPDATE upload_sessions SET status = 'finalizing', updated_at = now()
           WHERE id = $1`,
          [sessionId]
        );

        // Create the workspace_assets record from the session
        const assetId = createUuidV7();
        const assetType = inferAssetType(session.mimeType);

        const assetResult = await query<AssetRow>(
          client,
          `INSERT INTO workspace_assets (
            id, workspace_id, uploader_user_id, type, status,
            file_name, mime_type, size_in_bytes, storage_path, checksum_sha256
          ) VALUES ($1, $2, $3, $4, 'ready', $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            assetId,
            workspaceId,
            actorUserId,
            assetType,
            session.fileName,
            session.mimeType,
            session.totalSizeInBytes,
            session.storageKey,
            session.checksumSha256
          ]
        );

        if (!assetResult.rows[0]) throw new AssetStoreError();

        // Mark session complete and link asset
        const completedResult = await query<UploadSessionRow>(
          client,
          `UPDATE upload_sessions
           SET status = 'complete', asset_id = $2, updated_at = now()
           WHERE id = $1
           RETURNING ${sessionColumns}`,
          [sessionId, assetId]
        );

        const completed = completedResult.rows[0];
        if (!completed) throw new UploadSessionStoreError();

        return Object.freeze({ session: mapSession(completed), assetId });
      });
    } catch (error) {
      throw normalizeSessionError(error);
    }
  }

  async abort(
    actorUserIdInput: string,
    workspaceIdInput: string,
    sessionIdInput: string
  ): Promise<void> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const sessionId = normalizeUserId(sessionIdInput);

    try {
      await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const result = await query<UploadSessionRow>(
          client,
          `SELECT ${sessionColumns} FROM upload_sessions
           WHERE id = $1 AND workspace_id = $2 AND uploader_user_id = $3
           FOR UPDATE`,
          [sessionId, workspaceId, actorUserId]
        );

        const row = result.rows[0];
        if (!row) throw new UploadSessionNotFoundError();

        const session = mapSession(row);
        if (session.status === "aborted") return; // Already aborted — idempotent

        if (session.status === "complete") {
          throw new UploadSessionConflictError("Cannot abort a completed upload session.");
        }

        await query(
          client,
          `UPDATE upload_sessions SET status = 'aborted', updated_at = now()
           WHERE id = $1`,
          [sessionId]
        );

        // Attempt best-effort cleanup of any partial objects in storage
        await this.storageAdapter.deleteObject(session.storageKey).catch(() => undefined);
      });
    } catch (error) {
      throw normalizeSessionError(error);
    }
  }

  async getSession(
    actorUserIdInput: string,
    workspaceIdInput: string,
    sessionIdInput: string
  ): Promise<UploadSession> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const sessionId = normalizeUserId(sessionIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const result = await query<UploadSessionRow>(
          client,
          `SELECT ${sessionColumns} FROM upload_sessions
           WHERE id = $1 AND workspace_id = $2`,
          [sessionId, workspaceId]
        );

        const row = result.rows[0];
        if (!row) throw new UploadSessionNotFoundError();
        return mapSession(row);
      });
    } catch (error) {
      throw normalizeSessionError(error);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function requireWorkspaceMembership(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<void> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
    [workspaceId, userId]
  );
  if (!result.rows[0]) throw new AuthorizationDeniedError();
}

async function buildPresignedParts(
  storage: ObjectStorageAdapter,
  storageKey: string,
  mimeType: string,
  partCount: number,
  partSizeInBytes: number,
  totalSizeInBytes: number
): Promise<readonly UploadPart[]> {
  const parts: UploadPart[] = [];
  for (let i = 1; i <= partCount; i++) {
    const partKey = `${storageKey}.part${i}`;
    const url = await storage.generateUploadUrl(partKey, mimeType, PART_URL_EXPIRY_SECONDS);
    // Last part may be smaller
    const isLast = i === partCount;
    const remainder = totalSizeInBytes - partSizeInBytes * (partCount - 1);
    void (isLast && remainder); // size tracking reserved for future validation
    parts.push(
      Object.freeze({
        partNumber: i,
        uploadUrl: url.uploadUrl,
        headers: url.headers,
        expiresInSeconds: PART_URL_EXPIRY_SECONDS
      })
    );
  }
  return Object.freeze(parts);
}

function mapSession(row: UploadSessionRow): UploadSession {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    uploaderUserId: row.uploader_user_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    totalSizeInBytes: Number(row.total_size_in_bytes),
    checksumSha256: row.checksum_sha256,
    storageKey: row.storage_key,
    providerUploadId: row.provider_upload_id ?? null,
    status: row.status,
    partCount: Number(row.part_count),
    partSizeInBytes: Number(row.part_size_in_bytes),
    completedPartCount: Number(row.completed_part_count),
    assetId: row.asset_id ?? null,
    idempotencyKey: row.idempotency_key,
    expiresAt: requireIso(row.expires_at),
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at)
  });
}

function requireIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new UploadSessionStoreError();
  return date.toISOString();
}

function normalizeSessionError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof UploadSessionNotFoundError ||
    error instanceof UploadSessionConflictError ||
    error instanceof UploadSessionValidationError ||
    error instanceof UploadSessionStoreError ||
    error instanceof AssetNotFoundError ||
    error instanceof AssetStoreError
  ) {
    return error;
  }
  return new UploadSessionStoreError();
}
