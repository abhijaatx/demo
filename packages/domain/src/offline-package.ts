/**
 * Offline & Portable Self-Hosted Package Generator — TASK-090
 */

import { createHash } from "node:crypto";
import type { PublishedDemoManifest } from "./publication-pipeline.js";

export interface SelfHostedOfflinePackage {
  readonly packageId: string;
  readonly manifest: PublishedDemoManifest;
  readonly exportedAtIso: string;
  readonly expiresAtIso: string | null;
  readonly integrityHash: string;
}

export function calculatePackageIntegrity(manifestHash: string, exportedAtIso: string): string {
  return createHash("sha256")
    .update(`${manifestHash}:${exportedAtIso}:supademo-offline-v1`)
    .digest("hex");
}

export function createOfflinePackage(
  manifest: PublishedDemoManifest,
  expirationDays = 30
): SelfHostedOfflinePackage {
  const exportedAtIso = new Date().toISOString();
  const expiresAtMs = Date.now() + expirationDays * 24 * 60 * 60 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  const integrityHash = calculatePackageIntegrity(manifest.contentHash, exportedAtIso);

  return Object.freeze({
    packageId: `pkg-${manifest.demoId}-v${manifest.version}`,
    manifest,
    exportedAtIso,
    expiresAtIso,
    integrityHash
  });
}

export function verifyOfflinePackageIntegrity(pkg: SelfHostedOfflinePackage): boolean {
  if (!pkg || !pkg.manifest) return false;
  const expected = calculatePackageIntegrity(pkg.manifest.contentHash, pkg.exportedAtIso);
  return pkg.integrityHash === expected;
}
