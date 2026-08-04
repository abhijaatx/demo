import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("web baseline keeps the browser trust boundary explicit", async () => {
  const [client, publicPage, workspacePage, layout] = await Promise.all([
    readWebFile("src/lib/api-client.ts"),
    readWebFile("app/page.tsx"),
    readWebFile("app/app/page.tsx"),
    readWebFile("app/layout.tsx")
  ]);

  assert.match(client, /NEXT_PUBLIC_API_BASE_URL/u);
  assert.doesNotMatch(client, /DATABASE_URL|REDIS_URL|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID/u);
  assert.doesNotMatch(
    `${client}\n${publicPage}\n${workspacePage}\n${layout}`,
    /dangerouslySetInnerHTML/u
  );
  assert.match(publicPage, /MarketingHome/u);
  assert.match(workspacePage, /Your creation flow/u);
  assert.match(workspacePage, /label: "Record"[\s\S]*label: "Edit"[\s\S]*label: "Share"/u);
  assert.match(layout, /Supademo/u);
});
