import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("use-cases route exposes bounded team tabs and feature carousel controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/use-cases/page.tsx"),
    readWebFile("components/marketing-use-cases.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingUseCases/u);
  assert.match(surface, /Tailored use cases for your entire team/u);
  assert.match(surface, /MarketingHeader variant="sharing"/u);
  assert.match(surface, /role="tablist"/gu);
  assert.match(surface, /aria-selected=\{index === activeUseCase\}/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(surface, /setFeatureSlide\(\(current\) => Math\.max\(0, current - 1\)\)/u);
  assert.match(surface, /aria-label="Previous"/u);
  assert.match(surface, /aria-label="Next"/u);
  assert.match(surface, /aria-pressed=\{showFeatured\}/u);
  assert.match(surface, /aria-live="polite"/gu);
  assert.match(css, /\.use-cases-featured-card/u);
  assert.match(css, /\.use-cases-card-grid/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
