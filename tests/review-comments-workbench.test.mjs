import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("review comments exposes internal and external bounded collaboration flows", async () => {
  const [route, surface, panel, css] = await Promise.all([
    readWebFile("app/comments/page.tsx"),
    readWebFile("components/review-comments-workbench.tsx"),
    readWebFile("components/comments-panel.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /ReviewCommentsWorkbench/u);
  assert.match(surface, /Internal comments/u);
  assert.match(surface, /External comments/u);
  assert.match(surface, /createLocalReviewClient/u);
  assert.match(surface, /in-browser review store/u);
  assert.match(panel, /Reply/u);
  assert.match(panel, /Resolve/u);
  assert.match(panel, /Post Comment/u);
  assert.match(panel, /toggleReaction/u);
  assert.doesNotMatch(
    surface,
    /dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.review-comments-stage/u);
  assert.match(css, /\.review-comments-tabs/u);
});
