import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");
const readBaseline = () =>
  readFile(new URL("./visual-baselines/workbench-baselines.json", import.meta.url), "utf8");

test("component workbench exposes representative states without changing primary navigation", async () => {
  const [source, page] = await Promise.all([
    readWebFile("components/component-workbench.tsx"),
    readWebFile("app/workbench/page.tsx")
  ]);

  for (const section of ["controls", "feedback", "data", "media", "disclosure"]) {
    assert.match(source, new RegExp(`data-workbench-section="${section}"`, "u"));
  }
  for (const state of ["loading", "showError", "disabled", "EmptyState", "dark"]) {
    assert.match(source, new RegExp(state, "u"));
  }
  assert.match(source, /setMode\("advanced"\)/u);
  assert.match(source, /aria-pressed=\{mode === "simple"\}/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("visual baseline contract is deterministic and covers responsive themes and component states", async () => {
  const baseline = JSON.parse(await readBaseline());

  assert.equal(baseline.route, "/workbench");
  assert.deepEqual(baseline.themes, ["light", "dark"]);
  assert.deepEqual(baseline.states, [
    "simple",
    "advanced",
    "loading",
    "error",
    "empty",
    "disabled"
  ]);
  assert.deepEqual(
    baseline.viewports.map(({ name }) => name),
    ["creator-desktop", "creator-mobile"]
  );
  assert.equal(baseline.determinism.network, "blocked");
  assert.equal(baseline.determinism.clock, "fixed");
  assert.equal(baseline.selectors.length, 5);
});

test("workbench uses accessible interaction primitives for actions, overlays, tabs, and fields", async () => {
  const source = await readWebFile("components/component-workbench.tsx");

  assert.match(source, /aria-label="Workbench controls"/u);
  assert.match(source, /aria-label="Disclosure mode"/u);
  assert.match(source, /aria-pressed=\{theme === "dark"\}/u);
  assert.match(source, /<Modal/u);
  assert.match(source, /<Dropdown/u);
  assert.match(source, /<Tabs/u);
  assert.match(source, /<Input/u);
  assert.match(source, /<Button/u);
});
