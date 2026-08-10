import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("academy route exposes bounded lesson and guide controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/academy/page.tsx"),
    readWebFile("components/marketing-academy.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingAcademy/u);
  assert.match(surface, /Supademo Academy/u);
  assert.match(surface, /moveSlide/u);
  assert.match(surface, /disabled=\{slide === 0\}/u);
  assert.match(surface, /aria-current=\{activeNav === id \? "page" : undefined\}/u);
  assert.match(surface, /href="\/academy\/playbooks"/u);
  assert.match(surface, /supademo-academy-logo\.svg/u);
  assert.match(surface, /website-demo\.avif/u);
  assert.match(surface, /mobile-demos\.avif/u);
  assert.match(surface, /in-app-demos\.avif/u);
  assert.match(surface, /Fastest way to master Supademo/u);
  assert.match(surface, /product-demo\/live-training/u);
  assert.match(surface, /youtube-nocookie\.com\/embed/u);
  assert.match(surface, /aria-label="Close video"/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.academy-page/u);
  assert.match(css, /\.academy-lesson-card/u);
  assert.match(css, /\.academy-video-modal/u);
  assert.match(css, /\.academy-guide-card-training/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
