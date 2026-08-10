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
    if (chapter.form) {
      lines.push(`- Form: ${chapter.form.title}`);
      lines.push(
        `- Form fields: ${chapter.form.fields.map((field) => `${field.label}${field.isRequired ? " (required)" : ""}`).join(", ") || "none"}`
      );
    }
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

export type CopyStepsFormat = "html" | "text";

const COPY_STEPS_TEXT_LIMIT = 4_000;

function boundedExportText(value: string | null | undefined): string {
  return Array.from(value ?? "")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("")
    .trim()
    .slice(0, COPY_STEPS_TEXT_LIMIT);
}

function escapeExportHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function safeExportImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("blob:")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function safeExportDestination(value: string | null | undefined): string | null {
  if (!value) return null;
  return safeExportImageUrl(value);
}

function exportChapterLines(document: DemoDocument): string[] {
  const lines: string[] = [];
  for (const [index, chapter] of document.chapters.entries()) {
    lines.push(`Chapter ${index + 1}: ${boundedExportText(chapter.title)}`);
    if (chapter.bodyText) lines.push(boundedExportText(chapter.bodyText));
    if (chapter.form) {
      lines.push(`Form: ${boundedExportText(chapter.form.title)}`);
      lines.push(
        `Fields: ${chapter.form.fields.map((field) => boundedExportText(field.label)).join(", ") || "none"}`
      );
    }
    for (const [buttonIndex, button] of chapter.buttons.entries()) {
      const destination =
        button.actionType === "url" && safeExportDestination(button.url)
          ? `Open ${safeExportDestination(button.url)}`
          : button.actionType === "step"
            ? `Go to step ${button.targetStepId ?? "(unassigned)"}`
            : "Continue to next step";
      lines.push(`Button ${buttonIndex + 1}: ${boundedExportText(button.label)} — ${destination}`);
    }
    lines.push("");
  }
  return lines;
}

/**
 * Generates plain text in the same image-plus-description shape as Copy Steps → Text.
 * URLs are intentionally omitted from the text output so copied content cannot leak storage paths.
 */
export function generateSopTextExport(document: DemoDocument): string {
  const lines = [`${boundedExportText(document.demoId)} — Step-by-step guide`, ""];
  lines.push(...exportChapterLines(document));
  document.steps.forEach((step, index) => {
    lines.push(`Step ${index + 1}: ${boundedExportText(step.title)}`);
    if (step.description) lines.push(boundedExportText(step.description));
    if (step.media?.storagePath) lines.push("[Step image]");
    step.hotspots.forEach((hotspot, hotspotIndex) => {
      const copy = boundedExportText(hotspot.tooltipText);
      lines.push(
        `Action ${hotspotIndex + 1}: ${copy || `Click target at ${hotspot.x}%, ${hotspot.y}%`}`
      );
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}

/**
 * Generates sanitized HTML for Copy Steps → HTML. It is intended for clipboard use only;
 * all user text is escaped and media URLs are restricted to HTTPS or browser blob URLs.
 */
export function generateSopHtmlExport(document: DemoDocument): string {
  const sections: string[] = [
    `<article data-supademo-export="copy-steps"><h1>${escapeExportHtml(boundedExportText(document.demoId))} — Step-by-step guide</h1>`
  ];
  for (const [index, chapter] of document.chapters.entries()) {
    sections.push(
      `<section><h2>Chapter ${index + 1}: ${escapeExportHtml(boundedExportText(chapter.title))}</h2>`
    );
    if (chapter.bodyText) {
      sections.push(`<p>${escapeExportHtml(boundedExportText(chapter.bodyText))}</p>`);
    }
    if (chapter.form) {
      sections.push(
        `<p><strong>Form:</strong> ${escapeExportHtml(boundedExportText(chapter.form.title))}</p>`
      );
      sections.push(
        `<p><strong>Fields:</strong> ${escapeExportHtml(chapter.form.fields.map((field) => boundedExportText(field.label)).join(", ") || "none")}</p>`
      );
    }
    if (chapter.buttons.length > 0) {
      sections.push(
        `<ol>${chapter.buttons
          .map((button) => `<li>${escapeExportHtml(boundedExportText(button.label))}</li>`)
          .join("")}</ol>`
      );
    }
    sections.push("</section>");
  }
  document.steps.forEach((step, index) => {
    sections.push(
      `<section><h2>Step ${index + 1}: ${escapeExportHtml(boundedExportText(step.title))}</h2>`
    );
    if (step.description) {
      sections.push(`<p>${escapeExportHtml(boundedExportText(step.description))}</p>`);
    }
    const mediaUrl = safeExportImageUrl(step.media?.storagePath);
    if (mediaUrl) {
      sections.push(
        `<p><img src="${escapeExportHtml(mediaUrl)}" alt="Step ${index + 1} screenshot" loading="lazy" /></p>`
      );
    }
    if (step.hotspots.length > 0) {
      sections.push(
        `<ul>${step.hotspots
          .map((hotspot) => {
            const copy =
              boundedExportText(hotspot.tooltipText) ||
              `Click target at ${hotspot.x}%, ${hotspot.y}%`;
            return `<li>${escapeExportHtml(copy)}</li>`;
          })
          .join("")}</ul>`
      );
    }
    sections.push("</section>");
  });
  sections.push("</article>");
  return sections.join("");
}
