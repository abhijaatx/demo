import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("authenticated shell declares navigation, workspace/account affordances, and command palette state", async () => {
  const shell = await readWebFile("components/app-shell.tsx");

  assert.match(shell, /<div className="app-shell">/u);
  assert.match(shell, /<Sidebar/u);
  assert.match(shell, /header=\{/u);
  assert.match(shell, /footer=\{/u);
  for (const label of ["Home", "Demos", "Hubs", "Analytics", "Leads", "Settings"]) {
    assert.match(shell, new RegExp(`label: "${label}"|>\\s*${label}\\s*<`, "u"));
  }
  assert.match(shell, /Acme workspace/u);
  assert.match(shell, /aria-label="Open account menu"/u);
  assert.match(shell, /aria-label=\{mobileNavOpen \? "Close navigation" : "Open navigation"\}/u);
  assert.match(shell, /Search <kbd>⌘K<\/kbd>/u);
  assert.match(shell, /<CommandPalette open=\{commandOpen\}/u);
});

test("shell uses route-safe deep links and retains route-level boundaries", async () => {
  const [shell, page, loading, error, notFound] = await Promise.all([
    readWebFile("components/app-shell.tsx"),
    readWebFile("app/page.tsx"),
    readWebFile("app/loading.tsx"),
    readWebFile("app/error.tsx"),
    readWebFile("app/not-found.tsx")
  ]);

  assert.match(page, /AppShell/u);
  assert.match(shell, /href: "\/demos"/u);
  assert.match(shell, /\/?section=analytics/u);
  assert.match(shell, /metaKey \|\| event\.ctrlKey/u);
  assert.match(shell, /setCommandOpen\(true\)/u);
  assert.match(loading, /aria-busy="true"/u);
  assert.match(error, /onClick=\{reset\}/u);
  assert.match(notFound, /Return home/u);
  assert.doesNotMatch(`${shell}\n${page}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
