import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("viewer wires chapter layout/theme/opacity/blur/color through bounded data attributes and styles", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );

  // Non-form chapters carry layout/theme data attributes plus bounded CSS
  // variables for blur, opacity, and the allowlisted custom color.
  assert.match(source, /data-chapter-layout/u);
  assert.match(source, /data-chapter-theme/u);
  assert.match(source, /--chapter-blur/u);
  assert.match(source, /--chapter-opacity/u);
  assert.match(source, /--chapter-color/u);
  assert.match(source, /chapterBackdropActive/u);
  assert.match(source, /demo-viewer-chapter-backdrop/u);

  // Form chapters keep their existing form rendering and gain bounded blur.
  assert.match(source, /data-form-layout/u);
  assert.match(source, /data-form-theme/u);
  assert.match(source, /demo-viewer-form-chapter-blur/u);
  assert.match(source, /--form-blur/u);

  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(|new Function\(/u);
});

test("viewer never constructs arbitrary CSS strings from chapter colors", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  // The custom color only flows through the allowlisted parsed value into a
  // CSS custom property; it is never interpolated directly into a style prop.
  assert.doesNotMatch(source, /backgroundColor: currentChapter/u);
  assert.doesNotMatch(source, /backgroundImage: currentChapter/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("chapter visual CSS applies backdrop layer, themes, layouts, and blur scoping", async () => {
  const css = await readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8");

  assert.match(css, /--chapter-bg/u);
  assert.match(css, /data-chapter-theme="dark"/u);
  assert.match(css, /data-chapter-theme="custom"/u);
  assert.match(css, /data-chapter-layout="left"/u);
  assert.match(css, /data-chapter-layout="right"/u);
  assert.match(css, /demo-viewer-chapter-backdrop::before/u);
  assert.match(css, /filter: blur/u);
  assert.match(css, /--chapter-blur, 0px/u);
  assert.match(css, /opacity: var/u);
  assert.match(css, /--chapter-opacity, 1/u);
  assert.match(css, /demo-viewer-form-chapter-blur::before/u);
});
