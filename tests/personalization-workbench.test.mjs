import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("personalization workbench keeps dynamic variables allowlisted and text-safe", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/personalize/page.tsx"),
    readWebFile("components/personalization-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /PersonalizationWorkbench/u);
  assert.match(surface, /parseDemoPersonalization/u);
  assert.match(surface, /extractPersonalizedVariablesFromUrl/u);
  assert.match(surface, /generatePersonalizedEmbedUrl/u);
  assert.match(surface, /resolveTemplateTokens/u);
  assert.match(surface, /v_\*/u);
  assert.match(surface, /MAX_QUERY_LENGTH = 1_200/u);
  assert.match(surface, /Create personalized link/u);
  assert.doesNotMatch(
    surface,
    /dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.personalization-workbench-preview-card/u);
  assert.match(css, /\.personalization-workbench-variables/u);
});
