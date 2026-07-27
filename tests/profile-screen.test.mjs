import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("profile settings exposes safe account fields, preferences, and save states", async () => {
  const [screen, client, page, shell, css] = await Promise.all([
    readWebFile("components/profile-settings-screen.tsx"),
    readWebFile("src/lib/profile-client.ts"),
    readWebFile("app/settings/profile/page.tsx"),
    readWebFile("components/app-shell.tsx"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);

  for (const label of [
    "Email address",
    "Display name",
    "Avatar URL",
    "Timezone",
    "Appearance",
    "Reduce motion",
    "Email notifications",
    "Save changes"
  ]) {
    assert.match(screen, new RegExp(label.replace(/[?]/gu, "\\$&"), "u"));
  }
  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /PATCH/u);
  assert.match(screen, /status === "loading"/u);
  assert.match(screen, /status === "denied"/u);
  assert.match(screen, /Try again/u);
  assert.match(screen, /role="status"/u);
  assert.match(screen, /type="submit"/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.match(shell, /href="\/settings\/profile"/u);
  assert.match(css, /\.profile-settings-grid \{[^}]*grid-template-columns/iu);
  assert.doesNotMatch(`${screen}\n${client}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
  assert.doesNotMatch(`${screen}\n${client}`, /console\.(log|error)|password.*log|log.*password/iu);
});
