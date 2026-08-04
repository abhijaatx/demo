/**
 * Sharing Metadata & Multi-Format SOP Export Generators — TASK-089
 */

import type { BrandingTheme } from "./branding-theme.js";
import type { DemoDocument } from "./demo-document.js";

export interface SharingMetadata {
  readonly title: string;
  readonly description: string;
  readonly ogImageUrl: string | null;
  readonly robotsPolicy: "index, follow" | "noindex, nofollow";
  readonly canonicalUrl: string;
}

export function generateSharingMetadata(
  document: DemoDocument,
  branding: BrandingTheme | null,
  isPublic: boolean,
  baseUrl = "https://app.supademo.com"
): SharingMetadata {
  const title = document.settings?.logoUrl
    ? `Demo: ${document.demoId}`
    : `Interactive Demo: ${document.demoId}`;
  const description = `Interactive product walk-through containing ${document.steps.length} step(s).`;
  const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/d/${document.demoId}`;
  const ogImageUrl = branding?.logoUrl ?? null;
  const robotsPolicy = isPublic ? "index, follow" : "noindex, nofollow";

  return Object.freeze({
    title,
    description,
    ogImageUrl,
    robotsPolicy,
    canonicalUrl
  });
}

export function generateSopMarkdownExport(document: DemoDocument): string {
  const lines: string[] = [];
  lines.push(`# Standard Operating Procedure: ${document.demoId}`);
  lines.push("");
  lines.push(`Total Steps: ${document.steps.length}`);
  lines.push(`Total Chapters: ${document.chapters?.length ?? 0}`);
  lines.push("");

  for (const [idx, chapter] of (document.chapters ?? []).entries()) {
    lines.push(`## Chapter ${idx + 1}: ${chapter.title}`);
    if (chapter.bodyText) lines.push(chapter.bodyText);
    chapter.buttons.forEach((button, buttonIndex) => {
      const destination =
        button.actionType === "url"
          ? button.url
            ? `Open ${button.url}`
            : "Open external URL"
          : button.actionType === "step"
            ? `Go to step ${button.targetStepId ?? "(unassigned)"}`
            : "Continue to next step";
      lines.push(`- Button ${buttonIndex + 1}: ${button.label} — ${destination}`);
    });
    lines.push("");
  }

  document.steps.forEach((step, idx) => {
    lines.push(`## Step ${idx + 1}: ${step.title}`);
    if (step.media?.storagePath) {
      lines.push(`![Step ${idx + 1} screenshot](${step.media.storagePath})`);
    }
    step.hotspots.forEach((h, hIdx) => {
      lines.push(
        `- Action ${hIdx + 1}: Click target at position (${h.x}%, ${h.y}%). ${h.tooltipText ?? ""}`
      );
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}
