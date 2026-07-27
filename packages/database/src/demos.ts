import {
  assertDemoStatusTransition,
  AuthorizationDeniedError,
  calculateTrashRetention,
  capabilitiesForRole,
  DemoConflictError,
  DemoNotFoundError,
  DemoStoreError,
  DemoValidationError,
  demoFingerprint,
  normalizeDemoId,
  normalizeDemoStatus,
  normalizeFolderId,
  normalizeIdempotencyKey,
  normalizeUserId,
  parseCreateDemoInput,
  parseCreateFromTemplateInput,
  parseDemoPatch,
  parseDuplicateDemoInput,
  TRASH_RETENTION_DAYS,
  type CreateDemoInput,
  type CreateFromTemplateInput,
  type Demo,
  type DemoAuditAction,
  type DemoPatch,
  type DemoRepository,
  type DemoSearchFilters,
  type DemoStatus,
  type DemoType,
  type DuplicateDemoInput,
  type TrashItem,
  type WorkspaceCapability,
  type WorkspaceRole
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type DemoRow = Readonly<{
  id: string;
  workspace_id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  type: DemoType;
  status: DemoStatus;
  is_template?: boolean | null;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  folder_id: string | null;
}>;

export class DatabaseDemoRepository implements DemoRepository {
  constructor(private readonly pool: Pool) {}

  async list(
    actorUserIdInput: string,
    workspaceIdInput: string,
    filtersInput?: DemoSearchFilters
  ): Promise<readonly Demo[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const filters: DemoSearchFilters =
      filtersInput ??
      Object.freeze({
        query: null,
        ownerUserId: null,
        type: null,
        status: null,
        tagIds: Object.freeze([]),
        updatedAfter: null,
        updatedBefore: null
      });
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const values: unknown[] = [workspaceId];
        const clauses = ["workspace_id = $1", "deleted_at IS NULL"];
        if (filters.query) {
          values.push(filters.query);
          clauses.push(
            `to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('simple', $${values.length})`
          );
        }
        if (filters.ownerUserId) {
          values.push(filters.ownerUserId);
          clauses.push(`owner_user_id = $${values.length}`);
        }
        if (filters.type) {
          values.push(filters.type);
          clauses.push(`type = $${values.length}`);
        }
        if (filters.status) {
          values.push(filters.status);
          clauses.push(`status = $${values.length}`);
        }
        if (filters.tagIds.length > 0) {
          values.push(filters.tagIds);
          clauses.push(
            `EXISTS (
              SELECT 1 FROM demo_tags
              WHERE demo_tags.workspace_id = demos.workspace_id
                AND demo_tags.demo_id = demos.id
                AND demo_tags.tag_id = ANY($${values.length}::uuid[])
            )`
          );
        }
        if (filters.updatedAfter) {
          values.push(filters.updatedAfter);
          clauses.push(`updated_at >= $${values.length}::date`);
        }
        if (filters.updatedBefore) {
          values.push(filters.updatedBefore);
          clauses.push(`updated_at < ($${values.length}::date + interval '1 day')`);
        }
        const result = await query<DemoRow>(
          client,
          `
            SELECT ${demoColumns}
            FROM demos
            WHERE ${clauses.join(" AND ")}
            ORDER BY updated_at DESC, id DESC
          `,
          values
        );
        return Object.freeze(result.rows.map(mapDemo));
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async get(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const result = await query<DemoRow>(
          client,
          `
            SELECT ${demoColumns}
            FROM demos
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            LIMIT 1
          `,
          [demoId, workspaceId]
        );
        const row = result.rows[0];
        return row ? mapDemo(row) : null;
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async create(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputValue: CreateDemoInput,
    idempotencyKeyInput: string
  ): Promise<Demo> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const input = parseCreateDemoInput(inputValue);
    const idempotencyKey = normalizeIdempotencyKey(idempotencyKeyInput);
    const fingerprint = demoFingerprint(input);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:create");
        const request = await query<{ demo_id: string | null }>(
          client,
          `
            INSERT INTO demo_creation_requests
              (workspace_id, owner_user_id, idempotency_key, request_fingerprint)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (workspace_id, owner_user_id, idempotency_key) DO NOTHING
            RETURNING demo_id
          `,
          [workspaceId, actorUserId, idempotencyKey, fingerprint]
        );
        if (!request.rows[0]) {
          const existing = await query<{ request_fingerprint: string; demo_id: string | null }>(
            client,
            `
              SELECT request_fingerprint, demo_id
              FROM demo_creation_requests
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
              FOR UPDATE
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
          const replay = existing.rows[0];
          if (!replay || replay.request_fingerprint !== fingerprint || !replay.demo_id) {
            throw new DemoConflictError(
              "The demo creation request conflicts with an existing request."
            );
          }
          const existingDemo = await query<DemoRow>(
            client,
            `
              SELECT ${demoColumns}
              FROM demos
              WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
              LIMIT 1
            `,
            [replay.demo_id, workspaceId]
          );
          const existingRow = existingDemo.rows[0];
          if (!existingRow)
            throw new DemoConflictError("The demo creation request cannot be replayed.");
          return mapDemo(existingRow);
        }
        const result = await query<DemoRow>(
          client,
          `
            INSERT INTO demos (id, workspace_id, owner_user_id, title, description, type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${demoColumns}
          `,
          [createUuidV7(), workspaceId, actorUserId, input.title, input.description, input.type]
        );
        const row = result.rows[0];
        if (!row) throw new DemoStoreError();
        await query(
          client,
          `
            UPDATE demo_creation_requests
            SET demo_id = $4
            WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
          `,
          [workspaceId, actorUserId, idempotencyKey, row.id]
        );
        await insertDemoAuditEvent(
          client,
          workspaceId,
          row.id,
          actorUserId,
          "demo.created",
          null,
          null
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async update(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    patchValue: DemoPatch
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    const patch = parseDemoPatch(patchValue);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:update");
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET
              title = COALESCE($3, title),
              description = CASE WHEN $4 THEN $5 ELSE description END,
              type = COALESCE($6, type),
              updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [
            demoId,
            workspaceId,
            patch.title ?? null,
            Object.hasOwn(patch, "description"),
            patch.description ?? null,
            patch.type ?? null
          ]
        );
        const row = result.rows[0];
        if (!row) return null;
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.updated",
          null,
          null
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async transitionStatus(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    nextStatusInput: DemoStatus
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    const nextStatus = normalizeDemoStatus(nextStatusInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(
          client,
          workspaceId,
          actorUserId,
          nextStatus === "published" ? "demo:publish" : "demo:update"
        );
        const currentResult = await query<{ status: DemoStatus }>(
          client,
          `
            SELECT status
            FROM demos
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            FOR UPDATE
          `,
          [demoId, workspaceId]
        );
        const current = currentResult.rows[0];
        if (!current) return null;
        assertDemoStatusTransition(current.status, nextStatus);
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET
              status = $3,
              published_at = CASE WHEN $3 = 'published' THEN now() ELSE published_at END,
              updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId, nextStatus]
        );
        const row = result.rows[0];
        if (!row) throw new DemoStoreError();
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.status_changed",
          current.status,
          nextStatus
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async listTrash(
    actorUserIdInput: string,
    workspaceIdInput: string
  ): Promise<readonly TrashItem[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const result = await query<DemoRow>(
          client,
          `
            SELECT ${demoColumns}
            FROM demos
            WHERE workspace_id = $1 AND deleted_at IS NOT NULL
            ORDER BY deleted_at DESC, id DESC
          `,
          [workspaceId]
        );
        const now = new Date();
        return Object.freeze(
          result.rows.map((row) => {
            const demo = mapDemo(row);
            const deletedAt = demo.deletedAt ?? new Date().toISOString();
            const retention = calculateTrashRetention(deletedAt, now);
            return Object.freeze({
              demo,
              deletedAt,
              expiresAt: retention.expiresAt,
              daysRemaining: retention.daysRemaining
            });
          })
        );
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async softDelete(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:delete");
        const result = await query<{ status: DemoStatus }>(
          client,
          `
            UPDATE demos
            SET deleted_at = now(), updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING status
          `,
          [demoId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) {
          const checkTrashed = await query<{ id: string }>(
            client,
            `SELECT id FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NOT NULL`,
            [demoId, workspaceId]
          );
          return checkTrashed.rows.length > 0;
        }
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.deleted",
          row.status,
          null
        );
        return true;
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async restore(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:delete");
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET deleted_at = NULL, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NOT NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) {
          const activeDemo = await query<DemoRow>(
            client,
            `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
            [demoId, workspaceId]
          );
          return activeDemo.rows[0] ? mapDemo(activeDemo.rows[0]) : null;
        }
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.restored",
          null,
          row.status
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async archive(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:update");
        const currentResult = await query<{ status: DemoStatus }>(
          client,
          `
            SELECT status
            FROM demos
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            FOR UPDATE
          `,
          [demoId, workspaceId]
        );
        const current = currentResult.rows[0];
        if (!current) return null;
        if (current.status === "archived") {
          const existing = await query<DemoRow>(
            client,
            `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
            [demoId, workspaceId]
          );
          return existing.rows[0] ? mapDemo(existing.rows[0]) : null;
        }
        assertDemoStatusTransition(current.status, "archived");
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET status = 'archived', updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) throw new DemoStoreError();
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.archived",
          current.status,
          "archived"
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async unarchive(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:update");
        const currentResult = await query<{ status: DemoStatus }>(
          client,
          `
            SELECT status
            FROM demos
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            FOR UPDATE
          `,
          [demoId, workspaceId]
        );
        const current = currentResult.rows[0];
        if (!current) return null;
        if (current.status !== "archived") {
          const existing = await query<DemoRow>(
            client,
            `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
            [demoId, workspaceId]
          );
          return existing.rows[0] ? mapDemo(existing.rows[0]) : null;
        }
        assertDemoStatusTransition(current.status, "draft");
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET status = 'draft', updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId]
        );
        const row = result.rows[0];
        if (!row) throw new DemoStoreError();
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.unarchived",
          "archived",
          "draft"
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async permanentDelete(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:delete");
        const existing = await query<{ status: DemoStatus; deleted_at: Date | string | null }>(
          client,
          `
            SELECT status, deleted_at
            FROM demos
            WHERE id = $1 AND workspace_id = $2
            FOR UPDATE
          `,
          [demoId, workspaceId]
        );
        const row = existing.rows[0];
        if (!row) return true;
        if (row.deleted_at === null) {
          throw new DemoConflictError(
            "The demo must be in trash before it can be permanently deleted."
          );
        }
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.permanently_deleted",
          row.status,
          null
        );
        await query(client, `DELETE FROM demos WHERE id = $1 AND workspace_id = $2`, [
          demoId,
          workspaceId
        ]);
        return true;
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async purgeExpiredTrash(
    retentionDays = TRASH_RETENTION_DAYS
  ): Promise<readonly { workspaceId: string; demoId: string }[]> {
    try {
      return await withTransaction(this.pool, async (client) => {
        const expired = await query<{
          id: string;
          workspace_id: string;
          owner_user_id: string;
          status: DemoStatus;
        }>(
          client,
          `
            SELECT id, workspace_id, owner_user_id, status
            FROM demos
            WHERE deleted_at IS NOT NULL
              AND deleted_at < (now() - ($1 || ' days')::interval)
            FOR UPDATE
          `,
          [retentionDays]
        );
        const purged: { workspaceId: string; demoId: string }[] = [];
        for (const row of expired.rows) {
          await insertDemoAuditEvent(
            client,
            row.workspace_id,
            row.id,
            row.owner_user_id,
            "demo.permanently_deleted",
            row.status,
            null
          );
          await query(client, `DELETE FROM demos WHERE id = $1 AND workspace_id = $2`, [
            row.id,
            row.workspace_id
          ]);
          purged.push({ workspaceId: row.workspace_id, demoId: row.id });
        }
        return Object.freeze(purged);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async assignFolder(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    folderIdInput: string | null
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    const folderId = folderIdInput === null ? null : normalizeFolderId(folderIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:update");
        if (folderId) {
          const folder = await query<{ id: string }>(
            client,
            "SELECT id FROM folders WHERE id = $1 AND workspace_id = $2 LIMIT 1 FOR SHARE",
            [folderId, workspaceId]
          );
          if (!folder.rows[0])
            throw new DemoValidationError("The folder was not found.", "folderId");
        }
        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET folder_id = $3, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId, folderId]
        );
        const row = result.rows[0];
        if (!row) return null;
        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.updated",
          null,
          null
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async duplicate(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    inputInput?: DuplicateDemoInput,
    idempotencyKeyInput?: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    const input = parseDuplicateDemoInput(inputInput);
    const idempotencyKey = idempotencyKeyInput
      ? normalizeIdempotencyKey(idempotencyKeyInput)
      : null;
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:create");
        if (idempotencyKey) {
          const request = await query<{ demo_id: string | null }>(
            client,
            `
              SELECT demo_id
              FROM demo_creation_requests
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
              LIMIT 1
              FOR UPDATE
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
          const existingDemoId = request.rows[0]?.demo_id;
          if (existingDemoId) {
            const existing = await query<DemoRow>(
              client,
              `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2`,
              [existingDemoId, workspaceId]
            );
            return existing.rows[0] ? mapDemo(existing.rows[0]) : null;
          }
        }

        const sourceResult = await query<DemoRow>(
          client,
          `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2 FOR SHARE`,
          [demoId, workspaceId]
        );
        const sourceRow = sourceResult.rows[0];
        if (!sourceRow) throw new DemoNotFoundError("Demo not found.");
        if (sourceRow.deleted_at !== null) {
          throw new DemoConflictError("Trashed demos cannot be duplicated.");
        }

        let targetFolderId = sourceRow.folder_id;
        if (input.folderId !== undefined) {
          targetFolderId = input.folderId;
        }
        if (targetFolderId) {
          const folder = await query<{ id: string }>(
            client,
            "SELECT id FROM folders WHERE id = $1 AND workspace_id = $2 LIMIT 1 FOR SHARE",
            [targetFolderId, workspaceId]
          );
          if (!folder.rows[0]) {
            throw new DemoValidationError("The folder was not found.", "folderId");
          }
        }

        const title = input.title ?? `${sourceRow.title} (Copy)`;
        const newDemoId = createUuidV7();

        if (idempotencyKey) {
          await query(
            client,
            `
              INSERT INTO demo_creation_requests
                (workspace_id, owner_user_id, idempotency_key, demo_id)
              VALUES ($1, $2, $3, NULL)
              ON CONFLICT (workspace_id, owner_user_id, idempotency_key) DO NOTHING
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
        }

        const insertResult = await query<DemoRow>(
          client,
          `
            INSERT INTO demos (
              id, workspace_id, folder_id, owner_user_id, title, description, type, status, is_template, published_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, 'draft', false, NULL
            )
            RETURNING ${demoColumns}
          `,
          [
            newDemoId,
            workspaceId,
            targetFolderId,
            actorUserId,
            title,
            sourceRow.description,
            sourceRow.type
          ]
        );
        const newRow = insertResult.rows[0];
        if (!newRow) throw new DemoStoreError();

        if (idempotencyKey) {
          await query(
            client,
            `
              UPDATE demo_creation_requests
              SET demo_id = $4
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
            `,
            [workspaceId, actorUserId, idempotencyKey, newDemoId]
          );
        }

        await insertDemoAuditEvent(
          client,
          workspaceId,
          newDemoId,
          actorUserId,
          "demo.duplicated",
          null,
          "draft"
        );
        return mapDemo(newRow);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async setTemplate(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    isTemplate: boolean
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const demoId = normalizeDemoId(demoIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:update");
        const currentResult = await query<{ status: DemoStatus; is_template: boolean }>(
          client,
          "SELECT status, is_template FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE",
          [demoId, workspaceId]
        );
        const current = currentResult.rows[0];
        if (!current) throw new DemoNotFoundError("Demo not found.");

        const result = await query<DemoRow>(
          client,
          `
            UPDATE demos
            SET is_template = $3, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${demoColumns}
          `,
          [demoId, workspaceId, isTemplate]
        );
        const row = result.rows[0];
        if (!row) return null;

        await insertDemoAuditEvent(
          client,
          workspaceId,
          demoId,
          actorUserId,
          "demo.template_designated",
          null,
          row.status
        );
        return mapDemo(row);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async createFromTemplate(
    actorUserIdInput: string,
    workspaceIdInput: string,
    templateDemoIdInput: string,
    inputInput?: CreateFromTemplateInput,
    idempotencyKeyInput?: string
  ): Promise<Demo | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const templateDemoId = normalizeDemoId(templateDemoIdInput);
    const input = parseCreateFromTemplateInput(inputInput);
    const idempotencyKey = idempotencyKeyInput
      ? normalizeIdempotencyKey(idempotencyKeyInput)
      : null;
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:create");
        if (idempotencyKey) {
          const request = await query<{ demo_id: string | null }>(
            client,
            `
              SELECT demo_id
              FROM demo_creation_requests
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
              LIMIT 1
              FOR UPDATE
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
          const existingDemoId = request.rows[0]?.demo_id;
          if (existingDemoId) {
            const existing = await query<DemoRow>(
              client,
              `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2`,
              [existingDemoId, workspaceId]
            );
            return existing.rows[0] ? mapDemo(existing.rows[0]) : null;
          }
        }

        const templateResult = await query<DemoRow>(
          client,
          `SELECT ${demoColumns} FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL AND is_template = true FOR SHARE`,
          [templateDemoId, workspaceId]
        );
        const templateRow = templateResult.rows[0];
        if (!templateRow) {
          throw new DemoConflictError("The specified demo is not a valid template.");
        }

        let targetFolderId = templateRow.folder_id;
        if (input.folderId !== undefined) {
          targetFolderId = input.folderId;
        }
        if (targetFolderId) {
          const folder = await query<{ id: string }>(
            client,
            "SELECT id FROM folders WHERE id = $1 AND workspace_id = $2 LIMIT 1 FOR SHARE",
            [targetFolderId, workspaceId]
          );
          if (!folder.rows[0]) {
            throw new DemoValidationError("The folder was not found.", "folderId");
          }
        }

        const title = input.title ?? templateRow.title;
        const newDemoId = createUuidV7();

        if (idempotencyKey) {
          await query(
            client,
            `
              INSERT INTO demo_creation_requests
                (workspace_id, owner_user_id, idempotency_key, demo_id)
              VALUES ($1, $2, $3, NULL)
              ON CONFLICT (workspace_id, owner_user_id, idempotency_key) DO NOTHING
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
        }

        const insertResult = await query<DemoRow>(
          client,
          `
            INSERT INTO demos (
              id, workspace_id, folder_id, owner_user_id, title, description, type, status, is_template, published_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, 'draft', false, NULL
            )
            RETURNING ${demoColumns}
          `,
          [
            newDemoId,
            workspaceId,
            targetFolderId,
            actorUserId,
            title,
            templateRow.description,
            templateRow.type
          ]
        );
        const newRow = insertResult.rows[0];
        if (!newRow) throw new DemoStoreError();

        if (idempotencyKey) {
          await query(
            client,
            `
              UPDATE demo_creation_requests
              SET demo_id = $4
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
            `,
            [workspaceId, actorUserId, idempotencyKey, newDemoId]
          );
        }

        await insertDemoAuditEvent(
          client,
          workspaceId,
          newDemoId,
          actorUserId,
          "demo.template_created",
          null,
          "draft"
        );
        return mapDemo(newRow);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }
}

const demoColumns = [
  "id",
  "workspace_id",
  "folder_id",
  "owner_user_id",
  "title",
  "description",
  "type",
  "status",
  "is_template",
  "published_at",
  "created_at",
  "updated_at",
  "deleted_at"
].join(", ");

async function requireWorkspaceCapability(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string,
  capability: WorkspaceCapability
): Promise<void> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
    [workspaceId, userId]
  );
  const role = result.rows[0]?.role;
  if (!role || !capabilitiesForRole(role).includes(capability))
    throw new AuthorizationDeniedError();
}

async function insertDemoAuditEvent(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  demoId: string,
  actorUserId: string,
  action: DemoAuditAction,
  previousStatus: DemoStatus | null,
  status: DemoStatus | null
): Promise<void> {
  await query(
    executor,
    `
      INSERT INTO demo_audit_events
        (id, workspace_id, demo_id, actor_user_id, action, previous_status, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [createUuidV7(), workspaceId, demoId, actorUserId, action, previousStatus, status]
  );
}

function mapDemo(row: DemoRow): Demo {
  if (
    typeof row.id !== "string" ||
    typeof row.workspace_id !== "string" ||
    (row.folder_id !== null && typeof row.folder_id !== "string") ||
    typeof row.owner_user_id !== "string" ||
    typeof row.title !== "string" ||
    (row.description !== null && typeof row.description !== "string") ||
    !["guided_html", "screenshot", "video", "sandbox"].includes(row.type) ||
    !["draft", "processing", "published", "failed", "needs_update", "archived"].includes(row.status)
  ) {
    throw new DemoStoreError();
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    folderId: row.folder_id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    isTemplate: Boolean(row.is_template),
    publishedAt: toIso(row.published_at),
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at),
    deletedAt: toIso(row.deleted_at)
  });
}

function requireIso(value: Date | string): string {
  const result = toIso(value);
  if (!result) throw new DemoStoreError();
  return result;
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeWorkspaceId(value: unknown): string {
  try {
    return normalizeUserId(value);
  } catch {
    throw new DemoValidationError("The workspace identifier is invalid.", "workspaceId");
  }
}

function normalizeStoreError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof DemoConflictError ||
    error instanceof DemoStoreError ||
    error instanceof DemoValidationError
  ) {
    return error;
  }
  return new DemoStoreError();
}
