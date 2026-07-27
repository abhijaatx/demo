import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("demo dashboard keeps the Demos journey simple, responsive, and URL-backed", async () => {
  const [screen, page, shell, css] = await Promise.all([
    readWebFile("components/demo-dashboard-screen.tsx"),
    readWebFile("app/demos/page.tsx"),
    readWebFile("components/app-shell.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(page, /AppShell pageTitle="Demos"/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.match(shell, /href: "\/demos"/u);
  assert.match(shell, /supademo:workspace-changed/u);
  assert.match(screen, /const pageSize = 20/u);
  assert.match(screen, /sortedDemos\.slice\(/u);
  assert.match(screen, /useSearchParams\(\)/u);
  assert.match(screen, /setUrlState\(\{ view: value/u);
  assert.match(screen, /setUrlState\(\{ sort:/u);
  assert.match(screen, /label="Search demos"/u);
  assert.match(screen, /setUrlState\(\{ q:/u);
  assert.match(screen, /No demos match that search/u);
  assert.match(screen, /<Pagination/u);
  assert.match(screen, /Create demo/u);
  assert.match(screen, /<Modal/u);
  assert.match(screen, /searchParams\.get\("new"\) === "1"\) setCreateOpen\(true\)/u);
  assert.match(screen, /status === "loading"/u);
  assert.match(screen, /status === "denied"/u);
  assert.match(screen, /status === "error"/u);
  assert.match(screen, /setDemos\(\[\]\)/u);
  assert.match(screen, /supademo:workspace-changed/u);
  assert.match(screen, /EmptyState/u);
  assert.match(screen, /aria-label="Choose demo view"/u);
  assert.match(screen, /role="list"/u);
  assert.match(screen, /Duplicate/u);
  assert.match(screen, /Save as template/u);
  assert.match(screen, /Use template/u);
  assert.match(screen, /Templates \(/u);
  assert.match(css, /\.demo-card-grid/u);
  assert.match(css, /@media \(max-width: 520px\)/u);
  assert.doesNotMatch(`${screen}\n${shell}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("demo dashboard browser client scopes API requests, validates response shapes, and protects mutations", async () => {
  const client = await readWebFile("src/lib/demo-client.ts");

  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /X-CSRF-Token/u);
  assert.match(client, /encodeURIComponent\(workspaceId\)/u);
  assert.match(client, /Idempotency-Key/u);
  assert.match(client, /globalThis\.crypto\.randomUUID\(\)/u);
  assert.match(client, /duplicate/u);
  assert.match(client, /setTemplate/u);
  assert.match(client, /createFromTemplate/u);
  assert.match(client, /typeof demo\["isTemplate"\] === "boolean"/u);
  assert.match(client, /isDemoStatus/u);
  assert.doesNotMatch(
    client,
    /DATABASE_URL|REDIS_URL|AWS_SECRET_ACCESS_KEY|dangerouslySetInnerHTML|eval\(/u
  );
});
