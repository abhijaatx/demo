/**
 * Public Demo URL & Version Pin Resolution — TASK-082
 */

import type { PublishedDemoManifest } from "./publication-pipeline.js";

export interface ResolvedPublicDemo {
  readonly manifest: PublishedDemoManifest;
  readonly canonicalUrl: string;
  readonly cacheControlHeader: string;
}

export function resolvePublicDemoUrl(
  publicSlug: string,
  manifests: readonly PublishedDemoManifest[]
): ResolvedPublicDemo | null {
  if (!publicSlug || typeof publicSlug !== "string" || manifests.length === 0) {
    return null;
  }

  const [slugPart, versionPart] = publicSlug.split(":v");
  const targetDemoId = slugPart?.trim();
  const targetVersion = versionPart ? parseInt(versionPart, 10) : null;

  const matches = manifests.filter((m) => m.demoId === targetDemoId && m.isPublished);

  if (matches.length === 0) return null;

  let selected: PublishedDemoManifest | undefined;
  if (targetVersion !== null && !isNaN(targetVersion)) {
    selected = matches.find((m) => m.version === targetVersion);
  } else {
    // Pick highest published version
    selected = [...matches].sort((a, b) => b.version - a.version)[0];
  }

  if (!selected) return null;

  const canonicalUrl = `/d/${selected.demoId}`;
  const cacheControlHeader = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

  return Object.freeze({
    manifest: selected,
    canonicalUrl,
    cacheControlHeader
  });
}
