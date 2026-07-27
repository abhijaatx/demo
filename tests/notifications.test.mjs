import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseNotificationRepository } from "../packages/database/dist/index.js";
import {
  NotificationValidationError,
  parseCreateNotificationInput,
  parseMarkNotificationReadInput
} from "../packages/domain/dist/index.js";

const actorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const recipientId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
const targetId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";
const notificationId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005";

function notificationRow(overrides = {}) {
  return {
    id: notificationId,
    workspace_id: workspaceId,
    recipient_user_id: recipientId,
    actor_user_id: actorId,
    type: "comment_mention",
    title: "New Mention",
    message: "Jordan mentioned you in a comment",
    target_type: "demo",
    target_id: targetId,
    is_read: false,
    read_at: null,
    created_at: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

test("notification input parsing and validation", () => {
  assert.deepEqual(
    parseCreateNotificationInput({
      recipientUserId: recipientId,
      type: "comment_mention",
      title: "  New Mention ",
      message: " Mentioned in comment ",
      targetType: "demo",
      targetId: targetId
    }),
    {
      recipientUserId: recipientId,
      type: "comment_mention",
      title: "New Mention",
      message: "Mentioned in comment",
      targetType: "demo",
      targetId: targetId
    }
  );

  assert.deepEqual(parseMarkNotificationReadInput({ notificationId }), {
    notificationId
  });

  assert.deepEqual(parseMarkNotificationReadInput(null), { notificationId: null });

  assert.throws(
    () =>
      parseCreateNotificationInput({
        recipientUserId: recipientId,
        type: "invalid_type",
        title: "Test",
        message: "Test",
        targetType: "demo",
        targetId: targetId
      }),
    NotificationValidationError
  );
});

test("DatabaseNotificationRepository lists, counts, creates, and marks notifications read", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT COUNT(*)::text AS count")) return { rows: [{ count: "3" }] };
      if (text.includes("SELECT") && text.includes("FROM user_notifications")) {
        return { rows: [notificationRow()] };
      }
      if (text.includes("INSERT INTO user_notifications")) {
        return { rows: [notificationRow()] };
      }
      if (text.includes("is_read = true")) {
        return { rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${text}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseNotificationRepository({ connect: async () => client });

  const list = await repository.list(actorId, workspaceId, true);
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "New Mention");

  const unreadCount = await repository.unreadCount(actorId, workspaceId);
  assert.equal(unreadCount, 3);

  const created = await repository.create(actorId, workspaceId, {
    recipientUserId: recipientId,
    type: "comment_mention",
    title: "New Mention",
    message: "Jordan mentioned you in a comment",
    targetType: "demo",
    targetId: targetId
  });
  assert.equal(created.recipientUserId, recipientId);

  const markedSingle = await repository.markRead(actorId, workspaceId, notificationId);
  assert.equal(markedSingle, 1);

  const markedAll = await repository.markRead(actorId, workspaceId, null);
  assert.equal(markedAll, 1);
});

test("notification migration SQL schema declares indexes and tables", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071201200_notifications.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS user_notifications/u);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS user_notifications_unread_idx/u);
  assert.match(migration, /WHERE is_read = false/u);
});
