import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("pricing route exposes the reference plan sheet, add-on, comparison, and FAQ controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/pricing/page.tsx"),
    readWebFile("components/marketing-pricing.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /Plans & Pricing \| Supademo/u);
  assert.match(surface, /Transparent, flexible pricing/u);
  assert.match(surface, /Usage-based add-on/u);
  assert.match(surface, /AI Demo Agent/u);
  assert.match(surface, /Trusted by 200,000\+ top operators/u);
  assert.match(surface, /Trusted by thousands of fast growing companies/u);
  assert.match(surface, /pricing-testimonials-grid/u);
  assert.match(surface, /faq-section-illustration\.avif/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(surface, /MarketingHeader active="pricing" variant="sharing"/u);
  assert.doesNotMatch(surface, /pricing-cta-title/u);
  assert.match(surface, /role="tablist"/u);
  assert.match(surface, /Compare plans and features ↓/u);
  assert.match(surface, /Can I get started for free\?/u);
  assert.match(surface, /aria-expanded=\{isOpen\}/u);
  assert.match(surface, /Math\.min\(10, count \+ 1\)/u);
  assert.match(surface, /actionHref: "\/signup"/u);
  assert.match(surface, /href=\{plan\.actionHref\}/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(css, /\.pricing-addon/u);
  assert.match(css, /\.pricing-trust-logo-panel/u);
  assert.match(css, /\.pricing-comparison-tabs/u);
  assert.match(css, /\.pricing-faq-item/u);
  assert.match(css, /\.pricing-testimonials/u);
  assert.match(css, /\.pricing-testimonial-card/u);
  assert.match(css, /\.pricing-page \.marketing-footer-showcase/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
});
