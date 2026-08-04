import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("animation workbench exposes bounded zoom, pan, transition, and accessibility controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/animation/page.tsx"),
    readWebFile("components/animation-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /AnimationWorkbench/u);
  assert.match(surface, /parseAndNormalizeMotionConfig/u);
  assert.match(surface, /resolveEffectiveMotionConfig/u);
  assert.match(surface, /min="1"[\s\S]*max="3"/u);
  assert.match(surface, /max="2000"/u);
  assert.match(surface, /Respect reduced motion/u);
  assert.match(surface, /Hotspot hover effect/u);
  assert.match(surface, /Chapter button animation/u);
  assert.match(surface, /aria-label="Animation steps"/u);
  assert.match(surface, /Download plan/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.motion-workbench-stage/u);
  assert.match(css, /\.motion-workbench-hotspot-ping/u);
});
