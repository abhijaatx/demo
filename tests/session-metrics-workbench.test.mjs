import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Session metrics workbench exposes viewer-level filters, detail, and safe export", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/session-metrics/page.tsx"),
    readWebFile("components/session-metrics-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /SessionMetricsWorkbench/u);
  assert.match(surface, /Known viewers/u);
  assert.match(surface, /Unidentified viewers/u);
  assert.match(surface, /Session length/u);
  assert.match(surface, /Device \/ locale/u);
  assert.match(surface, /Export CSV/u);
  assert.match(surface, /sanitizeCsvCell/u);
  assert.match(surface, /Timeline/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/session-metrics"/u);
});
