import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseCommentRepository } from "../packages/database/dist/index.js";
import {
  CommentValidationError,
  parseCreateCommentInput,
  parseToggleCommentReactionInput,
  parseToggleResolveCommentInput,
  parseUpdateCommentInput
} from "../packages/domain/dist/index.js";

const actorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const demoId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";
const commentId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005";

function commentRow(overrides = {}) {
  return {
    id: commentId,
    workspace_id: workspaceId,
    target_type: "demo",
    target_id: demoId,
    thread_id: commentId,
    parent_id: null,
    author_user_id: actorId,
    content: "Great product tour!",
    mentions: [],
    reactions: [],
    is_resolved: false,
    resolved_by_user_id: null,
    resolved_at: null,
    created_at: "2026-07-12T00:00:00.000Z",
    updated_at: "2026-07-12T00:00:00.000Z",
    deleted_at: null,
    ...overrides
  };
}

test("comment input parsing and sanitization", () => {
  assert.deepEqual(
    parseCreateCommentInput({
      targetType: "demo",
      targetId: demoId,
      content: "  Nice step!  "
    }),
    {
      targetType: "demo",
      targetId: demoId,
      content: "Nice step!",
      parentId: null,
      mentions: []
    }
  );

  assert.deepEqual(parseUpdateCommentInput({ content: "  Updated content  " }), {
    content: "Updated content"
  });

  assert.deepEqual(parseToggleResolveCommentInput({ isResolved: true }), { isResolved: true });

  assert.deepEqual(parseToggleCommentReactionInput({ emoji: "👍" }), { emoji: "👍" });

  assert.throws(
    () => parseCreateCommentInput({ targetType: "invalid", targetId: demoId, content: "Test" }),
    CommentValidationError
  );

  assert.throws(
    () => parseCreateCommentInput({ targetType: "demo", targetId: demoId, content: "" }),
    CommentValidationError
  );

  assert.throws(
    () =>
      parseCreateCommentInput({ targetType: "demo", targetId: demoId, content: "a".repeat(2001) }),
    CommentValidationError
  );
});

test("DatabaseCommentRepository lists, creates, updates, deletes, and toggles comments", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT id FROM demos")) return { rows: [{ id: demoId }] };
      if (text.includes("SELECT id, thread_id FROM demo_comments")) {
        return { rows: [{ id: commentId, thread_id: commentId }] };
      }
      if (text.includes("SELECT author_user_id, target_id FROM demo_comments")) {
        return { rows: [{ author_user_id: actorId, target_id: demoId }] };
      }
      if (text.includes("SELECT id, target_id FROM demo_comments")) {
        return { rows: [{ id: commentId, target_id: demoId }] };
      }
      if (text.includes("SELECT reactions, target_id FROM demo_comments")) {
        return { rows: [{ reactions: [], target_id: demoId }] };
      }
      if (text.includes("SELECT") && text.includes("FROM demo_comments")) {
        return { rows: [commentRow()] };
      }
      if (text.includes("INSERT INTO demo_comments")) {
        return { rows: [commentRow()] };
      }
      if (text.includes("content = $3")) {
        return { rows: [commentRow({ content: "Updated" })] };
      }
      if (text.includes("deleted_at = now()")) return { rows: [] };
      if (text.includes("is_resolved = $3")) {
        return { rows: [commentRow({ is_resolved: true, resolved_by_user_id: actorId })] };
      }
      if (text.includes("reactions = $3")) {
        return { rows: [commentRow({ reactions: [{ emoji: "👍", userIds: [actorId] }] })] };
      }
      if (text.includes("INSERT INTO demo_audit_events")) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseCommentRepository({ connect: async () => client });

  const list = await repository.list(actorId, workspaceId, "demo", demoId);
  assert.equal(list.length, 1);
  assert.equal(list[0].content, "Great product tour!");

  const created = await repository.create(actorId, workspaceId, {
    targetType: "demo",
    targetId: demoId,
    content: "Great product tour!"
  });
  assert.equal(created.targetId, demoId);

  const updated = await repository.update(actorId, workspaceId, commentId, { content: "Updated" });
  assert.equal(updated?.content, "Updated");

  const resolved = await repository.toggleResolve(actorId, workspaceId, commentId, true);
  assert.equal(resolved?.isResolved, true);

  const reacted = await repository.toggleReaction(actorId, workspaceId, commentId, "👍");
  assert.equal(reacted?.reactions.length, 1);

  const deleted = await repository.delete(actorId, workspaceId, commentId);
  assert.equal(deleted, true);
});

test("comment migration SQL schema declares indexes and audit events", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071201100_comments.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS demo_comments/u);
  assert.match(migration, /target_type text NOT NULL CHECK \(target_type IN \('demo', 'step'\)\)/u);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS demo_comments_workspace_target_idx/u);
  assert.match(migration, /'comment\.created'/u);
  assert.match(migration, /'comment\.resolved'/u);
});
