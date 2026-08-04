import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("download page exposes safe recorder choices and bounded feature lists", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/download/page.tsx"),
    readWebFile("components/marketing-download.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingDownloadPage/u);
  assert.match(surface, /Choose your demo recorder/u);
  assert.match(surface, /Chrome Extension/u);
  assert.match(surface, /Desktop Recorder/u);
  assert.match(surface, /chromewebstore\.google\.com/u);
  assert.match(surface, /Download for Mac/u);
  assert.match(surface, /Download for Windows/u);
  assert.match(surface, /Figma Plugin/u);
  assert.match(css, /\.download-choice-grid/u);
  assert.match(css, /\.download-cta/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
