import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiKeyRecord, verifyApiKeyToken } from "@supademo/domain";

test("createApiKeyRecord hashes tokens and verifyApiKeyToken validates credentials", () => {
  const record = createApiKeyRecord("key-159", "ws-1", "sk_live_12345", ["read:demos"]);

  assert.equal(record.keyHash.length, 64);
  assert.equal(verifyApiKeyToken(record, "sk_live_12345"), true);
  assert.equal(verifyApiKeyToken(record, "wrong_token"), false);
});
