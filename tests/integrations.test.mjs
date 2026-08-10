import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("integrations route exposes bounded category filters and safe links", async () => {
  const [route, detailRoute, surface, css] = await Promise.all([
    readWebFile("app/integrations/page.tsx"),
    readFile(new URL("../apps/web/app/integrations/[slug]/page.tsx", import.meta.url), "utf8"),
    readWebFile("components/marketing-integrations.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingIntegrations/u);
  assert.match(detailRoute, /MarketingIntegrationDetailClient/u);
  assert.match(detailRoute, /await params/u);
  assert.match(surface, /Supercharge your workflow with Supademo integrations/u);
  assert.match(surface, /integrationLogoSources/u);
  assert.match(surface, /referenceIntegrationDescriptions/u);
  assert.match(surface, /integrations\/calendly\.svg/u);
  assert.match(surface, /aria-expanded=\{categoriesOpen\}/u);
  assert.match(surface, /name="integration-category"/u);
  assert.match(surface, /setActiveCategory/u);
  assert.match(surface, /href=\{`\/integrations\/\$\{integration\.slug\}`\}/u);
  assert.match(surface, /aria-live="polite"/u);
  assert.match(
    surface,
    /Share and embed Supademos across your existing support docs, playbooks, or workflow\./u
  );
  assert.match(surface, /integrations-cta-art/u);
  assert.match(surface, /integrations-min\.avif/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.match(surface, /Clear filter/u);
  assert.match(surface, /getIntegrationBySlug/u);
  assert.match(surface, /Integration not found/u);
  assert.match(css, /\.integrations-library/u);
  assert.match(css, /\.integrations-card/u);
  assert.match(css, /\.integrations-cta-art img/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});

test("integration detail links resolve through an allowlisted catalog", async () => {
  const surface = await readWebFile("components/marketing-integrations.tsx");

  assert.match(surface, /function getIntegrationBySlug\(slug: string\)/u);
  assert.match(surface, /integration\.slug === slug/u);
  assert.ok(surface.includes('href="/integrations"'));
  assert.doesNotMatch(surface, /href=\{slug\}/u);
});
