import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { DatabaseDemoRevisionRepository } from "@supademo/database";
import { createDefaultDemoDocument, DemoRevisionConflictError } from "@supademo/domain";

test("DatabaseDemoRevisionRepository saves draft, creates snapshot, lists, restores, and compacts revisions", async () => {
  const actorUserId = "018f3a8b-1111-7000-8000-000000000001";
  const workspaceId = "018f3a8b-2222-7000-8000-000000000002";
  const demoId = "018f3a8b-3333-7000-8000-000000000003";

  let draftRow = null;
  const revisions = [];

  const client = {
    query: async (text, params) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT id FROM demos")) return { rows: [{ id: demoId }] };

      if (text.includes("FROM demo_drafts") && text.includes("SELECT")) {
        return { rows: draftRow ? [draftRow] : [] };
      }

      if (text.includes("INSERT INTO demo_drafts")) {
        const nextRev = params[3];
        draftRow = {
          demo_id: demoId,
          workspace_id: workspaceId,
          document: JSON.parse(params[2]),
          revision_number: nextRev,
          updated_by_user_id: actorUserId,
          updated_at: new Date().toISOString()
        };
        return { rows: [draftRow] };
      }

      if (text.includes("INSERT INTO demo_revisions")) {
        const rev = {
          id: params[0],
          demo_id: params[1],
          workspace_id: params[2],
          revision_number: params[3],
          snapshot_json: JSON.parse(params[4]),
          created_by_user_id: params[5],
          message: params[6],
          created_at: new Date().toISOString()
        };
        revisions.push(rev);
        return { rows: [rev] };
      }

      if (text.includes("SELECT id, demo_id, workspace_id, revision_number")) {
        return { rows: [...revisions].reverse() };
      }

      if (text.includes("SELECT snapshot_json")) {
        const rev = revisions.find((r) => Number(r.revision_number) === Number(params[2]));
        return { rows: rev ? [rev] : [] };
      }

      if (text.includes("DELETE FROM demo_revisions")) {
        return { rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseDemoRevisionRepository({ connect: async () => client });

  // 1. Initial draft save
  const doc = createDefaultDemoDocument(demoId);
  const draft1 = await repository.saveDraft(actorUserId, workspaceId, demoId, doc);
  assert.equal(draft1.revisionNumber, 1);
  assert.equal(draft1.document.demoId, demoId);

  // 2. Conflict test — wrong expected revision
  await assert.rejects(
    async () => repository.saveDraft(actorUserId, workspaceId, demoId, doc, 99),
    DemoRevisionConflictError
  );

  // 3. Create immutable snapshot
  const snapshot = await repository.createSnapshot(
    actorUserId,
    workspaceId,
    demoId,
    "Initial v1 snapshot"
  );
  assert.equal(snapshot.revisionNumber, 1);
  assert.equal(snapshot.message, "Initial v1 snapshot");

  // 4. List revisions
  const list = await repository.listRevisions(actorUserId, workspaceId, demoId);
  assert.equal(list.length, 1);
  assert.equal(list[0].message, "Initial v1 snapshot");

  // 5. Restore revision
  const restoredDraft = await repository.restoreRevision(actorUserId, workspaceId, demoId, 1);
  assert.equal(restoredDraft.revisionNumber, 2); // New draft revision, snapshot untouched!

  // 6. Compact revisions
  const deletedCount = await repository.compactRevisions(actorUserId, workspaceId, demoId, 10);
  assert.equal(deletedCount, 1);
});

test("demo revisions SQL migration 2026071203000_demo_revisions declares tables and unique constraint", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071203000_demo_revisions.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS demo_drafts/u);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS demo_revisions/u);
  assert.match(migration, /UNIQUE \(workspace_id, demo_id, revision_number\)/u);
});
