import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("enterprise route exposes bounded capability and pillar controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/enterprise/page.tsx"),
    readWebFile("components/marketing-enterprise.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingEnterprise/u);
  assert.match(surface, /Demos at enterprise scale/u);
  assert.match(surface, /aria-pressed=\{index === capability\}/u);
  assert.match(surface, /aria-selected=\{index === pillar\}/u);
  assert.match(surface, /moveCapability/u);
  assert.match(surface, /How does Supademo's AI work/u);
  assert.match(surface, /What does enterprise onboarding look like/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(surface, /href="\/product-demo"/u);
  assert.match(surface, /https:\/\/security\.supademo\.com/u);
  assert.match(surface, /enterpriseTrustLogos/u);
  assert.match(surface, /supademo-rating-03\.webp/u);
  assert.match(surface, /supademo-rating-02\.webp/u);
  assert.match(surface, /aria-haspopup="listbox"/u);
  assert.match(surface, /role="listbox"/u);
  assert.match(surface, /role="option"/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.doesNotMatch(surface, /href=\{[^}]*trustCategory|href=\{[^}]*previewSrc/u);
  assert.match(surface, /<details/u);
  assert.match(css, /\.enterprise-page/u);
  assert.match(css, /\.enterprise-dashboard-art/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
