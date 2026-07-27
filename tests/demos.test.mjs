import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseDemoRepository } from "../packages/database/dist/index.js";
import {
  assertDemoStatusTransition,
  AuthorizationDeniedError,
  DemoConflictError,
  DemoValidationError,
  parseCreateDemoInput,
  parseDemoSearchFilters,
  parseDemoPatch
} from "../packages/domain/dist/index.js";

const actorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const otherWorkspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
const demoId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";

function demoRow(overrides = {}) {
  return {
    id: demoId,
    workspace_id: workspaceId,
    folder_id: null,
    owner_user_id: actorId,
    title: "Welcome demo",
    description: null,
    type: "guided_html",
    status: "draft",
    published_at: null,
    created_at: "2026-07-12T00:00:00.000Z",
    updated_at: "2026-07-12T00:00:00.000Z",
    deleted_at: null,
    ...overrides
  };
}

test("demo inputs are allowlisted, bounded, and lifecycle transitions are explicit", () => {
  assert.deepEqual(
    parseCreateDemoInput({ title: "  Welcome demo ", description: null, type: "guided_html" }),
    {
      title: "Welcome demo",
      description: null,
      type: "guided_html"
    }
  );
  assert.deepEqual(parseDemoPatch({ description: " Updated context " }), {
    description: "Updated context"
  });
  assert.throws(
    () =>
      parseCreateDemoInput({
        title: "demo",
        description: null,
        type: "guided_html",
        status: "published"
      }),
    DemoValidationError
  );
  assert.throws(() => parseDemoPatch({ title: "demo\nscript" }), DemoValidationError);
  assert.doesNotThrow(() => assertDemoStatusTransition("draft", "processing"));
  assert.doesNotThrow(() => assertDemoStatusTransition("published", "needs_update"));
  assert.throws(() => assertDemoStatusTransition("draft", "failed"), DemoConflictError);
  assert.throws(() => assertDemoStatusTransition("archived", "published"), DemoConflictError);
});

test("demo creation is workspace-scoped, idempotent, and audited", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("INSERT INTO demo_creation_requests")) return { rows: [{ demo_id: null }] };
      if (text.includes("INSERT INTO demos")) return { rows: [demoRow()] };
      if (
        text.includes("UPDATE demo_creation_requests") ||
        text.includes("INSERT INTO demo_audit_events")
      ) {
        return { rows: [] };
      }
      throw new Error("Unexpected demo creation query");
    },
    release: () => undefined
  };
  const repository = new DatabaseDemoRepository({ connect: async () => client });
  const created = await repository.create(
    actorId,
    workspaceId,
    { title: "Welcome demo", description: null, type: "guided_html" },
    "create-demo-001"
  );
  assert.equal(created.workspaceId, workspaceId);
  assert.equal(created.status, "draft");
  const request = calls.find(({ text }) => text.includes("INSERT INTO demo_creation_requests"));
  assert.deepEqual(request.values.slice(0, 3), [workspaceId, actorId, "create-demo-001"]);
  const insert = calls.find(({ text }) => text.includes("INSERT INTO demos"));
  assert.equal(insert.values[1], workspaceId);
  assert.equal(insert.values[2], actorId);
  const audit = calls.find(({ text }) => text.includes("INSERT INTO demo_audit_events"));
  assert.deepEqual(audit.values.slice(1, 5), [workspaceId, demoId, actorId, "demo.created"]);
});

test("demo reads and mutations bind both the demo id and workspace id", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "owner" }] };
      if (text.includes("FROM demos") && text.includes("deleted_at IS NULL")) return { rows: [] };
      throw new Error("Unexpected tenant-scoping query");
    },
    release: () => undefined
  };
  const repository = new DatabaseDemoRepository({ connect: async () => client });
  const result = await repository.get(actorId, otherWorkspaceId, demoId);
  assert.equal(result, null);
  const lookup = calls.find(({ text }) => text.includes("WHERE id = $1 AND workspace_id = $2"));
  assert.deepEqual(lookup.values, [demoId, otherWorkspaceId]);
});

test("demo search is parameterized and always retains the workspace boundary", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "viewer" }] };
      if (text.includes("FROM demos")) return { rows: [] };
      throw new Error("Unexpected search query");
    },
    release: () => undefined
  };
  const repository = new DatabaseDemoRepository({ connect: async () => client });
  await repository.list(
    actorId,
    workspaceId,
    parseDemoSearchFilters({ q: "welcome' OR true", tag: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005" })
  );
  const search = calls.find(({ text }) => text.includes("websearch_to_tsquery"));
  assert.match(search.text, /workspace_id = \$1 AND deleted_at IS NULL/u);
  assert.match(search.text, /tag_id = ANY\(\$3::uuid\[\]\)/u);
  assert.deepEqual(search.values, [
    workspaceId,
    "welcome' OR true",
    ["018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005"]
  ]);
});

test("publish permission, invalid state changes, deletion, and restoration remain server-enforced", async () => {
  const viewerClient = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "viewer" }] };
      throw new Error("Viewer must not reach the demo state query");
    },
    release: () => undefined
  };
  const viewerRepository = new DatabaseDemoRepository({ connect: async () => viewerClient });
  await assert.rejects(
    viewerRepository.transitionStatus(actorId, workspaceId, demoId, "published"),
    AuthorizationDeniedError
  );

  const invalidTransitionClient = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT status")) return { rows: [{ status: "draft" }] };
      throw new Error("Invalid transition must not update the row");
    },
    release: () => undefined
  };
  const invalidTransitionRepository = new DatabaseDemoRepository({
    connect: async () => invalidTransitionClient
  });
  await assert.rejects(
    invalidTransitionRepository.transitionStatus(actorId, workspaceId, demoId, "failed"),
    DemoConflictError
  );

  const calls = [];
  const lifecycleClient = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "owner" }] };
      if (text.includes("SET deleted_at = now()")) return { rows: [{ status: "published" }] };
      if (text.includes("SET deleted_at = NULL"))
        return { rows: [demoRow({ status: "published" })] };
      if (text.includes("INSERT INTO demo_audit_events")) return { rows: [] };
      throw new Error("Unexpected lifecycle query");
    },
    release: () => undefined
  };
  const repository = new DatabaseDemoRepository({ connect: async () => lifecycleClient });
  assert.equal(await repository.softDelete(actorId, workspaceId, demoId), true);
  const restored = await repository.restore(actorId, workspaceId, demoId);
  assert.equal(restored.status, "published");
  assert.equal(
    calls.filter(({ text }) => text.includes("INSERT INTO demo_audit_events")).length,
    2
  );
  assert.ok(
    calls.some(({ text }) => text.includes("id = $1 AND workspace_id = $2 AND deleted_at IS NULL"))
  );
  assert.ok(
    calls.some(({ text }) =>
      text.includes("id = $1 AND workspace_id = $2 AND deleted_at IS NOT NULL")
    )
  );
});

test("demo folder assignment verifies the target folder belongs to the active workspace", async () => {
  const folderId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005";
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT id FROM folders")) return { rows: [] };
      throw new Error("Cross-workspace folder must not reach the demo update");
    },
    release: () => undefined
  };
  const repository = new DatabaseDemoRepository({ connect: async () => client });
  await assert.rejects(
    repository.assignFolder(actorId, workspaceId, demoId, folderId),
    DemoValidationError
  );
  const folderLookup = calls.find(({ text }) => text.includes("SELECT id FROM folders"));
  assert.deepEqual(folderLookup.values, [folderId, workspaceId]);
  assert.equal(
    calls.some(({ text }) => text.includes("SET folder_id")),
    false
  );
});

test("demo lifecycle migration records tenant ownership, soft deletion, audit events, and idempotency", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071200600_demo_lifecycle.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /workspace_id uuid NOT NULL REFERENCES workspaces/u);
  assert.match(migration, /deleted_at timestamptz/u);
  assert.match(migration, /CREATE TABLE demo_audit_events/u);
  assert.match(migration, /CREATE TABLE demo_creation_requests/u);
  assert.match(migration, /PRIMARY KEY \(workspace_id, owner_user_id, idempotency_key\)/u);
  assert.match(
    migration,
    /action = 'demo.deleted' AND previous_status IS NOT NULL AND status IS NULL/u
  );
  assert.match(
    migration,
    /action = 'demo.restored' AND previous_status IS NULL AND status IS NOT NULL/u
  );
  assert.match(migration, /WHERE deleted_at IS NULL/u);
});
