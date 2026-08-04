/**
 * Immutable Publication Pipeline & Versioned Manifests — TASK-081
 */

import { createHash } from "node:crypto";
import { generateBranchingDiagnosticSummary } from "./branching-authoring.js";
import type { DemoDocument } from "./demo-document.js";

export interface PublishedDemoManifest {
  readonly id: string;
  readonly demoId: string;
  readonly version: number;
  readonly contentHash: string;
  readonly publishedAtIso: string;
  readonly isPublished: boolean;
  readonly document: DemoDocument;
}

export function publishDemoDocument(
  document: DemoDocument,
  currentVersion = 0
): PublishedDemoManifest {
  const summary = generateBranchingDiagnosticSummary(document);
  if (!summary.isPublishable) {
    throw new Error(
      `Cannot publish demo document: contains ${summary.missingTargetCount} missing targets and ${summary.unreachableNodeCount} unreachable steps.`
    );
  }

  const jsonStr = JSON.stringify(document);
  const contentHash = createHash("sha256").update(jsonStr).digest("hex");
  const nextVersion = currentVersion + 1;

  return Object.freeze({
    id: `pub-${document.demoId}-v${nextVersion}`,
    demoId: document.demoId,
    version: nextVersion,
    contentHash,
    publishedAtIso: new Date().toISOString(),
    isPublished: true,
    document: Object.freeze(JSON.parse(jsonStr))
  });
}

export function unpublishDemo(manifest: PublishedDemoManifest): PublishedDemoManifest {
  return Object.freeze({
    ...manifest,
    isPublished: false
  });
}
