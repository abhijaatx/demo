import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("DemoViewer exposes native chapter form submission and safe local persistence", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /validateFormSubmission/u);
  assert.match(source, /recordFormSubmission/u);
  assert.match(source, /demo-viewer-form/u);
  assert.match(source, /allowSkip/u);
  assert.match(source, /noValidate/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
