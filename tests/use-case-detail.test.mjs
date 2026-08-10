import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("deep use-case pages use the bounded Supademo detail surface", async () => {
  const [route, surface, interactions, css] = await Promise.all([
    readWebFile("app/use-cases/[slug]/page.tsx"),
    readWebFile("components/marketing-use-case-detail.tsx"),
    readWebFile("components/use-case-detail-interactions.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingUseCaseDetail/u);
  assert.match(surface, /Double your revenue with interactive demos/u);
  assert.match(surface, /hero-sales-ui\.avif/u);
  assert.match(surface, /aria-labelledby="use-case-detail-faq-title"/u);
  assert.match(css, /\.use-case-detail-hero/u);
  assert.match(css, /\.use-case-detail-trust/u);
  assert.match(interactions, /aria-expanded=\{open\}/u);
  assert.match(interactions, /aria-selected=\{index === activeIndex\}/u);
  assert.match(surface, /sandbox="allow-scripts allow-same-origin allow-forms"/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.doesNotMatch(interactions, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
