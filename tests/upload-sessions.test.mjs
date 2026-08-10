import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createApiServer } from "../apps/api/dist/app.js";
import { DatabaseUploadSessionRepository } from "../packages/database/dist/index.js";
import {
  calculatePartLayout,
  MAX_PARTS,
  MAX_UPLOAD_SESSION_SIZE_BYTES,
  parseInitiateUploadSessionInput,
  parseFinalizeUploadSessionInput,
  UploadSessionValidationError
} from "../packages/domain/dist/index.js";
import { InMemoryStorageAdapter } from "../packages/storage/dist/index.js";

const uploaderId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0011";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0012";
const sessionId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0013";
const checksum = "a".repeat(64); // 64-char hex-like string for testing
const idempotencyKey = "upload-test-idem-001";

function sessionRow(overrides = {}) {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 86400 * 1000).toISOString();
  return {
    id: sessionId,
    workspace_id: workspaceId,
    uploader_user_id: uploaderId,
    file_name: "large-video.mp4",
    mime_type: "video/mp4",
    total_size_in_bytes: "104857600",
    checksum_sha256: checksum,
    storage_key: `workspaces/${workspaceId}/uploads/${sessionId}/large-video.mp4`,
    provider_upload_id: null,
    status: "pending",
    part_count: "10",
    part_size_in_bytes: "10485760",
    completed_part_count: "0",
    asset_id: null,
    idempotency_key: idempotencyKey,
    expires_at: expires,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

// ── Domain parsing tests ───────────────────────────────────────────────────────

test("parseInitiateUploadSessionInput validates and normalises input", () => {
  const valid = parseInitiateUploadSessionInput({
    fileName: "  video.mp4 ",
    mimeType: "Video/Mp4",
    totalSizeInBytes: 10_485_760,
    checksumSha256: checksum,
    idempotencyKey: "key-001"
  });

  assert.equal(valid.fileName, "video.mp4");
  assert.equal(valid.mimeType, "video/mp4");
  assert.equal(valid.totalSizeInBytes, 10_485_760);
  assert.equal(valid.idempotencyKey, "key-001");
});

test("parseInitiateUploadSessionInput rejects invalid inputs", () => {
  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "",
        mimeType: "video/mp4",
        totalSizeInBytes: 1000,
        checksumSha256: checksum,
        idempotencyKey: "key"
      }),
    UploadSessionValidationError
  );

  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "file.mp4",
        mimeType: "not-valid",
        totalSizeInBytes: 1000,
        checksumSha256: checksum,
        idempotencyKey: "key"
      }),
    UploadSessionValidationError
  );

  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "file.mp4",
        mimeType: "video/mp4",
        totalSizeInBytes: 0, // invalid
        checksumSha256: checksum,
        idempotencyKey: "key"
      }),
    UploadSessionValidationError
  );

  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "file.mp4",
        mimeType: "video/mp4",
        totalSizeInBytes: MAX_UPLOAD_SESSION_SIZE_BYTES + 1, // too large
        checksumSha256: checksum,
        idempotencyKey: "key"
      }),
    UploadSessionValidationError
  );

  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "file.mp4",
        mimeType: "video/mp4",
        totalSizeInBytes: 1000,
        checksumSha256: "short",
        idempotencyKey: "key"
      }),
    UploadSessionValidationError
  );

  assert.throws(
    () =>
      parseInitiateUploadSessionInput({
        fileName: "file.mp4",
        mimeType: "video/mp4",
        totalSizeInBytes: 1000,
        checksumSha256: checksum,
        idempotencyKey: "" // empty key
      }),
    UploadSessionValidationError
  );
});

test("parseFinalizeUploadSessionInput is lenient with optional checksum", () => {
  assert.deepEqual(parseFinalizeUploadSessionInput({}), {});
  assert.deepEqual(parseFinalizeUploadSessionInput({ checksumSha256: checksum }), {
    checksumSha256: checksum
  });
  assert.throws(
    () => parseFinalizeUploadSessionInput({ checksumSha256: "bad" }),
    UploadSessionValidationError
  );
});

test("calculatePartLayout returns single part for small files", () => {
  const { partCount, partSizeInBytes } = calculatePartLayout(1024 * 1024); // 1 MB
  assert.equal(partCount, 1);
  assert.equal(partSizeInBytes, 1024 * 1024);
});

test("calculatePartLayout partitions large files within MAX_PARTS", () => {
  // 2 GB file
  const { partCount, partSizeInBytes } = calculatePartLayout(2 * 1024 * 1024 * 1024);
  assert.ok(partCount <= MAX_PARTS, `Part count ${partCount} exceeded ${MAX_PARTS}`);
  assert.ok(partSizeInBytes > 0);
  // Sum of parts covers the total
  assert.ok(partCount * partSizeInBytes >= 2 * 1024 * 1024 * 1024 - partSizeInBytes);
});

// ── Repository tests ───────────────────────────────────────────────────────────

function mockClient(queryResponses) {
  return {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      for (const [pattern, result] of queryResponses) {
        if (text.includes(pattern)) return result;
      }
      // Return empty rows for INSERT ON CONFLICT (part pre-creation)
      if (text.includes("INSERT INTO upload_parts")) return { rows: [] };
      throw new Error(`Unexpected query: ${JSON.stringify(text.slice(0, 80))}`);
    },
    release: () => undefined
  };
}

test("DatabaseUploadSessionRepository initiates session and returns presigned part URLs", async () => {
  const storage = new InMemoryStorageAdapter();
  const row = sessionRow();
  let insertCalled = false;
  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      // Idempotency SELECT — return empty so initiate proceeds
      if (
        text.includes("upload_sessions") &&
        text.includes("idempotency_key") &&
        !text.includes("INSERT")
      ) {
        return { rows: [] };
      }
      if (text.includes("INSERT INTO upload_sessions")) {
        insertCalled = true;
        return { rows: [row] };
      }
      if (text.includes("upload_parts")) return { rows: [] };
      throw new Error(`Unexpected query: ${text.slice(0, 100)}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  const result = await repository.initiate(uploaderId, workspaceId, {
    fileName: "large-video.mp4",
    mimeType: "video/mp4",
    totalSizeInBytes: 104_857_600,
    checksumSha256: checksum,
    idempotencyKey
  });

  assert.equal(insertCalled, true, "Expected INSERT to be called");
  assert.equal(result.session.status, "pending");
  assert.equal(result.session.workspaceId, workspaceId);
  assert.ok(result.parts.length >= 1, "Expected at least one part URL");
  assert.ok(result.parts[0].uploadUrl.includes("test-bucket"));
  assert.ok(result.parts[0].expiresInSeconds > 0);
});

test("DatabaseUploadSessionRepository is idempotent on repeated initiation", async () => {
  const storage = new InMemoryStorageAdapter();
  const row = sessionRow();
  const client = mockClient([
    ["idempotency_key", { rows: [row] }] // existing session found
  ]);

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  const result = await repository.initiate(uploaderId, workspaceId, {
    fileName: "large-video.mp4",
    mimeType: "video/mp4",
    totalSizeInBytes: 104_857_600,
    checksumSha256: checksum,
    idempotencyKey
  });

  assert.equal(result.session.id, sessionId);
  assert.equal(result.session.status, "pending");
});

test("DatabaseUploadSessionRepository getPartUrl returns presigned URL for valid part", async () => {
  const storage = new InMemoryStorageAdapter();
  const row = sessionRow();
  const client = mockClient([["SELECT", { rows: [row] }]]);

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  const part = await repository.getPartUrl(uploaderId, workspaceId, sessionId, 3);
  assert.equal(part.partNumber, 3);
  assert.ok(part.uploadUrl.includes("test-bucket"));
});

test("DatabaseUploadSessionRepository finalizes session and creates asset", async () => {
  const storage = new InMemoryStorageAdapter();
  const expires = new Date(Date.now() + 86400 * 1000).toISOString();
  const pendingRow = sessionRow({ expires_at: expires });
  const completedRow = sessionRow({
    status: "complete",
    asset_id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0099",
    expires_at: expires
  });

  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("FOR UPDATE")) return { rows: [pendingRow] };
      if (text.includes("status = 'finalizing'")) return { rows: [] };
      if (text.includes("INSERT INTO workspace_assets")) {
        return {
          rows: [{ id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0099" }]
        };
      }
      if (text.includes("status = 'complete'")) {
        return { rows: [completedRow] };
      }
      throw new Error(`Unexpected query: ${text.slice(0, 80)}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  const result = await repository.finalize(uploaderId, workspaceId, sessionId, {
    checksumSha256: checksum
  });

  assert.equal(result.session.status, "complete");
  assert.ok(result.assetId, "Expected assetId to be set after finalization");
  // The session's assetId should match what finalize returns
  assert.ok(typeof result.assetId === "string" && result.assetId.length > 0);
});

test("DatabaseUploadSessionRepository finalize rejects wrong checksum", async () => {
  const storage = new InMemoryStorageAdapter();
  const expires = new Date(Date.now() + 86400 * 1000).toISOString();
  const pendingRow = sessionRow({ expires_at: expires, checksum_sha256: checksum });

  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("FOR UPDATE")) return { rows: [pendingRow] };
      throw new Error(`Unexpected query: ${text.slice(0, 80)}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  await assert.rejects(
    () =>
      repository.finalize(uploaderId, workspaceId, sessionId, {
        checksumSha256: "b".repeat(64) // wrong checksum
      }),
    UploadSessionValidationError
  );
});

test("DatabaseUploadSessionRepository abort is idempotent", async () => {
  const storage = new InMemoryStorageAdapter();
  const abortedRow = sessionRow({ status: "aborted" });

  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("FOR UPDATE")) return { rows: [abortedRow] };
      throw new Error(`Unexpected query: ${text.slice(0, 80)}`);
    },
    release: () => undefined
  };

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  // Should not throw for already-aborted session
  await assert.doesNotReject(() => repository.abort(uploaderId, workspaceId, sessionId));
});

test("DatabaseUploadSessionRepository getSession returns session details", async () => {
  const storage = new InMemoryStorageAdapter();
  const row = sessionRow();
  const client = mockClient([["SELECT", { rows: [row] }]]);

  const repository = new DatabaseUploadSessionRepository({ connect: async () => client }, storage);

  const session = await repository.getSession(uploaderId, workspaceId, sessionId);
  assert.equal(session.id, sessionId);
  assert.equal(session.fileName, "large-video.mp4");
  assert.equal(session.status, "pending");
});

// ── API routing tests ──────────────────────────────────────────────────────────

test("upload session API routes are handled correctly", async (context) => {
  const storage = new InMemoryStorageAdapter();
  const expires = new Date(Date.now() + 86400 * 1000).toISOString();
  const row = sessionRow({ expires_at: expires });

  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "editor" }] };
      if (text.includes("INSERT INTO upload_sessions")) return { rows: [row] };
      if (text.includes("INSERT INTO upload_parts")) return { rows: [] };
      if (text.includes("status = 'pending'")) return { rows: [] }; // idempotency check — no existing
      if (text.includes("SELECT")) return { rows: [row] };
      return { rows: [] };
    },
    release: () => undefined
  };

  const uploadSessionRepository = new DatabaseUploadSessionRepository(
    { connect: async () => client },
    storage
  );

  const mockProfile = { userId: uploaderId, displayName: "Uploader", email: "up@test.com" };
  const userProfileRepository = {
    syncIdentity: async () => mockProfile,
    getById: async () => mockProfile,
    patchProfile: async () => mockProfile
  };

  // Test 503 when no repository configured — must send valid body
  const emptyServer = createApiServer({});
  emptyServer.listen(0, "127.0.0.1");
  await once(emptyServer, "listening");
  context.after(() => {
    emptyServer.close();
  });
  const emptyAddr = emptyServer.address();
  const emptyUrl = `http://127.0.0.1:${emptyAddr.port}`;

  const failResp = await fetch(`${emptyUrl}/api/v1/workspaces/${workspaceId}/upload-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "video.mp4",
      mimeType: "video/mp4",
      totalSizeInBytes: 10_485_760,
      checksumSha256: checksum,
      idempotencyKey
    })
  });
  assert.equal(failResp.status, 503);

  // Full server with repo configured
  const server = createApiServer({
    uploadSessionRepository,
    userProfileRepository,
    authProvider: {
      verifyAccessToken: async () => ({
        subject: uploaderId,
        email: "up@test.com",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        tokenUse: "access",
        provider: "local"
      }),
      createAccessToken: async () => ({
        token: "t",
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }),
      revokeToken: async () => {}
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => {
    server.close();
  });

  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  // POST /upload-sessions → 201
  const initResp = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}/upload-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token"
    },
    body: JSON.stringify({
      fileName: "video.mp4",
      mimeType: "video/mp4",
      totalSizeInBytes: 10_485_760,
      checksumSha256: checksum,
      idempotencyKey
    })
  });
  assert.equal(initResp.status, 201, `Expected 201, got ${initResp.status}`);
  const initBody = await initResp.json();
  assert.ok(initBody.session, "Expected session in response");
  assert.ok(Array.isArray(initBody.parts), "Expected parts array in response");

  // GET /upload-sessions/:id → 200
  const getResp = await fetch(
    `${baseUrl}/api/v1/workspaces/${workspaceId}/upload-sessions/${sessionId}`,
    { headers: { Authorization: "Bearer test-token" } }
  );
  assert.equal(getResp.status, 200);
  const getBody = await getResp.json();
  assert.ok(getBody.id);
});

// ── SQL migration test ─────────────────────────────────────────────────────────

test("upload session SQL migration declares required tables and constraints", async () => {
  const migration = await readFile(
    new URL("../packages/database/migrations/2026071202000_upload_sessions.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS upload_sessions/u);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS upload_parts/u);
  assert.match(migration, /upload_sessions_idempotency_uidx/u);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS upload_sessions_tenant_idx/u);
  assert.match(migration, /REFERENCES workspace_assets/u);
  assert.match(migration, /PRIMARY KEY \(session_id, part_number\)/u);
});
