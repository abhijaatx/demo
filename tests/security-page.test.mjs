import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("security trust center exposes bounded tabs and safe resource links", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/security/page.tsx"),
    readWebFile("components/marketing-security.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingSecurityPage/u);
  assert.match(surface, /Trust Center/u);
  assert.match(surface, /Ask a question/u);
  assert.match(surface, /Request access/u);
  assert.match(surface, /Infrastructure security/u);
  assert.match(surface, /aria-selected=\{activeTab === tab\}/u);
  assert.match(css, /\.security-trust-hero/u);
  assert.match(css, /\.security-trust-control-grid/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
