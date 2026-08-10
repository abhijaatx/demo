import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("industry pages use a bounded shared template with accessible interactive controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/industries/[slug]/page.tsx"),
    readWebFile("components/marketing-industry.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /notFound\(\)/u);
  assert.match(route, /industryMetadata/u);
  assert.match(surface, /export type IndustrySlug/u);
  assert.match(surface, /Trusted by 200,000\+ top operators/u);
  assert.match(surface, /role="listbox"/u);
  assert.match(surface, /aria-selected=\{trustMode === mode\}/u);
  assert.match(surface, /role="tablist"/u);
  assert.match(surface, /aria-selected=\{showcaseIndex === index\}/u);
  assert.match(surface, /aria-label="Previous feature"/u);
  assert.match(surface, /aria-label="Next feature"/u);
  assert.match(surface, /<details key=\{question\} open=\{index === 0\}/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.match(surface, /https:\/\/app\.supademo\.com\/embed\//u);
  assert.match(surface, /faq-section-illustration\.avif/u);
  assert.match(css, /\.industry-exact-page/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(
    surface,
    /dangerouslySetInnerHTML|innerHTML|outerHTML|document\.write|eval\(|new Function\(/u
  );
});
