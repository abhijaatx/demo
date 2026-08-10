import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("UI laboratory implements the Record to Edit to Share journey without new product navigation", async () => {
  const [source, page, shell] = await Promise.all([
    readWebFile("components/ui-lab.tsx"),
    readWebFile("app/ui-lab/page.tsx"),
    readWebFile("components/app-shell.tsx")
  ]);

  for (const stage of ["Record", "Edit", "Share"]) {
    assert.match(source, new RegExp(`"${stage}"`, "u"));
  }
  assert.match(source, /aria-label="Demo creation stages"/u);
  assert.match(source, /aria-current=\{stage === item \? "step" : undefined\}/u);
  assert.match(source, /Preview and share/u);
  assert.match(source, /Publish demo/u);
  assert.match(source, /<Tabs/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(shell, /ui-lab|UI laboratory/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("UI laboratory includes simple defaults, contextual advanced controls, and accessible editor landmarks", async () => {
  const source = await readWebFile("components/ui-lab.tsx");

  assert.match(source, /useState<UiLabStage>\("Record"\)/u);
  assert.match(source, /Show advanced controls/u);
  assert.match(source, /advanced \? /u);
  assert.match(source, /aria-label="Demo editor reference layout"/u);
  assert.match(source, /aria-label="Demo steps"/u);
  assert.match(source, /aria-label="Context inspector"/u);
  assert.match(source, /Start with screenshot/u);
  assert.match(source, /Add hotspot/u);
  assert.match(source, /Blur sensitive info/u);
});

test("responsive and accessibility audit rules are declared for the UI laboratory", async () => {
  const [css, source] = await Promise.all([
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8"),
    readWebFile("components/ui-lab.tsx")
  ]);

  assert.match(css, /\.ui-lab-stage-nav button \{[^}]*min-height: 44px/iu);
  assert.match(css, /\.ui-lab-editor \{[^}]*grid-template-columns/iu);
  assert.match(css, /@media \(max-width: 760px\)/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(source, /<main className="ui-lab"/u);
  assert.match(source, /data-lab-stage=\{stage\.toLowerCase\(\)\}/u);
});

test("UI laboratory stage selection updates displayed panel and active button aria-current", async () => {
  const source = await readWebFile("components/ui-lab.tsx");

  assert.match(source, /onClick=\{\(\) => setStage\(item\)\}/u);
  assert.match(source, /stage === "Record" \?/u);
  assert.match(source, /stage === "Edit" \?/u);
  assert.match(source, /stage === "Share" \?/u);
  assert.match(source, /id="ui-lab-record-heading"/u);
  assert.match(source, /id="ui-lab-edit-heading"/u);
  assert.match(source, /id="ui-lab-share-heading"/u);
});
