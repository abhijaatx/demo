import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateAssetUpload,
  NoOpMalwareScanAdapter,
  processImageAsset,
  StubImageProcessorAdapter,
  processAvAsset,
  StubFfmpegAdapter
} from "@supademo/media-worker";
import { InMemoryStorageAdapter } from "@supademo/storage";

test("validateAssetUpload rejects blocked MIME types immediately", async () => {
  const storage = new InMemoryStorageAdapter();
  const scanner = new NoOpMalwareScanAdapter();

  const result = await validateAssetUpload(
    storage,
    scanner,
    "workspaces/ws1/assets/ast1/script.sh",
    "application/x-sh",
    "script.sh"
  );

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.code, "type_not_allowed");
  }
});

test("validateAssetUpload rejects unlisted MIME prefix", async () => {
  const storage = new InMemoryStorageAdapter();
  const scanner = new NoOpMalwareScanAdapter();

  const result = await validateAssetUpload(
    storage,
    scanner,
    "workspaces/ws1/assets/ast1/data.bin",
    "application/octet-stream",
    "data.bin"
  );

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.code, "type_not_allowed");
  }
});

test("validateAssetUpload catches extension mismatch", async () => {
  const storage = new InMemoryStorageAdapter();
  const scanner = new NoOpMalwareScanAdapter();

  // Create empty object in storage to prevent read failure
  storage.putMemoryObject(
    "workspaces/ws1/assets/ast1/fake.png",
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    "image/png"
  );

  const result = await validateAssetUpload(
    storage,
    scanner,
    "workspaces/ws1/assets/ast1/fake.png",
    "image/jpeg", // declared JPEG but extension .png maps to image/png
    "fake.png"
  );

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.code, "signature_mismatch");
  }
});

test("validateAssetUpload approves valid PNG image", async () => {
  const storage = new InMemoryStorageAdapter();
  const scanner = new NoOpMalwareScanAdapter();

  storage.putMemoryObject(
    "workspaces/ws1/assets/ast1/valid.png",
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    "image/png"
  );

  const result = await validateAssetUpload(
    storage,
    scanner,
    "workspaces/ws1/assets/ast1/valid.png",
    "image/png",
    "valid.png"
  );

  assert.equal(result.valid, true);
});

test("processImageAsset generates derivatives and marks asset ready", async () => {
  const storage = new InMemoryStorageAdapter();
  const imageProcessor = new StubImageProcessorAdapter();

  // Add dummy file
  storage.putMemoryObject("workspaces/ws1/assets/ast1/demo.jpg", Buffer.alloc(1024), "image/jpeg");

  let readyCalled = false;
  let derivativesSaved = 0;

  const mockRepo = {
    markProcessing: async () => {},
    markFailed: async () => {},
    markReady: async (wsId, assetId, readyData) => {
      readyCalled = true;
      assert.equal(readyData.width, 1920);
      assert.equal(readyData.height, 1080);
    },
    saveDerivative: async () => {
      derivativesSaved++;
    }
  };

  const result = await processImageAsset(
    mockRepo,
    storage,
    imageProcessor,
    "ws1",
    "ast1",
    "workspaces/ws1/assets/ast1/demo.jpg",
    "job-1"
  );

  assert.equal(readyCalled, true);
  assert.equal(result.width, 1920);
  assert.equal(result.height, 1080);
  assert.ok(derivativesSaved > 0);
});

test("processAvAsset generates poster frame, waveform, and marks video ready", async () => {
  const storage = new InMemoryStorageAdapter();
  const ffmpeg = new StubFfmpegAdapter();

  storage.putMemoryObject(
    "workspaces/ws1/assets/ast2/screencast.mp4",
    Buffer.alloc(2048),
    "video/mp4"
  );

  let readyCalled = false;
  let derivativesSaved = 0;

  const mockRepo = {
    markProcessing: async () => {},
    markFailed: async () => {},
    markReady: async (wsId, assetId, readyData) => {
      readyCalled = true;
      assert.equal(readyData.durationSeconds, 60);
    },
    saveDerivative: async () => {
      derivativesSaved++;
    }
  };

  const result = await processAvAsset(
    mockRepo,
    storage,
    ffmpeg,
    "ws1",
    "ast2",
    "workspaces/ws1/assets/ast2/screencast.mp4",
    "video",
    "job-2"
  );

  assert.equal(readyCalled, true);
  assert.equal(result.durationSeconds, 60);
  assert.ok(derivativesSaved > 0);
});

test("media pipeline SQL migration 2026071202100_asset_pipeline declares expected tables", async () => {
  const { readFile } = await import("node:fs/promises");
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071202100_asset_pipeline.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS asset_derivatives/u);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS asset_references/u);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS workspace_asset_quotas/u);
  assert.match(migration, /CREATE OR REPLACE VIEW workspace_asset_usage/u);
});
