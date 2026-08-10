import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("blog page exposes the featured carousel, bounded search, and article cards", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/blog/page.tsx"),
    readWebFile("components/marketing-blog.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingBlogPage/u);
  assert.match(surface, /The Supademo Blog/u);
  assert.match(surface, /Previous featured article/u);
  assert.match(surface, /Next featured article/u);
  assert.match(surface, /Search articles/u);
  assert.match(surface, /Best Agentic Demo Software in 2026/u);
  assert.match(surface, /Product Updates/u);
  assert.match(surface, /filteredProductUpdateArticles/u);
  assert.match(surface, /slice\(0, 120\)/u);
  assert.match(css, /\.blog-exact-featured/u);
  assert.match(css, /\.blog-exact-card/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
