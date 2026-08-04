import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("help route exposes fixed support destinations and tour CTA", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/help/page.tsx"),
    readWebFile("components/marketing-help.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingHelp/u);
  assert.match(surface, /here to help/u);
  assert.match(surface, /https:\/\/docs\.supademo\.com\//u);
  assert.match(surface, /https:\/\/status\.supademo\.com\//u);
  assert.match(surface, /View interactive product tour/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.doesNotMatch(surface, /MarketingFooter/u);
  assert.match(css, /\.help-page/u);
  assert.match(css, /\.help-tour-art/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
