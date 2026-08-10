import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("/settings/profile and /settings/members pages pass route titles, metadata, and handle all UI states", async () => {
  const [profilePage, memberPage, profileScreen, memberScreen] = await Promise.all([
    readWebFile("app/settings/profile/page.tsx"),
    readWebFile("app/settings/members/page.tsx"),
    readWebFile("components/profile-settings-screen.tsx"),
    readWebFile("components/member-administration-screen.tsx")
  ]);

  assert.match(profilePage, /AppShell pageTitle="Profile settings"/u);
  assert.match(profilePage, /robots: \{ index: false, follow: false \}/u);
  assert.match(memberPage, /AppShell pageTitle="Workspace members"/u);
  assert.match(memberPage, /robots: \{ index: false, follow: false \}/u);

  assert.match(profileScreen, /status === "loading"/u);
  assert.match(profileScreen, /setStatus\("ready"\)/u);
  assert.match(profileScreen, /status === "error"/u);
  assert.match(profileScreen, /status === "denied"/u);
  assert.match(profileScreen, /InlineAlert/u);
  assert.match(profileScreen, /Save changes/u);

  assert.match(memberScreen, /status === "loading"/u);
  assert.match(memberScreen, /setStatus\("ready"\)/u);
  assert.match(memberScreen, /status === "error"/u);
  assert.match(memberScreen, /status === "denied"/u);
  assert.match(memberScreen, /InlineAlert/u);
  assert.match(memberScreen, /Invite people/u);
  assert.match(memberScreen, /Pending invitations/u);
});
