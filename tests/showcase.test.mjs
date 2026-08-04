import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("showcase route exposes bounded filters and section expansion", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/showcase/page.tsx"),
    readWebFile("components/marketing-showcase.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingShowcase/u);
  assert.match(surface, /Explore the interactive demo showcase/u);
  assert.match(surface, /aria-expanded=\{openGroups\[name\]\}/u);
  assert.match(surface, /setSelected/u);
  assert.match(surface, /function makeShowcaseCards/u);
  assert.match(surface, /showcase-card-logo/u);
  assert.match(surface, /showcase-card-hub/u);
  assert.match(surface, /Customer Success/u);
  assert.match(surface, /Demo Hub/u);
  assert.match(surface, /Show more/u);
  assert.match(surface, /href=\{section\.learn\}/u);
  assert.match(css, /\.showcase-page/u);
  assert.match(css, /\.showcase-card/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});

test("showcase footer uses fixed reviewed artwork and a local signup destination", async () => {
  const [chrome, surface] = await Promise.all([
    readWebFile("components/marketing-chrome.tsx"),
    readWebFile("components/marketing-showcase.tsx")
  ]);

  assert.match(surface, /<MarketingFooter variant="showcase" \/>/u);
  assert.match(chrome, /marketing-footer-showcase/u);
  assert.match(chrome, /Frame-1321314117\.svg/u);
  assert.match(chrome, /supademo-footer-image\.svg/u);
  assert.match(chrome, /href="\/signup"/u);
  assert.match(chrome, /referrerPolicy="no-referrer"/u);
  assert.doesNotMatch(chrome, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
