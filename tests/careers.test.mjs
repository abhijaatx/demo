import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("careers page exposes the team story, bounded gallery, and safe roles anchor", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/careers/page.tsx"),
    readWebFile("components/marketing-careers.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingCareersPage/u);
  assert.match(surface, /Grow your career with Supademo/u);
  assert.match(surface, /The Supademo Impact/u);
  assert.match(surface, /Explore open roles/u);
  assert.match(surface, /Previous team moment/u);
  assert.match(surface, /Next team moment/u);
  assert.match(surface, /founders-headshot\.avif/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.careers-hero-gallery/u);
  assert.match(css, /\.careers-open-roles/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
