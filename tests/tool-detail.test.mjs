import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("interactive tool detail routes expose the reference hero and bounded FAQ", async () => {
  const [route, surface, interactions, workbench, css] = await Promise.all([
    readWebFile("app/tools/[slug]/page.tsx"),
    readWebFile("components/marketing-tool-detail.tsx"),
    readWebFile("components/tool-detail-interactions.tsx"),
    readWebFile("components/tool-detail-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);
  assert.match(route, /MarketingToolDetail/u);
  assert.match(surface, /Free AI Interactive Demo Builder/u);
  assert.match(surface, /tools\/demo-editor\.avif/u);
  assert.match(surface, /Frequently asked questions/u);
  assert.match(surface, /ToolDetailInteractions/u);
  assert.match(interactions, /aria-haspopup="listbox"/u);
  assert.match(interactions, /role="tablist"/u);
  assert.match(interactions, /role="option"/u);
  assert.match(surface, /ScreenshotEditorWorkbench/u);
  assert.match(workbench, /accept="image\/png,image\/jpeg,image\/webp"/u);
  assert.match(workbench, /MAX_IMAGE_BYTES/u);
  assert.match(workbench, /aria-live="polite"/u);
  assert.match(css, /\.tool-detail-hero/u);
  assert.match(css, /tool-detail-page\.tool-detail-mobile-app-demos/u);
  assert.match(css, /height: 1183px/u);
  assert.match(css, /height: 1158px/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.doesNotMatch(interactions, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.doesNotMatch(workbench, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});

test("every captured free-tool route has a bounded detail entry", async () => {
  const surface = await readWebFile("components/marketing-tool-detail.tsx");
  for (const slug of [
    "interactive-demo-builder",
    "interactive-walkthrough-builder",
    "product-demo-video-maker",
    "screen-recorder",
    "sop-generator",
    "manual-maker",
    "free-screenshot-editor",
    "screenshot-link-generator",
    "annotation-generator",
    "mobile-app-demos"
  ]) {
    assert.match(surface, new RegExp("['\"]" + slug + "['\"]", "u"));
  }
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
