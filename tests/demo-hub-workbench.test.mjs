import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Demo Hub workbench covers authoring, appearance, and SDK installation", async () => {
  const [component, route, hubs, editor] = await Promise.all([
    readWebFile("components/demo-hub-workbench.tsx"),
    readWebFile("app/demo-hub/page.tsx"),
    readWebFile("components/workspace-reference-surface.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(component, /createDemoHubConfig/u);
  assert.match(component, /addCategoryToHub/u);
  assert.match(component, /publishDemoHub/u);
  assert.match(component, /Content/u);
  assert.match(component, /Appearance/u);
  assert.match(component, /Install/u);
  assert.match(component, /allowedDomains/u);
  assert.match(component, /defaultCategoryIndex/u);
  assert.match(component, /createHubSdkOptions/u);
  assert.match(component, /toggleHubWidget/u);
  assert.match(component, /validateSafeUrl/u);
  assert.match(component, /file\.size > 2_000_000/u);
  assert.match(component, /URL\.createObjectURL\(file\)/u);
  assert.match(component, /URL\.revokeObjectURL/u);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(route, /DemoHubWorkbench/u);
  assert.match(hubs, /href="\/demo-hub"/u);
  assert.match(editor, /href="\/demo-hub"/u);
});
