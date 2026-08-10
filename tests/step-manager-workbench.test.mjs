import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("step manager exposes bounded add, replace, duplicate, delete, reorder, and bulk controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/step-manager/page.tsx"),
    readWebFile("components/step-manager-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /StepManagerWorkbench/u);
  assert.match(surface, /MAX_FILE_BYTES = 100 \* 1024 \* 1024/u);
  assert.match(surface, /MAX_STEPS = 100/u);
  assert.match(surface, /Replace selected media/u);
  assert.match(surface, /Duplicate/u);
  assert.match(surface, /Delete/u);
  assert.match(surface, /Move up/u);
  assert.match(surface, /Move down/u);
  assert.match(surface, /aria-multiselectable="true"/u);
  assert.match(surface, /deleteSteps/u);
  assert.match(surface, /duplicateStep/u);
  assert.match(surface, /reorderSteps/u);
  assert.match(surface, /URL\.createObjectURL/u);
  assert.match(surface, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.step-manager-layout/u);
  assert.match(css, /\.step-manager-card/u);
});
