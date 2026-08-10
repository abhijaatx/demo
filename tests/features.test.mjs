import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("features route exposes keyboard-operable feature and audience tabs", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/features/page.tsx"),
    readWebFile("components/marketing-features.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingFeatures/u);
  assert.match(surface, /The #1 Demo Automation Platform/u);
  assert.match(surface, /role="tablist"/gu);
  assert.match(surface, /aria-selected=\{index === activeFeature\}/u);
  assert.match(surface, /setActiveAudience\(index\)/u);
  assert.match(surface, /aria-live="polite"/u);
  assert.match(surface, /https:\/\/app\.supademo\.com\/embed\/cmewzomb200ci0m0jgnfi4xgm/u);
  assert.match(surface, /sandbox="allow-scripts allow-same-origin"/u);
  assert.match(surface, /onError=\{\(\) => setEmbedFailed\(true\)\}/u);
  assert.match(surface, /features-hero-frame-placeholder/u);
  assert.match(surface, /Trusted by 200,000\+ top operators and 3,000\+ paying organizations/u);
  assert.match(surface, /aria-haspopup="listbox"/u);
  assert.match(surface, /aria-expanded=\{trustMenuOpen\}/u);
  assert.match(surface, /role="option"/u);
  assert.match(surface, /setTrustCategory\(category\)/u);
  assert.match(surface, /supademo-rating-03\.webp/u);
  assert.match(surface, /features-trust-logo-grid/u);
  assert.match(surface, /referrerPolicy="no-referrer"/gu);
  assert.match(css, /\.features-mode-panel/u);
  assert.match(css, /\.features-audience-card/u);
  assert.match(css, /\.features-trust-logo-panel/u);
  assert.match(css, /features-trust-grid-swap/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
