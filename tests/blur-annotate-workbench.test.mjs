import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("blur and annotate keeps screenshot redactions bounded and reviewable", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/blur-annotate/page.tsx"),
    readWebFile("components/blur-annotate-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /BlurAnnotateWorkbench/u);
  assert.match(surface, /MAX_FILE_BYTES = 12 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_REDACTIONS = 24/u);
  assert.match(surface, /MAX_ANNOTATIONS = 40/u);
  assert.match(surface, /generateRedactionBurnInManifest/u);
  assert.match(surface, /sanitizeAnnotationText/u);
  assert.match(surface, /Burn this redaction into the published asset/u);
  assert.match(surface, /Download blur &amp; annotation plan/u);
  assert.match(surface, /Video blur and video annotations are not supported/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.blur-annotate-workspace/u);
  assert.match(css, /\.blur-annotate-redaction/u);
});
