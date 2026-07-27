import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("member administration keeps member controls within settings and exposes recovery states", async () => {
  const [screen, client, page, shell, css] = await Promise.all([
    readWebFile("components/member-administration-screen.tsx"),
    readWebFile("src/lib/membership-client.ts"),
    readWebFile("app/settings/members/page.tsx"),
    readWebFile("components/app-shell.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(page, /AppShell/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.match(shell, /Workspace members/u);
  assert.match(screen, /status === "loading"/u);
  assert.match(screen, /status === "error" \|\| status === "denied"/u);
  assert.match(screen, /Invite permission required/u);
  assert.match(screen, /Remove member\?/u);
  assert.match(screen, /Revoke invitation\?/u);
  assert.match(screen, /The current list was kept/u);
  assert.match(screen, /aria-label=\{`Role for \$\{member\.displayName\}`\}/u);
  assert.match(screen, /<table className="member-table">/u);
  assert.match(css, /@media \(max-width: 640px\)/u);
  assert.match(css, /\.member-table td::before/u);
  assert.doesNotMatch(`${screen}\n${client}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("member and existing cookie-authenticated clients include credentials and CSRF protections", async () => {
  const [membership, profile, workspace, auth, csrf] = await Promise.all([
    readWebFile("src/lib/membership-client.ts"),
    readWebFile("src/lib/profile-client.ts"),
    readWebFile("src/lib/workspace-client.ts"),
    readWebFile("src/lib/auth-client.ts"),
    readWebFile("src/lib/csrf.ts")
  ]);
  for (const source of [membership, profile, workspace]) {
    assert.match(source, /credentials: "include"/u);
    assert.match(source, /X-CSRF-Token/u);
    assert.match(source, /cache: "no-store"/u);
  }
  assert.match(auth, /saveCsrfToken/u);
  assert.match(csrf, /sessionStorage/u);
  assert.match(membership, /encodeURIComponent\(workspaceId\)/u);
  assert.match(membership, /encodeURIComponent\(memberId\)/u);
});
