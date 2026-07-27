import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("workspace switching and onboarding expose safe, accessible recovery states", async () => {
  const [shell, client, onboarding, page] = await Promise.all([
    readWebFile("components/app-shell.tsx"),
    readWebFile("src/lib/workspace-client.ts"),
    readWebFile("components/workspace-onboarding-screen.tsx"),
    readWebFile("app/onboarding/workspace/page.tsx")
  ]);
  assert.match(shell, /aria-label="Current workspace"/u);
  assert.match(shell, /setCurrent\(workspaceId\)/u);
  assert.match(shell, /router\.refresh\(\)/u);
  assert.match(shell, /Set up a workspace/u);
  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /workspaces\/current/u);
  assert.match(onboarding, /Set up your workspace/u);
  assert.match(onboarding, /Create workspace/u);
  assert.match(onboarding, /role="status"/u);
  assert.match(onboarding, /router\.push\("\/"\)/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(`${shell}\n${onboarding}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
