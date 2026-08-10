import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsDatabaseCacheConfig } from "@supademo/domain";

test("createAwsDatabaseCacheConfig sets up Multi-AZ encrypted PostgreSQL and private Redis", () => {
  const cfg = createAwsDatabaseCacheConfig();

  assert.equal(cfg.isMultiAz, true);
  assert.equal(cfg.isEncryptedAtRest, true);
  assert.equal(cfg.postgresEndpoint.includes(".internal."), true);
  assert.equal(cfg.redisEndpoint.includes(".internal."), true);
});
