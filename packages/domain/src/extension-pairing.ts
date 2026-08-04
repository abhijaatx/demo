/**
 * Secure Extension Pairing & Workspace Authentication — TASK-092
 */

import { randomBytes, createHash } from "node:crypto";

export interface ExtensionPairingSession {
  readonly workspaceId: string;
  readonly pairingCode: string;
  readonly pairingTokenHash: string;
  readonly expiresAtIso: string;
  readonly isRevoked: boolean;
}

export function generatePairingCode(): string {
  // Generate 6-digit uppercase alphanumeric code
  return randomBytes(3).toString("hex").toUpperCase();
}

export function hashPairingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createPairingSession(
  workspaceId: string,
  expirationMinutes = 10
): { session: ExtensionPairingSession; rawToken: string } {
  const pairingCode = generatePairingCode();
  const rawToken = randomBytes(32).toString("hex");
  const pairingTokenHash = hashPairingToken(rawToken);

  const expiresAtMs = Date.now() + expirationMinutes * 60 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  const session = Object.freeze({
    workspaceId,
    pairingCode,
    pairingTokenHash,
    expiresAtIso,
    isRevoked: false
  });

  return { session, rawToken };
}

export function verifyPairingSession(
  session: ExtensionPairingSession,
  code: string,
  token: string
): boolean {
  if (session.isRevoked) return false;
  if (new Date(session.expiresAtIso) < new Date()) return false;
  if (session.pairingCode !== code.trim().toUpperCase()) return false;

  return session.pairingTokenHash === hashPairingToken(token);
}

export function revokePairingSession(session: ExtensionPairingSession): ExtensionPairingSession {
  return Object.freeze({
    ...session,
    isRevoked: true
  });
}
