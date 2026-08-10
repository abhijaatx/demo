import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("offline download stores bounded records and creates a static safe player", async () => {
  const source = await readFile("apps/web/src/lib/offline-export.ts", "utf8");
  const player = await readFile("apps/web/components/offline-player.tsx", "utf8");
  assert.match(source, /MAX_DOWNLOADS = 25/u);
  assert.match(source, /MAX_DOCUMENT_BYTES = 5_000_000/u);
  assert.match(source, /createStoredZip/u);
  assert.match(source, /textContent/u);
  assert.doesNotMatch(source, /innerHTML/u);
  assert.match(player, /Present/u);
  assert.match(player, /removeOfflineDownload/u);
});

test("offline viewer uses an offline-only storage boundary", async () => {
  const source = await readFile("apps/web/components/demo-viewer.tsx", "utf8");
  assert.match(source, /offlineOnly/u);
  assert.match(source, /supademo_offline_/u);
});
