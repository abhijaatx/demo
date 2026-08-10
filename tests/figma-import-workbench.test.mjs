import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("Figma import keeps local frame ingestion bounded and allowlisted", async () => {
  const surface = await readWebFile("components/figma-import-workbench.tsx");

  assert.match(surface, /MAX_FRAMES = 8/u);
  assert.match(surface, /MAX_IMAGE_BYTES = 1_200_000/u);
  assert.match(surface, /image\/png.*image\/jpeg.*image\/webp/u);
  assert.match(surface, /imageUrl\.length > 1_800_000/u);
  assert.match(surface, /maxLength=\{120\}/u);
  assert.match(surface, /maxLength=\{400\}/u);
  assert.match(surface, /localStorage\.setItem/u);
  assert.doesNotMatch(
    surface,
    /dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
});
