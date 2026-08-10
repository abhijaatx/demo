/**
 * Database implementation of DemoRevisionRepository — TASK-052
 */

import type {
  DemoDocument,
  DemoDraft,
  DemoRevision,
  DemoRevisionRepository
} from "@supademo/domain";
import {
  AuthorizationDeniedError,
  createDefaultDemoDocument,
  DemoNotFoundError,
  DemoRevisionConflictError,
  DemoRevisionNotFoundError,
  normalizeUserId,
  parseDemoDocument
} from "@supademo/domain";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type DraftRow = Readonly<{
  demo_id: string;
  workspace_id: string;
  document: unknown;
  revision_number: string | number;
  updated_by_user_id: string;
  updated_at: Date | string;
}>;

type RevisionRow = Readonly<{
  id: string;
  demo_id: string;
  workspace_id: string;
  revision_number: string | number;
  snapshot_json: unknown;
  created_by_user_id: string;
  message: string | null;
  created_at: Date | string;
}>;

export class DatabaseDemoRevisionRepository implements DemoRevisionRepository {
  constructor(private readonly pool: import("pg").Pool) {}

  async getDraft(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string
  ): Promise<DemoDraft | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      const result = await query<DraftRow>(
        client,
        `
          SELECT demo_id, workspace_id, document, revision_number, updated_by_user_id, updated_at
          FROM demo_drafts
          WHERE demo_id = $1 AND workspace_id = $2
        `,
        [demoId, workspaceId]
      );

      const row = result.rows[0];
      if (!row) return null;

      return Object.freeze({
        demoId: row.demo_id,
        workspaceId: row.workspace_id,
        document: parseDemoDocument(row.document),
        revisionNumber: Number(row.revision_number),
        updatedByUserId: row.updated_by_user_id,
        updatedAtIso: new Date(row.updated_at).toISOString()
      });
    });
  }

  async saveDraft(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    document: DemoDocument,
    expectedRevisionNumber?: number
  ): Promise<DemoDraft> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      // Verify demo exists and belongs to workspace
      const demoCheck = await query<{ id: string }>(
        client,
        `SELECT id FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
        [demoId, workspaceId]
      );
      if (!demoCheck.rows[0]) throw new DemoNotFoundError();

      const existing = await query<DraftRow>(
        client,
        `SELECT revision_number FROM demo_drafts WHERE demo_id = $1 AND workspace_id = $2 FOR UPDATE`,
        [demoId, workspaceId]
      );

      const currentRev = existing.rows[0] ? Number(existing.rows[0].revision_number) : 0;

      if (expectedRevisionNumber !== undefined && currentRev !== expectedRevisionNumber) {
        throw new DemoRevisionConflictError(
          `Revision conflict: current revision is ${currentRev}, expected ${expectedRevisionNumber}.`
        );
      }

      const nextRev = currentRev + 1;
      const jsonDoc = JSON.stringify(document);

      const result = await query<DraftRow>(
        client,
        `
          INSERT INTO demo_drafts (demo_id, workspace_id, document, revision_number, updated_by_user_id, updated_at)
          VALUES ($1, $2, $3::jsonb, $4, $5, now())
          ON CONFLICT (demo_id) DO UPDATE SET
            document = EXCLUDED.document,
            revision_number = EXCLUDED.revision_number,
            updated_by_user_id = EXCLUDED.updated_by_user_id,
            updated_at = now()
          RETURNING demo_id, workspace_id, document, revision_number, updated_by_user_id, updated_at
        `,
        [demoId, workspaceId, jsonDoc, nextRev, actorUserId]
      );

      const row = result.rows[0]!;
      return Object.freeze({
        demoId: row.demo_id,
        workspaceId: row.workspace_id,
        document: parseDemoDocument(row.document),
        revisionNumber: Number(row.revision_number),
        updatedByUserId: row.updated_by_user_id,
        updatedAtIso: new Date(row.updated_at).toISOString()
      });
    });
  }

  async createSnapshot(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    message?: string
  ): Promise<DemoRevision> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      // Load active draft
      const draftResult = await query<DraftRow>(
        client,
        `SELECT document, revision_number FROM demo_drafts WHERE demo_id = $1 AND workspace_id = $2`,
        [demoId, workspaceId]
      );

      const draftRow = draftResult.rows[0];
      const snapshotDoc = draftRow
        ? parseDemoDocument(draftRow.document)
        : createDefaultDemoDocument(demoId);
      const revNum = draftRow ? Number(draftRow.revision_number) : 1;

      const snapshotId = createUuidV7();
      const snapshotJson = JSON.stringify(snapshotDoc);

      const result = await query<RevisionRow>(
        client,
        `
          INSERT INTO demo_revisions (id, demo_id, workspace_id, revision_number, snapshot_json, created_by_user_id, message, created_at)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, now())
          RETURNING id, demo_id, workspace_id, revision_number, snapshot_json, created_by_user_id, message, created_at
        `,
        [snapshotId, demoId, workspaceId, revNum, snapshotJson, actorUserId, message ?? null]
      );

      const row = result.rows[0]!;
      return Object.freeze({
        id: row.id,
        demoId: row.demo_id,
        workspaceId: row.workspace_id,
        revisionNumber: Number(row.revision_number),
        snapshot: parseDemoDocument(row.snapshot_json),
        createdByUserId: row.created_by_user_id,
        message: row.message,
        createdAtIso: new Date(row.created_at).toISOString()
      });
    });
  }

  async listRevisions(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    limit = 20,
    offset = 0
  ): Promise<readonly DemoRevision[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      const result = await query<RevisionRow>(
        client,
        `
          SELECT id, demo_id, workspace_id, revision_number, snapshot_json, created_by_user_id, message, created_at
          FROM demo_revisions
          WHERE demo_id = $1 AND workspace_id = $2
          ORDER BY revision_number DESC
          LIMIT $3 OFFSET $4
        `,
        [demoId, workspaceId, Math.min(100, Math.max(1, limit)), Math.max(0, offset)]
      );

      return Object.freeze(
        result.rows.map((row) =>
          Object.freeze({
            id: row.id,
            demoId: row.demo_id,
            workspaceId: row.workspace_id,
            revisionNumber: Number(row.revision_number),
            snapshot: parseDemoDocument(row.snapshot_json),
            createdByUserId: row.created_by_user_id,
            message: row.message,
            createdAtIso: new Date(row.created_at).toISOString()
          })
        )
      );
    });
  }

  async restoreRevision(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    revisionNumber: number
  ): Promise<DemoDraft> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      const revResult = await query<RevisionRow>(
        client,
        `
          SELECT snapshot_json
          FROM demo_revisions
          WHERE demo_id = $1 AND workspace_id = $2 AND revision_number = $3
        `,
        [demoId, workspaceId, revisionNumber]
      );

      const revRow = revResult.rows[0];
      if (!revRow) throw new DemoRevisionNotFoundError();

      const snapshotDoc = parseDemoDocument(revRow.snapshot_json);

      // Save restored document as a NEW draft revision — historical snapshot is never mutated!
      const currentDraft = await query<DraftRow>(
        client,
        `SELECT revision_number FROM demo_drafts WHERE demo_id = $1 AND workspace_id = $2`,
        [demoId, workspaceId]
      );

      const nextRev = (currentDraft.rows[0] ? Number(currentDraft.rows[0].revision_number) : 0) + 1;
      const jsonDoc = JSON.stringify(snapshotDoc);

      const result = await query<DraftRow>(
        client,
        `
          INSERT INTO demo_drafts (demo_id, workspace_id, document, revision_number, updated_by_user_id, updated_at)
          VALUES ($1, $2, $3::jsonb, $4, $5, now())
          ON CONFLICT (demo_id) DO UPDATE SET
            document = EXCLUDED.document,
            revision_number = EXCLUDED.revision_number,
            updated_by_user_id = EXCLUDED.updated_by_user_id,
            updated_at = now()
          RETURNING demo_id, workspace_id, document, revision_number, updated_by_user_id, updated_at
        `,
        [demoId, workspaceId, jsonDoc, nextRev, actorUserId]
      );

      const row = result.rows[0]!;
      return Object.freeze({
        demoId: row.demo_id,
        workspaceId: row.workspace_id,
        document: parseDemoDocument(row.document),
        revisionNumber: Number(row.revision_number),
        updatedByUserId: row.updated_by_user_id,
        updatedAtIso: new Date(row.updated_at).toISOString()
      });
    });
  }

  async compactRevisions(
    actorUserIdInput: string,
    workspaceIdInput: string,
    demoIdInput: string,
    keepCount: number
  ): Promise<number> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const demoId = normalizeUserId(demoIdInput);

    return withTransaction(this.pool, async (client) => {
      await requireWorkspaceMembership(client, workspaceId, actorUserId);

      const safeKeep = Math.max(1, keepCount);

      const deleteResult = await query(
        client,
        `
          DELETE FROM demo_revisions
          WHERE demo_id = $1 AND workspace_id = $2 AND id NOT IN (
            SELECT id FROM demo_revisions
            WHERE demo_id = $1 AND workspace_id = $2
            ORDER BY revision_number DESC
            LIMIT $3
          )
        `,
        [demoId, workspaceId, safeKeep]
      );

      return deleteResult.rowCount ?? 0;
    });
  }
}

async function requireWorkspaceMembership(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<void> {
  const result = await query<{ role: string }>(
    executor,
    `
      SELECT role
      FROM memberships
      WHERE workspace_id = $1 AND user_id = $2
    `,
    [workspaceId, userId]
  );
  if (!result.rows[0]) throw new AuthorizationDeniedError();
}
