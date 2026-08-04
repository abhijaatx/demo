/**
 * Developer API Keys & Hashed Token Security — TASK-159
 */

import { createHash } from "node:crypto";

export type ApiKeyScope = "read:demos" | "write:demos" | "manage:webhooks";

export interface ApiKeyRecord {
  readonly keyId: string;
  readonly workspaceId: string;
  readonly keyHash: string;
  readonly scopes: readonly ApiKeyScope[];
  readonly isRevoked: boolean;
}

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createApiKeyRecord(
  keyId: string,
  workspaceId: string,
  rawToken: string,
  scopes: readonly ApiKeyScope[] = ["read:demos"]
): ApiKeyRecord {
  if (!keyId.trim() || !workspaceId.trim() || !rawToken.trim()) {
    throw new Error("Key ID, workspace ID, and raw token are required.");
  }

  return Object.freeze({
    keyId: keyId.trim(),
    workspaceId: workspaceId.trim(),
    keyHash: hashApiToken(rawToken.trim()),
    scopes: Object.freeze([...scopes]),
    isRevoked: false
  });
}

export function verifyApiKeyToken(record: ApiKeyRecord, rawToken: string): boolean {
  if (record.isRevoked) return false;
  return hashApiToken(rawToken.trim()) === record.keyHash;
}
