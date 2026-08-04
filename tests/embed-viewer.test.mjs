import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("embedded viewer route uses the published demo viewer without editor chrome", async () => {
  const route = await readFile(
    new URL("../apps/web/app/e/[demoId]/page.tsx", import.meta.url),
    "utf8"
  );
  const viewer = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(route, /embedded/u);
  assert.match(route, /DemoViewer/u);
  assert.match(viewer, /Supademo:load/u);
  assert.match(viewer, /Supademo:slideChange/u);
  assert.match(viewer, /Supademo:progress/u);
  assert.match(viewer, /Supademo:completed/u);
  assert.match(viewer, /document\.referrer/u);
  assert.match(viewer, /targetOrigin/u);
  assert.match(viewer, /window\.parent\.postMessage/u);
  assert.doesNotMatch(viewer, /postMessage\([^,]+,\s*["']\*["']/u);
});

test("share panel exposes iframe and popup embed actions", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Copy embed code/u);
  assert.match(source, /Copy popup trigger/u);
  assert.match(source, /Open popup preview/u);
  assert.match(source, /generatePopupEmbedSnippet/u);
});
