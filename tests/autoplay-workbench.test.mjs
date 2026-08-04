import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("autoplay workbench exposes bounded uniform/custom timing and loop controls", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/autoplay/page.tsx"),
    readWebFile("components/autoplay-workbench.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /AutoplayWorkbench/u);
  assert.match(surface, /MAX_DURATION_SECONDS = 30/u);
  assert.match(surface, /MAX_DELAY_SECONDS = 10/u);
  assert.match(surface, /Autoplay/u);
  assert.match(surface, /Loop demo/u);
  assert.match(surface, /Custom per step/u);
  assert.match(surface, /Transition gap/u);
  assert.match(surface, /progressColor/u);
  assert.match(surface, /Download plan/u);
  assert.match(surface, /clearTimeout/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(css, /\.autoplay-workbench-stage/u);
  assert.match(css, /\.autoplay-workbench-step-row/u);
});
