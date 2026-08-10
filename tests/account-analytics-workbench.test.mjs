import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const file = new URL("../apps/web/components/account-analytics-workbench.tsx", import.meta.url);

test("account analytics supports recent viewers, recent accounts, and cross-demo journeys", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /Recent viewers/u);
  assert.match(source, /Recent accounts/u);
  assert.match(source, /Go to account/u);
  assert.match(source, /demos viewed/u);
  assert.match(source, /People from this account/u);
});

test("account analytics bounds search and keeps the local-data boundary explicit", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /maxLength=\{120\}/u);
  assert.match(source, /Production account analytics\s+must enforce tenant-scoped access/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML\s*=/u);
});
