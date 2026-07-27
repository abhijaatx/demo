# Security Review & Handoff — TASK-041: Asset Metadata & Storage Abstraction

## Overview

- **Task**: TASK-041 — Define asset metadata and storage abstraction
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain`, `@supademo/storage`, `@supademo/database`, `@supademo/api`, `@supademo/web`

---

## Technical Changes & Architecture

### 1. Domain Layer (`packages/domain`)

- **Domain Model (`Asset`, `AssetType`, `AssetStatus`)**: Supported types (`"image"`, `"video"`, `"audio"`, `"document"`, `"screenshot"`) and statuses (`"upload_pending"`, `"ready"`, `"failed"`, `"deleted"`).
- **Validation & Parsers**:
  - `parseCreateAssetInput`: Sanitizes file name (max 255 chars, path traversal prevention), validates MIME types, bounds file size (1B - 5GB), and enforces 64-character SHA-256 checksum strings.
  - `inferAssetType`: Maps MIME types to primary asset types.
- **Storage Interface**: `ObjectStorageAdapter` defining presigned upload URL, presigned download URL, head object, and delete object methods.
- **Repository Interface**: `AssetRepository`.

### 2. Storage Package (`packages/storage`)

- **`S3CompatibleStorageAdapter`**: Implementation generating presigned AWS S3 / MinIO V4 URLs with strict expiration bounds.
- **`InMemoryStorageAdapter`**: In-memory adapter for rapid local integration testing.

### 3. Database Layer (`packages/database`)

- **Migration `2026071201300_assets.sql`**:
  - Created `workspace_assets` table with foreign keys on `workspaces` and `users`.
  - Created partial index `workspace_assets_tenant_idx` on `(workspace_id, status) WHERE deleted_at IS NULL`.
- **Repository Implementation (`DatabaseAssetRepository`)**:
  - `createPresignedUpload`: Validates workspace membership, creates `upload_pending` asset record in database, and returns presigned upload URL expiring in 900 seconds.
  - `completeUpload`: Validates workspace membership, verifies SHA-256 checksum matching, and updates status to `ready`.
  - `getPresignedDownloadUrl`: Validates workspace membership and generates download URL.
  - `deleteAsset`: Transactionally soft-deletes database record and invokes storage adapter object deletion.

### 4. API & OpenAPI Contracts (`apps/api` & `@supademo/web`)

- **REST Endpoints**:
  - `POST /api/v1/workspaces/{workspaceId}/assets/presign-upload`
  - `POST /api/v1/workspaces/{workspaceId}/assets/{assetId}/complete`
  - `GET /api/v1/workspaces/{workspaceId}/assets/{assetId}/presign-download`
  - `GET /api/v1/workspaces/{workspaceId}/assets/{assetId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/assets/{assetId}`

---

## Security Analysis & Controls

1. **Deny-by-Default Direct Storage Access**:
   - Assets are stored under private paths (`workspaces/{workspaceId}/assets/{assetId}/...`). Presigned URLs carry short-lived expirations and explicit content-type headers.

2. **Integrity & Checksum Verification**:
   - Ingestion enforces SHA-256 checksum validation upon completion.

3. **Tenant Boundary Preservation**:
   - All asset queries strictly bind `workspace_id = $1` and require authenticated workspace membership.

---

## Verification Evidence

- `npm run format:check` -> Passed.
- `npm run lint` -> Passed (0 errors, 0 warnings).
- `npm run check:boundaries` -> Passed.
- `npm run typecheck` -> Passed.
- `npm run build` -> Next.js build succeeded.
- `npm test` -> 147 tests passed.
