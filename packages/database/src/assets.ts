import {
  AssetConflictError,
  AssetNotFoundError,
  AssetQuotaExceededError,
  AssetRejectedError,
  AssetStoreError,
  AssetValidationError,
  AuthorizationDeniedError,
  inferAssetType,
  normalizeUserId,
  parseCreateAssetInput,
  type Asset,
  type AssetDerivative,
  type AssetDerivativeKind,
  type AssetListOptions,
  type AssetListResult,
  type AssetQuotaInfo,
  type AssetRejectionCode,
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

/** Default workspace storage limit: 10 GB */
const DEFAULT_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
/** Default workspace asset count limit */
const DEFAULT_ASSET_COUNT_LIMIT = 10_000;
/** Presigned download URL expiry */
const DOWNLOAD_URL_EXPIRY_SECONDS = 3600;
/** Presigned upload URL expiry */
const UPLOAD_URL_EXPIRY_SECONDS = 900;

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
  thumbnail_path: string | null;
  quarantine_reason: string | null;
  rejection_code: AssetRejectionCode | null;
  processing_job_id: string | null;
  reference_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}>;

type DerivativeRow = Readonly<{
  id: string;
  asset_id: string;
  workspace_id: string;
  kind: AssetDerivativeKind;
  mime_type: string;
  storage_path: string;
  size_in_bytes: string | number;
  width: number | null;
  height: number | null;
  duration_seconds: string | number | null;
  created_at: Date | string;
}>;

type QuotaRow = Readonly<{
  total_storage_used_bytes: string | number;
  asset_count: string | number;
  storage_limit_bytes: string | number;
  asset_count_limit: number;
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

        // Quota check before creating
        const quota = await getWorkspaceQuotaInternal(client, workspaceId);
        if (
          Number(quota.total_storage_used_bytes) + input.sizeInBytes >
          Number(quota.storage_limit_bytes)
        ) {
          throw new AssetQuotaExceededError();
        }
        if (Number(quota.asset_count) >= Number(quota.asset_count_limit)) {
          throw new AssetQuotaExceededError("Workspace asset count limit reached.");
        }

        const assetId = createUuidV7();
        const storagePath = `workspaces/${workspaceId}/assets/${assetId}/${input.fileName}`;

        const result = await query<AssetRow>(
          client,
          `
            INSERT INTO workspace_assets (
              id, workspace_id, uploader_user_id, type, status, file_name, mime_type,
              size_in_bytes, storage_path, checksum_sha256, width, height, duration_seconds
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

        const upload = await this.storageAdapter.generateUploadUrl(
          storagePath,
          input.mimeType,
          UPLOAD_URL_EXPIRY_SECONDS
        );

        return Object.freeze({
          asset: mapAsset(row),
          uploadUrl: upload.uploadUrl,
          expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS,
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

        if (existing.status !== "upload_pending") {
          throw new AssetConflictError("Asset upload is already completed or in another state.");
        }

        if (
          checksumSha256Input &&
          checksumSha256Input.toLowerCase() !== existing.checksum_sha256.toLowerCase()
        ) {
          throw new AssetValidationError("Uploaded file checksum mismatch.", "checksumSha256");
        }

        // Transition to validating — triggers downstream validation job
        const updateResult = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'validating', updated_at = now()
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
    expiresSeconds = DOWNLOAD_URL_EXPIRY_SECONDS
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

        // Block deletion if asset is still referenced
        const refCheck = await query<{ reference_count: number }>(
          client,
          `SELECT reference_count FROM workspace_assets WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
          [assetId, workspaceId]
        );
        const row = refCheck.rows[0];
        if (!row) return false;
        if (row.reference_count > 0) {
          throw new AssetConflictError(
            "Asset is referenced by one or more demos and cannot be deleted."
          );
        }

        const result = await query<{ storage_path: string }>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'deleted', deleted_at = now(), updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING storage_path
          `,
          [assetId, workspaceId]
        );
        const updated = result.rows[0];
        if (!updated) return false;
        // Defer object deletion to the cleanup job; update the status for now
        return true;
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  // ── TASK-044: Validation and quarantine ────────────────────────────────────

  async markValidating(workspaceIdInput: string, assetIdInput: string): Promise<Asset> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'validating', updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND status IN ('upload_pending', 'validating')
              AND deleted_at IS NULL
            RETURNING ${assetColumns}
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

  async quarantine(
    workspaceIdInput: string,
    assetIdInput: string,
    code: AssetRejectionCode,
    reason: string
  ): Promise<Asset> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);
    const sanitizedReason = String(reason).slice(0, 1000);

    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'quarantined',
                rejection_code = $3,
                quarantine_reason = $4,
                updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${assetColumns}
          `,
          [assetId, workspaceId, code, sanitizedReason]
        );
        const row = result.rows[0];
        if (!row) throw new AssetNotFoundError();
        return mapAsset(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async markFailed(workspaceIdInput: string, assetIdInput: string, reason: string): Promise<Asset> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'failed',
                quarantine_reason = $3,
                updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${assetColumns}
          `,
          [assetId, workspaceId, String(reason).slice(0, 1000)]
        );
        const row = result.rows[0];
        if (!row) throw new AssetNotFoundError();
        return mapAsset(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  // ── TASK-045/046: Processing ───────────────────────────────────────────────

  async markProcessing(
    workspaceIdInput: string,
    assetIdInput: string,
    jobId: string
  ): Promise<Asset> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'processing',
                processing_job_id = $3,
                updated_at = now()
            WHERE id = $1 AND workspace_id = $2
              AND status IN ('validating', 'processing')
              AND deleted_at IS NULL
            RETURNING ${assetColumns}
          `,
          [assetId, workspaceId, jobId]
        );
        const row = result.rows[0];
        if (!row) throw new AssetNotFoundError();
        return mapAsset(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async markReady(
    workspaceIdInput: string,
    assetIdInput: string,
    metadata: Partial<{
      thumbnailPath: string;
      width: number;
      height: number;
      durationSeconds: number;
    }>
  ): Promise<Asset> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<AssetRow>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'ready',
                thumbnail_path = COALESCE($3, thumbnail_path),
                width = COALESCE($4::integer, width),
                height = COALESCE($5::integer, height),
                duration_seconds = COALESCE($6::numeric, duration_seconds),
                processing_job_id = NULL,
                updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${assetColumns}
          `,
          [
            assetId,
            workspaceId,
            metadata.thumbnailPath ?? null,
            metadata.width ?? null,
            metadata.height ?? null,
            metadata.durationSeconds ?? null
          ]
        );
        const row = result.rows[0];
        if (!row) throw new AssetNotFoundError();
        return mapAsset(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async saveDerivative(
    derivative: Omit<AssetDerivative, "id" | "createdAt">
  ): Promise<AssetDerivative> {
    try {
      return await withTransaction(this.pool, async (client) => {
        const id = createUuidV7();
        const result = await query<DerivativeRow>(
          client,
          `
            INSERT INTO asset_derivatives (
              id, asset_id, workspace_id, kind, mime_type, storage_path,
              size_in_bytes, width, height, duration_seconds
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (storage_path) DO UPDATE
              SET size_in_bytes = EXCLUDED.size_in_bytes,
                  width = EXCLUDED.width,
                  height = EXCLUDED.height,
                  duration_seconds = EXCLUDED.duration_seconds
            RETURNING *
          `,
          [
            id,
            derivative.assetId,
            derivative.workspaceId,
            derivative.kind,
            derivative.mimeType,
            derivative.storagePath,
            derivative.sizeInBytes,
            derivative.width ?? null,
            derivative.height ?? null,
            derivative.durationSeconds ?? null
          ]
        );
        const row = result.rows[0];
        if (!row) throw new AssetStoreError();
        return mapDerivative(row);
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async listDerivatives(
    workspaceIdInput: string,
    assetIdInput: string
  ): Promise<readonly AssetDerivative[]> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      const result = await query<DerivativeRow>(
        this.pool,
        `
          SELECT * FROM asset_derivatives
          WHERE asset_id = $1 AND workspace_id = $2
          ORDER BY created_at
        `,
        [assetId, workspaceId]
      );
      return result.rows.map(mapDerivative);
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  // ── TASK-047: Asset library ─────────────────────────────────────────────────

  async list(
    actorUserIdInput: string,
    workspaceIdInput: string,
    options: AssetListOptions = {}
  ): Promise<AssetListResult> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const limit = Math.min(Math.max(1, options.limit ?? 50), 200);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const params: unknown[] = [workspaceId];
        const conditions: string[] = ["workspace_id = $1", "deleted_at IS NULL"];

        if (options.type) {
          params.push(options.type);
          conditions.push(`type = $${params.length}`);
        }
        if (options.status) {
          params.push(options.status);
          conditions.push(`status = $${params.length}`);
        } else {
          conditions.push(`status NOT IN ('deleted')`);
        }
        if (options.query) {
          params.push(`%${options.query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`);
          conditions.push(`file_name ILIKE $${params.length}`);
        }
        if (options.cursor) {
          params.push(options.cursor);
          conditions.push(`id < $${params.length}`);
        }

        const where = conditions.join(" AND ");

        const countResult = await query<{ total: string }>(
          client,
          `SELECT COUNT(*)::text AS total FROM workspace_assets WHERE ${where}`,
          params
        );
        const totalCount = parseInt(countResult.rows[0]?.total ?? "0", 10);

        params.push(limit + 1);
        const dataResult = await query<AssetRow>(
          client,
          `
            SELECT ${assetColumns}
            FROM workspace_assets
            WHERE ${where}
            ORDER BY created_at DESC, id DESC
            LIMIT $${params.length}
          `,
          params
        );

        const rows = dataResult.rows;
        const hasMore = rows.length > limit;
        const assets = rows.slice(0, limit).map(mapAsset);
        const nextCursor = hasMore ? (assets.at(-1)?.id ?? null) : null;

        return Object.freeze({ assets, nextCursor, totalCount });
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  // ── TASK-048: Quota and references ─────────────────────────────────────────

  async getQuota(workspaceIdInput: string): Promise<AssetQuotaInfo> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    try {
      const result = await query<QuotaRow>(
        this.pool,
        `
          SELECT
            COALESCE(u.total_storage_used_bytes, 0) AS total_storage_used_bytes,
            COALESCE(u.asset_count, 0) AS asset_count,
            COALESCE(q.storage_limit_bytes, $2) AS storage_limit_bytes,
            COALESCE(q.asset_count_limit, $3) AS asset_count_limit
          FROM (SELECT 1) AS dummy
          LEFT JOIN workspace_asset_usage u ON u.workspace_id = $1
          LEFT JOIN workspace_asset_quotas q ON q.workspace_id = $1
        `,
        [workspaceId, DEFAULT_STORAGE_LIMIT_BYTES, DEFAULT_ASSET_COUNT_LIMIT]
      );
      const row = result.rows[0];
      return Object.freeze({
        workspaceId,
        totalStorageUsedBytes: Number(row?.total_storage_used_bytes ?? 0),
        assetCount: Number(row?.asset_count ?? 0),
        storageLimitBytes: Number(row?.storage_limit_bytes ?? DEFAULT_STORAGE_LIMIT_BYTES),
        assetCountLimit: Number(row?.asset_count_limit ?? DEFAULT_ASSET_COUNT_LIMIT)
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async incrementReferenceCount(
    workspaceIdInput: string,
    assetIdInput: string,
    demoIdInput: string
  ): Promise<void> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);
    const demoId = normalizeUserId(demoIdInput);

    try {
      await withTransaction(this.pool, async (client) => {
        // Upsert reference record
        await query(
          client,
          `
            INSERT INTO asset_references (asset_id, workspace_id, demo_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (asset_id, demo_id) DO NOTHING
          `,
          [assetId, workspaceId, demoId]
        );
        // Increment counter
        await query(
          client,
          `
            UPDATE workspace_assets
            SET reference_count = reference_count + 1, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
          `,
          [assetId, workspaceId]
        );
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async decrementReferenceCount(
    workspaceIdInput: string,
    assetIdInput: string,
    demoIdInput: string
  ): Promise<void> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);
    const demoId = normalizeUserId(demoIdInput);

    try {
      await withTransaction(this.pool, async (client) => {
        const deleted = await query<{ id: string }>(
          client,
          `
            DELETE FROM asset_references
            WHERE asset_id = $1 AND demo_id = $2
            RETURNING asset_id AS id
          `,
          [assetId, demoId]
        );
        if (deleted.rows.length > 0) {
          // Decrement counter, floor at 0
          await query(
            client,
            `
              UPDATE workspace_assets
              SET reference_count = GREATEST(reference_count - 1, 0), updated_at = now()
              WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            `,
            [assetId, workspaceId]
          );
        }
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async softDelete(workspaceIdInput: string, assetIdInput: string): Promise<boolean> {
    const workspaceId = normalizeUserId(workspaceIdInput);
    const assetId = normalizeUserId(assetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        const refCheck = await query<{ reference_count: number }>(
          client,
          `SELECT reference_count FROM workspace_assets WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
          [assetId, workspaceId]
        );
        const row = refCheck.rows[0];
        if (!row) return false;
        if (row.reference_count > 0) {
          throw new AssetConflictError(
            "Asset is still referenced by one or more demos and cannot be deleted."
          );
        }
        const result = await query<{ id: string }>(
          client,
          `
            UPDATE workspace_assets
            SET status = 'deleted', deleted_at = now(), updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING id
          `,
          [assetId, workspaceId]
        );
        return result.rows.length > 0;
      });
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async cleanupExpiredSessions(olderThanSeconds: number): Promise<number> {
    try {
      const result = await query<{ id: string }>(
        this.pool,
        `
          UPDATE workspace_assets
          SET status = 'failed', updated_at = now()
          WHERE status = 'upload_pending'
            AND created_at < now() - ($1 || ' seconds')::interval
            AND deleted_at IS NULL
          RETURNING id
        `,
        [String(Math.floor(olderThanSeconds))]
      );
      return result.rows.length;
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }

  async cleanupDeletedAssets(olderThanDays: number): Promise<number> {
    try {
      // Fetch storage paths first, then delete objects, then hard-delete rows
      const toDelete = await query<{ id: string; storage_path: string }>(
        this.pool,
        `
          SELECT id, storage_path FROM workspace_assets
          WHERE status = 'deleted'
            AND deleted_at < now() - ($1 || ' days')::interval
        `,
        [String(Math.floor(olderThanDays))]
      );

      let cleaned = 0;
      for (const row of toDelete.rows) {
        try {
          await this.storageAdapter.deleteObject(row.storage_path);
        } catch {
          // Storage delete failure is non-fatal; the row will be retried next run
          continue;
        }
        await query(this.pool, `DELETE FROM workspace_assets WHERE id = $1`, [row.id]);
        cleaned++;
      }
      return cleaned;
    } catch (error) {
      throw normalizeAssetError(error);
    }
  }
}

// ── Columns ────────────────────────────────────────────────────────────────────

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
  "thumbnail_path",
  "quarantine_reason",
  "rejection_code",
  "processing_job_id",
  "reference_count",
  "created_at",
  "updated_at"
].join(", ");

// ── Helpers ─────────────────────────────────────────────────────────────────

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

async function getWorkspaceQuotaInternal(
  executor: Parameters<typeof query>[0],
  workspaceId: string
): Promise<QuotaRow> {
  const result = await query<QuotaRow>(
    executor,
    `
      SELECT
        COALESCE(u.total_storage_used_bytes, 0) AS total_storage_used_bytes,
        COALESCE(u.asset_count, 0) AS asset_count,
        COALESCE(q.storage_limit_bytes, $2) AS storage_limit_bytes,
        COALESCE(q.asset_count_limit, $3) AS asset_count_limit
      FROM (SELECT 1) AS dummy
      LEFT JOIN workspace_asset_usage u ON u.workspace_id = $1
      LEFT JOIN workspace_asset_quotas q ON q.workspace_id = $1
    `,
    [workspaceId, DEFAULT_STORAGE_LIMIT_BYTES, DEFAULT_ASSET_COUNT_LIMIT]
  );
  return (
    result.rows[0] ?? {
      total_storage_used_bytes: 0,
      asset_count: 0,
      storage_limit_bytes: DEFAULT_STORAGE_LIMIT_BYTES,
      asset_count_limit: DEFAULT_ASSET_COUNT_LIMIT
    }
  );
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
    thumbnailPath: row.thumbnail_path ?? null,
    quarantineReason: row.quarantine_reason ?? null,
    rejectionCode: row.rejection_code ?? null,
    processingJobId: row.processing_job_id ?? null,
    referenceCount: Number(row.reference_count ?? 0),
    storageUsedBytes: Number(row.size_in_bytes),
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at)
  });
}

function mapDerivative(row: DerivativeRow): AssetDerivative {
  return Object.freeze({
    id: row.id,
    assetId: row.asset_id,
    workspaceId: row.workspace_id,
    kind: row.kind,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    sizeInBytes: Number(row.size_in_bytes),
    width: row.width ?? null,
    height: row.height ?? null,
    durationSeconds: row.duration_seconds !== null ? Number(row.duration_seconds) : null,
    createdAt: requireIso(row.created_at)
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
    error instanceof AssetConflictError ||
    error instanceof AssetStoreError ||
    error instanceof AssetValidationError ||
    error instanceof AssetQuotaExceededError ||
    error instanceof AssetRejectedError
  ) {
    return error;
  }
  return new AssetStoreError();
}
