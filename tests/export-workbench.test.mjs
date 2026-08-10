import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const file = new URL("../apps/web/components/export-workbench.tsx", import.meta.url);

test("export workbench exposes the documented copy, image, video, and SCORM paths", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /Copy steps/u);
  assert.match(source, /Download PNG/u);
  assert.match(source, /VideoExportFormat|videoFormat\.toUpperCase\(\)/u);
  assert.match(source, /Generate SCORM package/u);
  assert.match(source, /buildScormFiles/u);
  assert.match(source, /createDemoPng/u);
  assert.match(source, /createDemoVideo/u);
});

test("export workbench bounds user-controlled export labels and does not execute preview HTML", async () => {
  const source = await readFile(file, "utf8");
  assert.match(source, /maxLength=\{20_000\}/u);
  assert.match(source, /safeDownloadName/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML\s*=/u);
});
