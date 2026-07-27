import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("folder dashboard keeps hierarchy URL-backed, accessible, and server-authoritative", async () => {
  const [screen, client, css] = await Promise.all([
    readFile(new URL("../apps/web/components/demo-dashboard-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/src/lib/folder-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);
  assert.match(screen, /searchParams\.get\("folder"\)/u);
  assert.match(screen, /FolderSidebar/u);
  assert.match(screen, /folderBreadcrumbs/u);
  assert.match(screen, /role="tree"/u);
  assert.match(screen, /onDragStart/u);
  assert.match(screen, /onDrop/u);
  assert.match(screen, /Delete folder\?/u);
  assert.match(screen, /direct demos and nested folders will move to its parent/u);
  assert.match(screen, /setDemos\(\[\]\)/u);
  assert.match(client, /encodeURIComponent\(workspaceId\)/u);
  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /X-CSRF-Token/u);
  assert.match(client, /Idempotency-Key/u);
  assert.doesNotMatch(client, /innerHTML|outerHTML|document\.write|eval\(/u);
  assert.match(css, /@media \(max-width: 800px\)/u);
  assert.match(css, /\.folder-tree-item:focus-visible/u);
});
