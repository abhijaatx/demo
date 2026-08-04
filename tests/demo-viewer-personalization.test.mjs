import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("viewer resolves allowlisted v_ variables through React text nodes", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /extractPersonalizedVariablesFromUrl/u);
  assert.match(source, /resolveTemplateTokens/u);
  assert.match(source, /settings\.personalization/u);
  assert.match(source, /renderText\(hotspot\.tooltipText/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/u);
});
