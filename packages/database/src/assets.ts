import {
  AssetNotFoundError,
  AssetStoreError,
  AssetValidationError,
  AuthorizationDeniedError,
  inferAssetType,
  normalizeUserId,
  parseCreateAssetInput,
  type Asset,
  type AssetRepository,
  type AssetStatus,
  type AssetType,
  type CreateAssetInput,
  type ObjectStorageAdapter,
  type PresignedUploadResult,
  type WorkspaceRole
} from "@supademo/domain";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

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

export class DatabaseAssetRepository implements AssetRepository {
  constructor(
    private readonly pool: import("pg").Pool,
    private readonly storageAdapter: ObjectStorageAdapter
  ) {}

  async getById(
    actorUserIdInput: string,
    workspaceIdInput: string,
    assetIdInput: string
  ): Promise<Asset> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);
        const result = await query<AssetRow>(
          client,
          `
            SELECT ${assetColumns}
            FROM workspace_assets
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
          `,
          [assetId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) throw new AssetNotFoundError();
        return mapAsset(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async createPresignedUpload(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputInput: CreateAssetInput
  ): Promise<PresignedUploadResult> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const input = parseCreateAssetInput(inputInput);
    const assetType = inferAssetType(input.mimeType);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const assetId = createUuidV7();
        const storagePath = `workspaces/${workspaceId}/assets/${assetId}/${input.fileName}`;

        const result = await query<AssetRow>(
          client,
          `
            INSERT INTO workspace_assets (
              id, workspace_id, uploader_user_id, type, status, file_name, mime_type, size_in_bytes, storage_path, checksum_sha256, width, height, duration_seconds
            ) VALUES (
              $1, $2, $3, $4, 'upload_pending', $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING ${assetColumns}
          `,
          [
            assetId,
            workspaceId,
            actorUserId,
            assetType,
            input.fileName,
            input.mimeType,
            input.sizeInBytes,
            storagePath,
            input.checksumSha256,
            input.width ?? null,
            input.height ?? null,
            input.durationSeconds ?? null
          ]
        );

        const row = result.rows[0];
        if (!row) throw new AssetStoreError();

        const expiresInSeconds = 900;
        const upload = await this.storageAdapter.generateUploadUrl(
          storagePath,
          input.mimeType,
          expiresInSeconds
        );

        return Object.freeze({
          asset: mapAsset(row),
          uploadUrl: upload.uploadUrl,
          expiresInSeconds,
          headers: upload.headers
        });
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async completeUpload(
    actorUserIdInput: string,
    workspaceIdInput: string,
    assetIdInput: string,
    checksumSha256Input?: string
  ): Promise<Asset> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const existingResult = await query<AssetRow>(
          client,
          `
            SELECT ${assetColumns}
            FROM workspace_assets
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            FOR UPDATE
          `,
          [assetId, workspaceId]
        );

        const existing = existingResult.rows[0];
        if (!existing) throw new AssetNotFoundError();

        if (
          checksumSha256Input &&
          checksumSha256Input.toLowerCase() !== existing.checksum_sha256.toLowerCase()
        ) {
          throw new AssetValidationError("Uploaded file checksum mismatch.", "checksumSha256");
        }

        const updateResult = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'ready', updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${assetColumns}
          `,
          [assetId, workspaceId]
        );

        const updated = updateResult.rows[0];
        if (!updated) throw new AssetStoreError();
        return mapAsset(updated);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async getPresignedDownloadUrl(
    actorUserIdInput: string,
    workspaceIdInput: string,
    assetIdInput: string,
    expiresSeconds = 3600
  ): Promise<string> {
    const asset = await this.getById(actorUserIdInput, workspaceIdInput, assetIdInput);
    return this.storageAdapter.generateDownloadUrl(asset.storagePath, expiresSeconds);
  }

  async deleteAsset(
    actorUserIdInput: string,
    workspaceIdInput: string,
    assetIdInput: string
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'deleted', deleted_at = now(), updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING storage_path
          `,
          [assetId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) return false;
        await this.storageAdapter.deleteObject(row.storage_path);
        return true;
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }
}

const assetColumns = [
  "id",
  "workspace_id",
  "uploader_user_id",
  "type",
  "status",
  "file_name",
  "mime_type",
  "size_in_bytes",
  "storage_path",
  "checksum_sha256",
  "width",
  "height",
  "duration_seconds",
  "created_at",
  "updated_at"
].join(", ");

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

function mapAsset(row: AssetRow): Asset {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    uploaderUserId: row.uploader_user_id,
    type: row.type,
    status: row.status,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeInBytes: Number(row.size_in_bytes),
    storagePath: row.storage_path,
    checksumSha256: row.checksum_sha256,
    width: row.width ?? null,
    height: row.height ?? null,
    durationSeconds: row.duration_seconds !== null ? Number(row.duration_seconds) : null,
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at)
  });
}

function requireIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new AssetStoreError();
  return date.toISOString();
}

function normalizeAssetError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof AssetNotFoundError ||
    error instanceof AssetStoreError ||
    error instanceof AssetValidationError
  ) {
    return error;
  }
  return new AssetStoreError();
}
