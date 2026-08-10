import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("showcase and tutorial directories preserve bounded filtering and reference media", async () => {
  const [showcase, tutorials, css] = await Promise.all([
    readWebFile("components/marketing-showcase.tsx"),
    readWebFile("components/marketing-tutorials.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(showcase, /setSelected/u);
  assert.match(showcase, /aria-expanded=\{openGroups\[name\]\}/u);
  assert.match(showcase, /media\.supademo\.com\/clf7r5s6900giyy0h6trezsck/u);
  assert.match(tutorials, /event\.target\.value\.slice\(0, 80\)/u);
  assert.match(tutorials, /app\.supademo\.com\/api\/demo\/\$\{imageId\}\/image/u);
  assert.match(tutorials, /role="tablist"/u);
  assert.match(css, /\.tutorials-tool-chips/u);
  assert.match(css, /\.showcase-section-heading/u);
  assert.doesNotMatch(
    `${showcase}\n${tutorials}`,
    /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u
  );
});
