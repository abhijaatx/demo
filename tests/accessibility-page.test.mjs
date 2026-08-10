import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("accessibility statement exposes bounded section navigation and contacts", async () => {
  const [route, surface, vpatRoute, vpatSurface, css] = await Promise.all([
    readWebFile("app/accessibility/page.tsx"),
    readWebFile("components/marketing-accessibility.tsx"),
    readWebFile("app/accessibility/vpat/page.tsx"),
    readWebFile("components/marketing-vpat.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingAccessibility/u);
  assert.match(surface, /Accessibility Statement/u);
  assert.match(surface, /sections\.map/u);
  assert.match(surface, /scrollIntoView/u);
  assert.match(surface, /mailto:accessibility@supademo\.com/u);
  assert.match(surface, /href="\/accessibility\/vpat"/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.accessibility-page/u);
  assert.match(css, /\.accessibility-sidebar/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(vpatRoute, /MarketingVpat/u);
  assert.match(vpatSurface, /Supademo Accessibility Conformance Report/u);
  assert.match(vpatSurface, /levelARows/u);
  assert.match(vpatSurface, /levelAARows/u);
  assert.match(vpatSurface, /mailto:accessibility@supademo\.com/u);
  assert.match(vpatSurface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.vpat-page/u);
  assert.match(css, /\.vpat-table-wrap/u);
  assert.doesNotMatch(vpatSurface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
