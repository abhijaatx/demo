import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("customers route exposes bounded filters and accessible story results", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/customers/page.tsx"),
    readWebFile("components/marketing-customers.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingCustomers/u);
  assert.match(surface, /Teams like yours are driving impact with Supademo/u);
  assert.match(surface, /useMemo/u);
  assert.match(surface, /setVisibleCount\(\(current\) => current \+ 7\)/u);
  assert.match(surface, /aria-live="polite"/u);
  assert.match(surface, /href=\{story\.href\}/u);
  assert.match(surface, /DBmaestro accelerates demo delivery and enablement by 80%/u);
  assert.match(surface, /case-study-header\.avif/u);
  assert.match(surface, /customers-industries/u);
  assert.match(surface, /customers-testimonials/u);
  assert.match(surface, /role="tab"/u);
  assert.match(surface, /aria-selected=\{category === industryCategory\}/u);
  assert.match(css, /\.customers-story-grid/u);
  assert.match(css, /@keyframes customers-story-refresh/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
