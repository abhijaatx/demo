/**
 * Share Links & Security Access Gates — TASK-083
 */

import { createHash } from "node:crypto";

export type ShareLinkKind = "normal" | "expiring" | "password" | "email_gated" | "preview_only";

export interface ShareLinkConfig {
  readonly id: string;
  readonly kind: ShareLinkKind;
  readonly token: string;
  readonly passwordHash: string | null;
  readonly expiresAtIso: string | null;
  readonly isRevoked: boolean;
}

export interface AccessGateResult {
  readonly isAllowed: boolean;
  readonly denialReason: string | null;
  readonly searchIndexingPolicy: "index" | "noindex";
}

export function hashSharePassword(password: string): string {
  return createHash("sha256").update(password.trim()).digest("hex");
}

export function verifyShareLinkAccess(
  config: ShareLinkConfig,
  providedPassword?: string,
  providedEmail?: string
): AccessGateResult {
  if (config.isRevoked) {
    return Object.freeze({
      isAllowed: false,
      denialReason: "This share link has been revoked.",
      searchIndexingPolicy: "noindex"
    });
  }

  if (config.expiresAtIso && new Date(config.expiresAtIso) < new Date()) {
    return Object.freeze({
      isAllowed: false,
      denialReason: "This share link has expired.",
      searchIndexingPolicy: "noindex"
    });
  }

  const searchIndexingPolicy = config.kind === "normal" ? "index" : "noindex";

  if (config.kind === "password") {
    if (!providedPassword || hashSharePassword(providedPassword) !== config.passwordHash) {
      return Object.freeze({
        isAllowed: false,
        denialReason: "Invalid or missing password.",
        searchIndexingPolicy: "noindex"
      });
    }
  }

  if (config.kind === "email_gated") {
    if (!providedEmail || !providedEmail.includes("@")) {
      return Object.freeze({
        isAllowed: false,
        denialReason: "Valid email address required to access this demo.",
        searchIndexingPolicy: "noindex"
      });
    }
  }

  return Object.freeze({
    isAllowed: true,
    denialReason: null,
    searchIndexingPolicy
  });
}
