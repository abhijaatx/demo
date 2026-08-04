import assert from "node:assert/strict";
import { test } from "node:test";
import { getPartitionNameForTimestamp, generatePartitionCreationSql } from "@supademo/domain";

test("getPartitionNameForTimestamp formats UTC partition table names", () => {
  const ts = Date.UTC(2026, 6, 28); // 2026-07-28
  assert.equal(getPartitionNameForTimestamp(ts), "analytics_events_2026_07");
});

test("generatePartitionCreationSql produces valid PostgreSQL DDL statements", () => {
  const ddl = generatePartitionCreationSql(2026, 7);

  assert.equal(ddl.includes("analytics_events_2026_07 PARTITION OF analytics_events"), true);
  assert.equal(ddl.includes("FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00')"), true);
});
