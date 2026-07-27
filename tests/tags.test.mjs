import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseTagRepository } from "../packages/database/dist/index.js";
import {
  AuthorizationDeniedError,
  parseCreateTagInput,
  parseDemoSearchFilters,
  TagConflictError,
  TagValidationError
} from "../packages/domain/dist/index.js";

const actorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const demoId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";
const tagId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005";

test("tag and demo-search inputs are allowlisted, bounded, and reject invalid dates", () => {
  assert.deepEqual(parseCreateTagInput({ name: "  Onboarding " }), { name: "Onboarding" });
  assert.throws(() => parseCreateTagInput({ name: "tag", ignored: true }), TagValidationError);
  assert.throws(() => parseCreateTagInput({ name: "tag\nscript" }), TagValidationError);
  assert.deepEqual(
    parseDemoSearchFilters({
      q: "Welcome demo",
      type: "guided_html",
      status: "draft",
      tag: tagId,
      updatedAfter: "2026-07-01",
      updatedBefore: "2026-07-31"
    }),
    {
      query: "Welcome demo",
      ownerUserId: null,
      type: "guided_html",
      status: "draft",
      tagIds: [tagId],
      updatedAfter: "2026-07-01",
      updatedBefore: "2026-07-31"
    }
  );
  assert.throws(() => parseDemoSearchFilters({ updatedAfter: "2026-02-30" }), TagValidationError);
  assert.throws(() => parseDemoSearchFilters({ tag: `${tagId},${tagId}` }), TagValidationError);
  assert.throws(() => parseDemoSearchFilters({ unexpected: "true" }), TagValidationError);
});

test("tag assignment checks workspace membership and both workspace-scoped records before write", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT demo.id")) return { rows: [] };
      throw new Error("Cross-workspace tag assignment must not reach the insert");
    },
    release: () => undefined
  };
  const repository = new DatabaseTagRepository({ connect: async () => client });
  await assert.rejects(
    repository.assignToDemo(actorId, workspaceId, demoId, tagId),
    TagValidationError
  );
  const lookup = calls.find(({ text }) => text.includes("SELECT demo.id"));
  assert.deepEqual(lookup.values, [demoId, workspaceId, tagId]);
  assert.equal(
    calls.some(({ text }) => text.includes("INSERT INTO demo_tags")),
    false
  );
});

test("tag writes require demo-update permission and duplicate names become conflicts", async () => {
  const deniedClient = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "viewer" }] };
      throw new Error("Viewer must not write a tag");
    },
    release: () => undefined
  };
  const deniedRepository = new DatabaseTagRepository({ connect: async () => deniedClient });
  await assert.rejects(
    deniedRepository.create(actorId, workspaceId, { name: "Onboarding" }, "tag-create-001"),
    AuthorizationDeniedError
  );

  const duplicateClient = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("INSERT INTO tag_creation_requests")) return { rows: [{ tag_id: null }] };
      if (text.includes("INSERT INTO tags")) throw { code: "23505" };
      throw new Error("Unexpected duplicate-tag query");
    },
    release: () => undefined
  };
  const duplicateRepository = new DatabaseTagRepository({ connect: async () => duplicateClient });
  await assert.rejects(
    duplicateRepository.create(actorId, workspaceId, { name: "Onboarding" }, "tag-create-001"),
    TagConflictError
  );
});

test("tag migration owns relationships, audit history, and indexed tenant-safe search", async () => {
  const migration = await readFile(
    new URL(
      "../packages/database/migrations/2026071200800_tags_and_demo_search.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(migration, /CREATE TABLE tags/u);
  assert.match(migration, /CREATE UNIQUE INDEX tags_workspace_lower_name_key/u);
  assert.match(migration, /FOREIGN KEY \(workspace_id, tag_id\) REFERENCES tags/u);
  assert.match(migration, /CREATE TABLE demo_tags/u);
  assert.match(migration, /FOREIGN KEY \(workspace_id, demo_id\) REFERENCES demos/u);
  assert.match(migration, /CREATE TABLE demo_tag_audit_events/u);
  assert.match(migration, /tag\.assigned', 'tag\.removed/u);
  assert.match(migration, /CREATE INDEX demos_workspace_filter_idx/u);
  assert.match(migration, /CREATE INDEX demos_workspace_search_idx/u);
});
