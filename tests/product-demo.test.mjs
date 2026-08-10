import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("product demo route keeps the request form bounded and non-submitting", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/product-demo/page.tsx"),
    readWebFile("components/marketing-product-demo.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingProductDemo/u);
  assert.match(surface, /See Supademo in action/u);
  assert.match(surface, /product-demo-avatar-stack/u);
  assert.match(surface, /product-demo-proof-track/u);
  assert.match(surface, /https:\/\/supademo\.com\/logos\/vrify\.svg/u);
  assert.match(surface, /https:\/\/supademo\.com\/logos\/processmaker\.svg/u);
  assert.match(surface, /product-demo-trust-logos/u);
  assert.match(surface, /slice\(0, field === "email" \? 254 : 120\)/u);
  assert.match(surface, /goals\.includes/u);
  assert.match(surface, /role="alert"/u);
  assert.match(surface, /href="\/signup\?source=instant-ai-demo"/u);
  assert.match(css, /\.product-demo-page/u);
  assert.match(css, /\.product-demo-proof-card/u);
  assert.match(css, /\.product-demo-proof-viewport/u);
  assert.match(css, /product-demo-card-marquee/u);
  assert.match(css, /grid-template-columns: repeat\(4, 80px\)/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
