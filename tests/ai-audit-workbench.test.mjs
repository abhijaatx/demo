import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("AI audit workbench uses bounded, reviewable recommendations", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/ai-audit/page.tsx"),
    readWebFile("components/ai-audit-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /AiAuditWorkbench/u);
  assert.match(surface, /performAiDemoAudit/u);
  assert.match(surface, /MAX_CONTEXT_LENGTH = 800/u);
  assert.match(surface, /MAX_STEP_COUNT = 100/u);
  assert.match(surface, /Run audit locally/u);
  assert.match(surface, /Preview changes/u);
  assert.match(surface, /Apply to current demo/u);
  assert.match(surface, /Duplicate demo and apply/u);
  assert.match(surface, /No prompt or demo content is sent/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.ai-audit-results/u);
  assert.match(css, /\.ai-audit-score-grid/u);
});
