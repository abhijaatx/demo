import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Edit HTML workbench exposes safe element edits, redaction, images, and scroll controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/edit-html/page.tsx"),
    readWebFile("components/html-edit-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /HtmlEditWorkbench/u);
  assert.match(surface, /sanitizeHtmlContent/u);
  assert.match(surface, /resolveTemplateTokens/u);
  assert.match(surface, /MAX_TEXT_LENGTH = 400/u);
  assert.match(surface, /MAX_IMAGE_BYTES = 12 \* 1024 \* 1024/u);
  assert.match(surface, /All matching elements/u);
  assert.match(surface, /Hide element/u);
  assert.match(surface, /Redact/u);
  assert.match(surface, /Disable viewer scrolling/u);
  assert.match(surface, /Save changes/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.html-edit-workbench-canvas/u);
  assert.match(css, /\.html-edit-workbench-safe-output/u);
});
