import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("folder sharing workbench exposes bounded public-link controls", async () => {
  const [component, route] = await Promise.all([
    readWebFile("components/folder-sharing-workbench.tsx"),
    readWebFile("app/folder-sharing/page.tsx")
  ]);

  assert.match(component, /Enable Public Access/u);
  assert.match(component, /Include nested folders/u);
  assert.match(component, /trackingLabel/u);
  assert.match(component, /maxLength=\{64\}/u);
  assert.match(component, /calculateShareLinkExpiry/u);
  assert.match(component, /buildShareLinkUrl/u);
  assert.match(component, /sanitizeShareLabel/u);
  assert.match(component, /randomUUID\?\.\(\)/u);
  assert.match(component, /getRandomValues/u);
  assert.match(component, /sl_/u);
  assert.match(component, /navigator\.clipboard/u);
  assert.match(component, /production link creation/u);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(route, /robots: \{ index: false, follow: false \}/u);
  assert.match(route, /FolderSharingWorkbench/u);
});
