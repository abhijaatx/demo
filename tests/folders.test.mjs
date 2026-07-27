import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseFolderRepository } from "../packages/database/dist/index.js";
import {
  FolderConflictError,
  FolderValidationError,
  parseCreateFolderInput,
  parseMoveFolderInput,
  parseUpdateFolderInput
} from "../packages/domain/dist/index.js";

const actorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const folderId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005";
const parentId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0006";

function folderRow(overrides = {}) {
  return {
    id: folderId,
    workspace_id: workspaceId,
    parent_id: null,
    name: "Product tours",
    version: 1,
    created_at: "2026-07-12T00:00:00.000Z",
    updated_at: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

test("folder inputs are strict, bounded, and require an optimistic version for mutation", () => {
  assert.deepEqual(parseCreateFolderInput({ name: " Product tours ", parentId: null }), {
    name: "Product tours",
    parentId: null
  });
  assert.deepEqual(parseUpdateFolderInput({ name: "Tours", expectedVersion: 2 }), {
    name: "Tours",
    expectedVersion: 2
  });
  assert.deepEqual(parseMoveFolderInput({ parentId, expectedVersion: 1 }), {
    parentId,
    expectedVersion: 1
  });
  assert.throws(
    () => parseCreateFolderInput({ name: "Folder", parentId: null, workspaceId }),
    FolderValidationError
  );
  assert.throws(
    () => parseMoveFolderInput({ parentId: folderId, expectedVersion: 0 }),
    FolderValidationError
  );
  assert.throws(
    () => parseUpdateFolderInput({ name: "bad\nname", expectedVersion: 1 }),
    FolderValidationError
  );
});

test("folder creation is workspace-scoped, idempotent, and uses a structure lock", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("pg_advisory_xact_lock")) return { rows: [] };
      if (text.includes("INSERT INTO folder_creation_requests"))
        return { rows: [{ folder_id: null }] };
      if (text.includes("INSERT INTO folders")) return { rows: [folderRow()] };
      if (
        text.includes("UPDATE folder_creation_requests") ||
        text.includes("INSERT INTO folder_audit_events")
      ) {
        return { rows: [] };
      }
      throw new Error("Unexpected folder creation query");
    },
    release: () => undefined
  };
  const repository = new DatabaseFolderRepository({ connect: async () => client });
  const created = await repository.create(
    actorId,
    workspaceId,
    { name: "Product tours", parentId: null },
    "folder-create-001"
  );
  assert.equal(created.workspaceId, workspaceId);
  assert.equal(created.version, 1);
  assert.ok(calls.some(({ text }) => text.includes("pg_advisory_xact_lock")));
  const insert = calls.find(({ text }) => text.includes("INSERT INTO folders"));
  assert.deepEqual(insert.values.slice(1, 5), [workspaceId, null, "Product tours", actorId]);
});

test("folder moves prevent hierarchy cycles and stale writes before any update", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (["BEGIN", "ROLLBACK"].includes(text)) return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("pg_advisory_xact_lock")) return { rows: [] };
      if (text.includes("SELECT id, workspace_id") && text.includes("FOR UPDATE"))
        return { rows: [folderRow()] };
      if (text.includes("WITH RECURSIVE subtree")) return { rows: [{ height: 1 }] };
      if (text.includes("WITH RECURSIVE ancestors")) {
        return { rows: [{ depth: 2, contains_moved_folder: true }] };
      }
      throw new Error("A rejected move must not update folders");
    },
    release: () => undefined
  };
  const repository = new DatabaseFolderRepository({ connect: async () => client });
  await assert.rejects(
    repository.move(actorId, workspaceId, folderId, { parentId, expectedVersion: 1 }),
    FolderConflictError
  );
  assert.equal(
    calls.some(({ text }) => text.includes("UPDATE folders")),
    false
  );
});

test("folder deletion atomically promotes child folders and preserves direct demos", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "admin" }] };
      if (text.includes("pg_advisory_xact_lock")) return { rows: [] };
      if (text.includes("SELECT id, workspace_id") && text.includes("FOR UPDATE")) {
        return { rows: [folderRow({ parent_id: parentId })] };
      }
      if (
        text.includes("UPDATE demos") ||
        text.includes("UPDATE folders") ||
        text.includes("INSERT INTO folder_audit_events")
      ) {
        return { rows: [] };
      }
      if (text.includes("DELETE FROM folders")) return { rows: [{ id: folderId }] };
      throw new Error("Unexpected folder deletion query");
    },
    release: () => undefined
  };
  const repository = new DatabaseFolderRepository({ connect: async () => client });
  assert.equal(await repository.delete(actorId, workspaceId, folderId, 1), true);
  const demos = calls.find(({ text }) => text.includes("UPDATE demos"));
  assert.deepEqual(demos.values, [workspaceId, folderId, parentId]);
  const children = calls.find(({ text }) => text.includes("UPDATE folders"));
  assert.deepEqual(children.values, [workspaceId, folderId, parentId]);
});

test("folder migration enforces workspace-bound parent and demo links, uniqueness, and depth-safe rules", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071200700_folders.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /FOREIGN KEY \(workspace_id, parent_id\)/u);
  assert.match(migration, /FOREIGN KEY \(workspace_id, folder_id\)/u);
  assert.match(migration, /folders_workspace_parent_name_idx/u);
  assert.match(migration, /folder_creation_requests/u);
  assert.match(migration, /Folder deletion is application-controlled/u);
});
