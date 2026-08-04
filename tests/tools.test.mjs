import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("tools route exposes bounded category filters and safe tool links", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/tools/page.tsx"),
    readWebFile("components/marketing-tools.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingTools/u);
  assert.match(surface, /Free Tools For Better Product Demos/u);
  assert.match(surface, /aria-expanded=\{categoryOpen\}/u);
  assert.match(surface, /checked=\{selectedCategories\.includes\(category\)\}/u);
  assert.match(surface, /setSelectedCategories/u);
  assert.match(surface, /Clear all filters/u);
  assert.match(surface, /Employee Onboarding Cost Calculator/u);
  assert.match(surface, /Free Training Simulation Software/u);
  assert.match(surface, /href=\{`\/tools\/\$\{slug\}`\}/u);
  assert.match(surface, /aria-live="polite"/gu);
  assert.match(css, /\.tools-library-layout/u);
  assert.match(css, /\.tools-card/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
