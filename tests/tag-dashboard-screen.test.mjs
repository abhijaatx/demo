import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("tag and search dashboard controls use debounced URL state and typed clients", async () => {
  const [screen, demoClient, tagClient, css] = await Promise.all([
    readFile(new URL("../apps/web/components/demo-dashboard-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/src/lib/demo-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/src/lib/tag-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);
  assert.match(screen, /window\.setTimeout/u);
  assert.match(screen, /Filters\{/u);
  assert.match(screen, /Filters are saved in this page’s link/u);
  assert.match(screen, /type="checkbox"/u);
  assert.match(screen, /Add a tag/u);
  assert.match(demoClient, /URLSearchParams/u);
  assert.match(demoClient, /encodeURIComponent\(workspaceId\)/u);
  assert.match(tagClient, /credentials: "include"/u);
  assert.match(tagClient, /X-CSRF-Token/u);
  assert.match(tagClient, /encodeURIComponent\(tagId\)/u);
  assert.doesNotMatch(tagClient, /innerHTML|outerHTML|document\.write|eval\(/u);
  assert.match(css, /\.demo-filter-form/u);
  assert.match(css, /\.demo-tag-options/u);
});
