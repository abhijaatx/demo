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
  S3CompatibleStorageAdapter
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

test("S3CompatibleStorageAdapter and InMemoryStorageAdapter generate presigned URLs", async () => {
  const s3 = new S3CompatibleStorageAdapter({
    endpoint: "https://s3.us-east-1.amazonaws.com",
    bucket: "supademo-assets"
  });

  const upload = await s3.generateUploadUrl("test-key.png", "image/png", 900);
  assert.match(
    upload.uploadUrl,
    /https:\/\/s3.us-east-1.amazonaws.com\/supademo-assets\/test-key.png/u
  );
  assert.equal(upload.headers["Content-Type"], "image/png");

  const downloadUrl = await s3.generateDownloadUrl("test-key.png", 3600);
  assert.match(downloadUrl, /https:\/\/s3.us-east-1.amazonaws.com\/supademo-assets\/test-key.png/u);

  const mem = new InMemoryStorageAdapter();
  mem.putMemoryObject("key.png", Buffer.from("hello"), "image/png", checksum);
  const head = await mem.headObject("key.png");
  assert.equal(head?.size, 5);
  assert.equal(head?.checksumSha256, checksum);
});

test("DatabaseAssetRepository creates presigned uploads, completes upload, and deletes assets", async () => {
  const storage = new InMemoryStorageAdapter();
  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("SELECT") && text.includes("FROM workspace_assets")) {
        return { rows: [assetRow()] };
      }
      if (text.includes("INSERT INTO workspace_assets")) {
        return { rows: [assetRow()] };
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
  assert.equal(completed.status, "ready");

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
