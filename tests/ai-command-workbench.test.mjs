import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("AI Command workbench keeps bulk edits reviewable, bounded, and local", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/ai-command/page.tsx"),
    readWebFile("components/ai-command-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /AiCommandWorkbench/u);
  assert.match(surface, /MAX_PROMPT_LENGTH = 1_200/u);
  assert.match(surface, /Approval required/u);
  assert.match(surface, /Approve changes/u);
  assert.match(surface, /No supported local edit/u);
  assert.match(surface, /Browser-local preview/u);
  assert.match(surface, /⌘ Enter/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.ai-command-workbench-proposal/u);
  assert.match(css, /\.ai-command-workbench-history-list/u);
});
