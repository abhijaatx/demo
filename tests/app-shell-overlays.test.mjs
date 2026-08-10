import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("CommandPalette and AccountMenu provide interactive keyboard focus and overlay lifecycle controls", async () => {
  const [shell, overlays] = await Promise.all([
    readWebFile("components/app-shell.tsx"),
    readFile(new URL("../packages/ui/src/overlays.tsx", import.meta.url), "utf8")
  ]);

  assert.match(shell, /function CommandPalette/u);
  assert.match(shell, /Search <kbd>⌘K<\/kbd>/u);
  assert.match(shell, /handleKeyDown =/u);
  assert.match(shell, /filteredCommands\.map/u);
  assert.match(shell, /aria-selected=\{index === selectedIndex\}/u);
  assert.match(shell, /aria-label="Open account menu"/u);
  assert.match(shell, /<Dropdown/u);
  assert.match(shell, /role="menuitem"/u);
  assert.match(shell, /Account settings/u);
  assert.match(shell, /Workspace members/u);
  assert.match(shell, /createAuthClient/u);
  assert.match(shell, /authClientRef\.current\.signOut\(\)/u);
  assert.match(shell, /router\.replace\("\/auth"\)/u);
  assert.match(shell, /Your session is still active\. Try again\./u);
  assert.doesNotMatch(shell, /window\.location\.href\s*=\s*["']\/auth\/sign-in/u);

  assert.match(overlays, /ignoreRef/u);
  assert.match(overlays, /event\.key === "Escape"/u);
  assert.match(overlays, /aria-haspopup/u);
});
