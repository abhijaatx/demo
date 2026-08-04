import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseWorkspaceRepository } from "../packages/database/dist/index.js";
import {
  defaultUserPreferences,
  parseCreateWorkspaceInput,
  WorkspaceConflictError,
  WorkspaceValidationError
} from "../packages/domain/dist/index.js";

const userId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceRow = {
  organization_id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002",
  organization_name: "Acme Inc",
  workspace_id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003",
  workspace_name: "Product demos",
  slug: "product-demos",
  role: "owner",
  created_at: "2026-07-12T00:00:00.000Z"
};
const createInput = {
  organizationName: "Acme Inc",
  workspaceName: "Product demos",
  slug: "Product-Demos"
};

test("workspace input validation normalizes names/slugs and rejects unknown or unsafe values", () => {
  assert.deepEqual(parseCreateWorkspaceInput(createInput), {
    organizationName: "Acme Inc",
    workspaceName: "Product demos",
    slug: "product-demos"
  });
  assert.throws(
    () => parseCreateWorkspaceInput({ ...createInput, slug: "../../private" }),
    WorkspaceValidationError
  );
  assert.throws(
    () => parseCreateWorkspaceInput({ ...createInput, unexpected: "field" }),
    WorkspaceValidationError
  );
});

test("workspace creation is transactional, creates owner membership, and is replayable", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT id FROM users")) return { rows: [{ id: userId }] };
      if (text.includes("INSERT INTO workspace_creation_requests")) {
        return { rows: [{ owner_user_id: userId }] };
      }
      if (text.includes("INSERT INTO organizations")) return { rows: [] };
      if (text.includes("INSERT INTO workspaces")) return { rows: [] };
      if (text.includes("INSERT INTO memberships")) return { rows: [] };
      if (text.includes("UPDATE workspace_creation_requests")) return { rows: [] };
      if (text.includes("FROM memberships m")) return { rows: [workspaceRow] };
      throw new Error("Unexpected workspace query");
    },
    release: () => undefined
  };
  const repository = new DatabaseWorkspaceRepository({
    connect: async () => client,
    query: async () => ({ rows: [] })
  });
  const created = await repository.createForUser(userId, createInput, "request-001");

  assert.equal(created.role, "owner");
  assert.equal(created.slug, "product-demos");
  const membership = calls.find(({ text }) => text.includes("INSERT INTO memberships"));
  assert.ok(membership);
  assert.match(
    membership.values[0],
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
  );
  assert.equal(membership.values[1], userId);
  assert.match(membership.text, /'owner'/u);
  assert.deepEqual(calls.map(({ text }) => text).slice(0, 2), [
    "BEGIN",
    "SELECT id FROM users WHERE id = $1 FOR SHARE"
  ]);
  assert.ok(
    calls.some(({ text }) => text.includes("ON CONFLICT (owner_user_id, idempotency_key)"))
  );
  assert.doesNotMatch(
    calls.find(({ text }) => text.includes("INSERT INTO organizations")).text,
    /Acme Inc/u
  );
});

test("workspace creation rolls back partial failures and maps uniqueness conflicts generically", async () => {
  const events = [];
  const client = {
    query: async (text) => {
      events.push(text);
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT id FROM users")) return { rows: [{ id: userId }] };
      if (text.includes("INSERT INTO workspace_creation_requests"))
        return { rows: [{ owner_user_id: userId }] };
      if (text.includes("INSERT INTO organizations")) return { rows: [] };
      if (text.includes("INSERT INTO workspaces")) throw new Error("duplicate workspace slug");
      return { rows: [] };
    },
    release: () => undefined
  };
  const repository = new DatabaseWorkspaceRepository({
    connect: async () => client,
    query: async () => ({ rows: [] })
  });
  await assert.rejects(
    repository.createForUser(userId, createInput, "request-002"),
    WorkspaceConflictError
  );
  assert.ok(events.includes("ROLLBACK"));
  assert.equal(
    events.some((event) => event.includes("INSERT INTO memberships")),
    false
  );
});

test("workspace replay with a different payload is rejected and listing is user-scoped", async () => {
  const calls = [];
  const existingFingerprint = JSON.stringify({
    organizationName: "Acme Inc",
    workspaceName: "Other",
    slug: "other"
  });
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT id FROM users")) return { rows: [{ id: userId }] };
      if (text.includes("INSERT INTO workspace_creation_requests")) return { rows: [] };
      if (text.includes("SELECT request_fingerprint")) {
        return {
          rows: [
            { request_fingerprint: existingFingerprint, organization_id: null, workspace_id: null }
          ]
        };
      }
      return { rows: [] };
    },
    release: () => undefined
  };
  const repository = new DatabaseWorkspaceRepository({
    connect: async () => client,
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [workspaceRow] };
    }
  });
  await assert.rejects(
    repository.createForUser(userId, createInput, "request-003"),
    WorkspaceConflictError
  );
  const listing = await repository.listForUser(userId);
  assert.deepEqual(listing, [
    {
      organizationId: workspaceRow.organization_id,
      organizationName: workspaceRow.organization_name,
      workspaceId: workspaceRow.workspace_id,
      workspaceName: workspaceRow.workspace_name,
      slug: workspaceRow.slug,
      role: "owner",
      capabilities: [
        "workspace:read",
        "workspace:create",
        "workspace:update",
        "workspace:delete",
        "member:read",
        "member:invite",
        "member:update",
        "member:remove",
        "member:leave",
        "demo:read",
        "demo:create",
        "demo:update",
        "demo:delete",
        "demo:publish",
        "demo:share",
        "demo:export",
        "asset:read",
        "asset:create",
        "asset:delete",
        "analytics:read"
      ],
      createdAt: workspaceRow.created_at
    }
  ]);
  assert.equal(calls.at(-1).values[0], userId);
  assert.deepEqual(defaultUserPreferences, {
    theme: "system",
    locale: "en-US",
    reducedMotion: false,
    emailNotifications: true
  });
});

test("workspace migration declares organization ownership and idempotency persistence", async () => {
  const migration = await readFile(
    new URL(
      "../packages/database/migrations/2026071200300_workspace_ownership.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(migration, /owner_user_id uuid NOT NULL REFERENCES users/u);
  assert.match(migration, /CREATE TABLE workspace_creation_requests/u);
  assert.match(migration, /PRIMARY KEY \(owner_user_id, idempotency_key\)/u);
  assert.match(migration, /workspace_creation_requests_result_pair_check/u);
});
