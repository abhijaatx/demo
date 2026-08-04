import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Find & Replace workbench keeps text, anonymization, date, and image flows bounded", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/find-replace/page.tsx"),
    readWebFile("components/find-replace-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /FindReplaceWorkbench/u);
  assert.match(surface, /MAX_VALUE_LENGTH = 160/u);
  assert.match(surface, /Case-sensitive/u);
  assert.match(surface, /Exact match/u);
  assert.match(surface, /Anonymize emails/u);
  assert.match(surface, /example\.test/u);
  assert.match(surface, /rolling 60-day window/u);
  assert.match(surface, /Image find &amp; replace is coming soon/u);
  assert.match(surface, /renderHighlight/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/find-replace"/u);
});
