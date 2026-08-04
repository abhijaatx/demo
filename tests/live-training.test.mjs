import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("live training route exposes a bounded local scheduler", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/product-demo/[slug]/page.tsx"),
    readWebFile("components/marketing-live-training.tsx"),
    readWebFile("app/globals.css")
  ]);
  assert.match(route, /MarketingLiveTraining/u);
  assert.match(surface, /Free Live Training/u);
  assert.match(surface, /Previous month/u);
  assert.match(surface, /Next month/u);
  assert.match(surface, /Asia\/Kolkata/u);
  assert.match(css, /\.live-training-page/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
