import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("compare route exposes bounded comparison tabs, show-more, carousel, and FAQ controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/compare/page.tsx"),
    readWebFile("components/marketing-compare.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingCompare/u);
  assert.match(surface, /Compare Supademo to every alternative/u);
  assert.match(surface, /aria-selected=\{category === item\}/u);
  assert.match(surface, /Show more comparisons/u);
  assert.match(surface, /setFeatureSlide/u);
  assert.match(surface, /trustCategory/u);
  assert.match(surface, /aria-haspopup="listbox"/u);
  assert.match(surface, /supademo-rating-03\.webp/u);
  assert.match(surface, /trustLogos/u);
  assert.match(surface, /compare-feature-track/u);
  assert.match(surface, /compare-card-side-primary/u);
  assert.match(surface, /Trusted by thousands of fast growing companies/u);
  assert.match(surface, /compare-case-studies/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.match(surface, /faq-section-illustration/u);
  assert.match(surface, /Supademo vs\. Demostack/u);
  assert.match(surface, /<details/u);
  assert.match(surface, /href=\{`\/compare\/\$\{slug\}`\}/u);
  assert.match(css, /\.compare-library/u);
  assert.match(css, /\.compare-feature-carousel/u);
  assert.match(css, /\.compare-trust-picker-options/u);
  assert.match(css, /\.compare-reason-format-grid/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
