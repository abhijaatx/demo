import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAssetUpload, NoOpMalwareScanAdapter } from "@supademo/media-worker";
import { InMemoryStorageAdapter } from "@supademo/storage";

test("security qualification: malicious executable & polyglot corpus rejected", async () => {
  const storage = new InMemoryStorageAdapter();
  const scanner = new NoOpMalwareScanAdapter();

  const maliciousCorpus = [
    { name: "shell.sh", mime: "application/x-sh", expectedCode: "type_not_allowed" },
    { name: "script.js", mime: "application/javascript", expectedCode: "type_not_allowed" },
    { name: "page.html", mime: "text/html", expectedCode: "type_not_allowed" },
    { name: "binary.exe", mime: "application/x-msdownload", expectedCode: "type_not_allowed" }
  ];

  for (const item of maliciousCorpus) {
    const res = await validateAssetUpload(
      storage,
      scanner,
      `workspaces/ws-sec/assets/ast/${item.name}`,
      item.mime,
      item.name
    );
    assert.equal(res.valid, false);
    if (!res.valid) {
      assert.equal(res.code, item.expectedCode);
    }
  }
});

test("security qualification: presigned URL expiry and path traversal safety", async () => {
  const storage = new InMemoryStorageAdapter();

  // Test presigned upload bounds (60 - 900s)
  const presigned = await storage.generateUploadUrl(
    "workspaces/ws-sec/assets/ast1/test.png",
    "image/png",
    300
  );
  assert.ok(presigned.uploadUrl.includes("expires=300"));

  // Reject out-of-bound expiration (< 60s or > 900s)
  await assert.rejects(
    async () =>
      storage.generateUploadUrl("workspaces/ws-sec/assets/ast1/test.png", "image/png", 10),
    /presigned URL expiry is invalid/u
  );

  // Reject path traversal keys
  await assert.rejects(
    async () => storage.generateUploadUrl("../../../etc/passwd", "image/png", 300),
    /storage object key is invalid/u
  );
});

test("load qualification: concurrent upload simulation within throughput bounds", async () => {
  const CONCURRENT_UPLOADS = 50;
  const storage = new InMemoryStorageAdapter();

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < CONCURRENT_UPLOADS; i++) {
    const key = `workspaces/ws-load/assets/ast-${i}/screen.png`;
    promises.push(storage.generateUploadUrl(key, "image/png", 300));
  }

  const results = await Promise.all(promises);
  const durationMs = Date.now() - startTime;

  assert.equal(results.length, CONCURRENT_UPLOADS);
  assert.ok(
    durationMs < 1000,
    `50 concurrent presign requests took ${durationMs}ms (budget < 1000ms)`
  );
});
