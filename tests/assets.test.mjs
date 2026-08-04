import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseAssetRepository } from "../packages/database/dist/index.js";
import {
  AssetValidationError,
  inferAssetType,
  parseCreateAssetInput
} from "../packages/domain/dist/index.js";
import {
  InMemoryStorageAdapter,
  S3CompatibleStorageAdapter,
  StorageAdapterError
} from "../packages/storage/dist/index.js";

const uploaderId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const assetId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
const checksum = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

function assetRow(overrides = {}) {
  return {
    id: assetId,
    workspace_id: workspaceId,
    uploader_user_id: uploaderId,
    type: "image",
    status: "upload_pending",
    file_name: "screenshot.png",
    mime_type: "image/png",
    size_in_bytes: "1024",
    storage_path: `workspaces/${workspaceId}/assets/${assetId}/screenshot.png`,
    checksum_sha256: checksum,
    width: 1920,
    height: 1080,
    duration_seconds: null,
    created_at: "2026-07-12T00:00:00.000Z",
    updated_at: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

test("asset input parsing and type inference", () => {
  assert.equal(inferAssetType("image/png"), "image");
  assert.equal(inferAssetType("video/mp4"), "video");
  assert.equal(inferAssetType("audio/mp3"), "audio");
  assert.equal(inferAssetType("application/pdf"), "document");

  assert.deepEqual(
    parseCreateAssetInput({
      fileName: "  demo.mp4 ",
      mimeType: "video/mp4",
      sizeInBytes: 5000,
      checksumSha256: checksum,
      width: 1280,
      height: 720
    }),
    {
      fileName: "demo.mp4",
      mimeType: "video/mp4",
      sizeInBytes: 5000,
      checksumSha256: checksum,
      width: 1280,
      height: 720,
      durationSeconds: null
    }
  );

  assert.throws(
    () =>
      parseCreateAssetInput({
        fileName: "test.png",
        mimeType: "invalid-mime",
        sizeInBytes: 10,
        checksumSha256: checksum
      }),
    AssetValidationError
  );
});

test("S3CompatibleStorageAdapter signs bounded object and multipart operations", async () => {
  const sent = [];
  const client = {
    async send(command) {
      sent.push(command);
      if (command.constructor.name === "CreateMultipartUploadCommand") {
        return { UploadId: "provider-upload-1" };
      }
      if (command.constructor.name === "CompleteMultipartUploadCommand") {
        return { ETag: '"completed-etag"', ChecksumSHA256: `${"A".repeat(43)}=-2` };
      }
      if (command.constructor.name === "HeadObjectCommand") {
        return {
          ContentLength: 5,
          ContentType: "image/png",
          ETag: '"object-etag"',
          ChecksumSHA256: `${"A".repeat(43)}=`
        };
      }
      if (command.constructor.name === "ListPartsCommand") {
        return {
          Parts: [
            {
              PartNumber: 1,
              Size: 5,
              ETag: '"part-etag"',
              ChecksumSHA256: `${"A".repeat(43)}=`
            }
          ],
          IsTruncated: false
        };
      }
      if (command.constructor.name === "GetObjectCommand") {
        return {
          Body: {
            async *[Symbol.asyncIterator]() {
              yield Buffer.from("hello");
            }
          }
        };
      }
      return {};
    }
  };
  const presigned = [];
  const presign = async (_client, command, options) => {
    presigned.push({ command, options });
    return `https://signed.example/${command.constructor.name}`;
  };
  const s3 = new S3CompatibleStorageAdapter({
    endpoint: "http://127.0.0.1:9000",
    bucket: "supademo-assets",
    region: "us-east-1",
    accessKeyId: "local-access",
    secretAccessKey: "local-secret",
    client,
    presign
  });

  const upload = await s3.generateUploadUrl("test-key.png", "image/png", 900);
  assert.equal(upload.uploadUrl, "https://signed.example/PutObjectCommand");
  assert.equal(upload.headers["Content-Type"], "image/png");

  const downloadUrl = await s3.generateDownloadUrl("test-key.png", 3600);
  assert.equal(downloadUrl, "https://signed.example/GetObjectCommand");

  const handle = await s3.createMultipartUpload("test-key.png", "image/png");
  assert.equal(handle.uploadId, "provider-upload-1");
  const checksumSha256Base64 = `${"A".repeat(43)}=`;
  const partUrl = await s3.generateMultipartPartUploadUrl(
    "test-key.png",
    handle.uploadId,
    1,
    5,
    checksumSha256Base64,
    300
  );
  assert.equal(partUrl.uploadUrl, "https://signed.example/UploadPartCommand");
  assert.equal(partUrl.headers["x-amz-checksum-sha256"], checksumSha256Base64);
  assert.equal(presigned.at(-1).options.expiresIn, 300);
  assert.ok(presigned.at(-1).options.unhoistableHeaders.has("x-amz-checksum-sha256"));
  assert.deepEqual(await s3.listMultipartUploadParts("test-key.png", handle.uploadId), [
    {
      partNumber: 1,
      etag: '"part-etag"',
      checksumSha256Base64,
      sizeInBytes: 5
    }
  ]);

  const completed = await s3.completeMultipartUpload("test-key.png", handle.uploadId, [
    {
      partNumber: 1,
      etag: '"part-etag"',
      checksumSha256Base64,
      sizeInBytes: 5
    }
  ]);
  assert.equal(completed.etag, '"completed-etag"');
  assert.equal((await s3.headObject("test-key.png"))?.sizeInBytes, 5);
  const chunks = [];
  for await (const chunk of await s3.getObjectStream("test-key.png")) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString("utf8"), "hello");
  await s3.abortMultipartUpload("test-key.png", handle.uploadId);
  await s3.deleteObject("test-key.png");
  assert.ok(sent.some((command) => command.constructor.name === "AbortMultipartUploadCommand"));
  assert.ok(sent.some((command) => command.constructor.name === "DeleteObjectCommand"));

  await assert.rejects(
    () => s3.generateUploadUrl("../escape", "image/png", 900),
    StorageAdapterError
  );
  await assert.rejects(() => s3.generateDownloadUrl("test-key.png", 86_400), StorageAdapterError);
});

test("InMemoryStorageAdapter assembles verified multipart uploads and streams the result", async () => {
  const mem = new InMemoryStorageAdapter();
  const handle = await mem.createMultipartUpload("key.png", "image/png");
  const first = mem.putMemoryMultipartPart("key.png", handle.uploadId, 1, Buffer.from("hello "));
  const second = mem.putMemoryMultipartPart("key.png", handle.uploadId, 2, Buffer.from("world"));
  assert.equal((await mem.listMultipartUploadParts("key.png", handle.uploadId)).length, 2);
  await mem.completeMultipartUpload("key.png", handle.uploadId, [
    { partNumber: 1, sizeInBytes: 6, ...first },
    { partNumber: 2, sizeInBytes: 5, ...second }
  ]);

  const head = await mem.headObject("key.png");
  assert.equal(head?.sizeInBytes, 11);
  assert.equal(head?.mimeType, "image/png");
  assert.match(head?.checksumSha256Base64 ?? "", /^[A-Za-z0-9+/]{43}=$/u);
  const chunks = [];
  for await (const chunk of await mem.getObjectStream("key.png")) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString("utf8"), "hello world");
});

test("DatabaseAssetRepository creates presigned uploads, completes upload, and deletes assets", async () => {
  const storage = new InMemoryStorageAdapter();
  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("workspace_asset_usage")) {
        return {
          rows: [
            {
              total_storage_used_bytes: 0,
              asset_count: 0,
              storage_limit_bytes: 5368709120,
              asset_count_limit: 10000
            }
          ]
        };
      }
      if (text.includes("SELECT") && text.includes("FROM workspace_assets")) {
        return { rows: [assetRow()] };
      }
      if (text.includes("INSERT INTO workspace_assets")) {
        return { rows: [assetRow()] };
      }
      if (text.includes("status = 'validating'")) {
        return { rows: [assetRow({ status: "validating" })] };
      }
      if (text.includes("status = 'ready'")) {
        return { rows: [assetRow({ status: "ready" })] };
      }
      if (text.includes("status = 'deleted'")) {
        return {
          rows: [{ storage_path: `workspaces/${workspaceId}/assets/${assetId}/screenshot.png` }]
        };
      }
      throw new Error(`Unexpected query: ${text}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseAssetRepository({ connect: async () => client }, storage);

  const presigned = await repository.createPresignedUpload(uploaderId, workspaceId, {
    fileName: "screenshot.png",
    mimeType: "image/png",
    sizeInBytes: 1024,
    checksumSha256: checksum
  });

  assert.equal(presigned.asset.status, "upload_pending");
  assert.match(presigned.uploadUrl, /test-bucket/u);

  const completed = await repository.completeUpload(uploaderId, workspaceId, assetId, checksum);
  assert.equal(completed.status, "validating");

  const ready = await repository.markReady(workspaceId, assetId, { width: 100, height: 100 });
  assert.equal(ready.status, "ready");

  const downloadUrl = await repository.getPresignedDownloadUrl(uploaderId, workspaceId, assetId);
  assert.match(downloadUrl, /test-bucket/u);

  const deleted = await repository.deleteAsset(uploaderId, workspaceId, assetId);
  assert.equal(deleted, true);
});

test("asset SQL migration declares workspace_assets table and tenant index", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071201300_assets.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS workspace_assets/u);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS workspace_assets_tenant_idx/u);
  assert.match(migration, /WHERE deleted_at IS NULL/u);
});
