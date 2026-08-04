import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("tutorial directory exposes bounded search and tool filters", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/tutorials/page.tsx"),
    readWebFile("components/marketing-tutorials.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingTutorials/u);
  assert.match(surface, /Explore step-by-step, interactive/u);
  assert.match(surface, /slice\(0, 80\)/u);
  assert.match(surface, /aria-selected=\{tool === item\}/u);
  assert.match(surface, /aria-live="polite"/u);
  assert.match(surface, /aria-label="Tutorial pages"/u);
  assert.match(surface, /pageCount = 34/u);
  assert.match(surface, /Page \{page\} of \{pageCount\}/u);
  assert.match(surface, /href=\{`\/tutorials\/\$\{itemTool/u);
  assert.match(surface, /\$\{slug\}/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.tutorials-page/u);
  assert.match(css, /\.tutorial-card/u);
  assert.match(css, /\.tutorial-card-image-placeholder/u);
  assert.match(css, /\.tutorials-pagination/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
