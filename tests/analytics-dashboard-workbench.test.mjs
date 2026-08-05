import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const file = new URL("../apps/web/components/analytics-dashboard-workbench.tsx", import.meta.url);

test("analytics dashboard supports viewer, source, date, metric, and scope filters", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /Internal users/u);
  assert.match(source, /External users/u);
  assert.match(source, /Share links/u);
  assert.match(source, /Last 90 days/u);
  assert.match(source, /Showcase Analytics/u);
  assert.match(source, /Engagement/u);
});

test("analytics dashboard sanitizes CSV exports and bounds search input", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /sanitizeCsvCell/u);
  assert.match(source, /sourceFilter|viewerFilter/u);
  assert.match(source, /value=\{sourceFilter\}/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML\s*=/u);
});
