import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("content directory matches the playbook surface and keeps links explicit", async () => {
  const [route, surface, footer, css] = await Promise.all([
    readWebFile("app/content/page.tsx"),
    readWebFile("components/marketing-content-directory.tsx"),
    readWebFile("components/marketing-download.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingContentDirectoryPage/u);
  assert.match(route, /Free Growth Playbooks/u);
  assert.match(surface, /Strategic playbooks and content to help you grow/u);
  assert.match(surface, /Tactical, step-by-step playbooks to help you grow/u);
  assert.match(surface, /Explore free content/u);
  assert.match(surface, /State of Interactive Demos \(2026 Report\)/u);
  assert.match(surface, /Create your first Supademo/u);
  assert.match(surface, /edit-header-min\.avif/u);
  assert.match(footer, /MarketingReferenceFooter/u);
  assert.match(css, /\.content-directory-exact-hero/u);
  assert.match(css, /\.content-directory-exact-card/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
