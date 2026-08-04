import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeCssAssetUrls } from "@supademo/domain";

test("normalizeCssAssetUrls rewrites external CSS asset URLs to sandboxed CDN proxies", () => {
  const css = ".bg { background: url('https://external.com/images/hero.png'); }";
  const normalized = normalizeCssAssetUrls(css, "https://cdn.supademo.com/assets/");

  assert.equal(normalized.includes("https://cdn.supademo.com/assets/hero.png"), true);
});
