import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseUserProfileRepository } from "../packages/database/dist/index.js";
import {
  defaultUserPreferences,
  normalizeAvatarUrl,
  normalizeTimezone,
  parseUserProfilePatch,
  UserProfileStoreError,
  UserProfileValidationError
} from "../packages/domain/dist/index.js";

const profileRow = {
  user_id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
  email: "jordan@example.com",
  display_name: "Jordan Davis",
  avatar_url: null,
  timezone: "Asia/Kolkata",
  preferences: defaultUserPreferences,
  created_at: "2026-07-12T00:00:00.000Z",
  updated_at: "2026-07-12T00:00:00.000Z"
};

test("profile validation rejects unsafe URLs, timezones, and unknown preference fields", () => {
  assert.throws(() => normalizeAvatarUrl("javascript:alert(1)"), UserProfileValidationError);
  assert.throws(
    () => normalizeAvatarUrl("http://example.com/avatar.png"),
    UserProfileValidationError
  );
  assert.throws(() => normalizeTimezone("../../etc/passwd"), UserProfileValidationError);
  assert.throws(
    () => parseUserProfilePatch({ preferences: { ...defaultUserPreferences, admin: true } }),
    UserProfileValidationError
  );
  assert.deepEqual(parseUserProfilePatch({ displayName: "  Jordan  " }), {
    displayName: "Jordan"
  });
});

test("database profile repository synchronizes identity idempotently and uses parameterized tenant keys", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("INSERT INTO users")) return { rows: [{ id: profileRow.user_id }] };
      if (text.includes("INSERT INTO user_profiles")) return { rows: [] };
      if (text.includes("FROM users u")) return { rows: [profileRow] };
      throw new Error("Unexpected query");
    },
    release: () => undefined
  };
  const repository = new DatabaseUserProfileRepository({
    connect: async () => client,
    query: async () => ({ rows: [] })
  });
  const subject = "subject-with-'-and-tenant-boundary";
  const profile = await repository.syncIdentity({ subject, email: "Jordan@Example.com" });

  assert.equal(profile.email, "jordan@example.com");
  assert.equal(profile.displayName, "Jordan Davis");
  const userInsert = calls.find(({ text }) => text.includes("INSERT INTO users"));
  assert.ok(userInsert);
  assert.equal(userInsert.values[1], subject);
  assert.doesNotMatch(userInsert.text, /subject-with/u);
  assert.match(userInsert.text, /ON CONFLICT \(identity_subject\)/u);
  assert.ok(calls.some(({ text }) => /ON CONFLICT \(user_id\)/u.test(text)));
});

test("database profile repository returns a generic store error without exposing driver details", async () => {
  const repository = new DatabaseUserProfileRepository({
    connect: async () => {
      throw new Error("password=do-not-leak");
    },
    query: async () => ({ rows: [] })
  });
  await assert.rejects(
    repository.syncIdentity({ subject: "user-1", email: "a@example.com" }),
    (error) => {
      assert.equal(error instanceof UserProfileStoreError, true);
      assert.doesNotMatch(error.message, /do-not-leak/u);
      return true;
    }
  );
});

test("profile schema and migration keep identity subjects private and preferences bounded", async () => {
  const [migration, source] = await Promise.all([
    readFile(
      new URL("../packages/database/migrations/2026071200200_user_profiles.sql", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../packages/database/src/users.ts", import.meta.url), "utf8")
  ]);
  assert.match(migration, /user_profiles_preferences_object_check/u);
  assert.match(migration, /pg_column_size\(preferences\) <= 16384/u);
  assert.match(migration, /avatar_url ~ '\^https:\/\//u);
  assert.doesNotMatch(source, /\$\{subject\}|\$\{email\}/u);
  assert.doesNotMatch(source, /console\.(log|error)|password.*log|log.*password/iu);
});
