/**
 * Immutable Publication Pipeline & Versioned Manifests — TASK-081
 */

import { createHash } from "node:crypto";
import { parseDemoAudioNarration } from "./audio-narration.js";
import { generateBranchingDiagnosticSummary } from "./branching-authoring.js";
import { parseChapterPasswordProtection, sanitizeEmbedUrl } from "./chapter-model.js";
import { parseDemoTheme, type DemoDocument } from "./demo-document.js";
import { parseDemoFormSchema } from "./form-schemas.js";
import { validateSafeUrl } from "./hotspot-schema.js";

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

  const publishableDocument: DemoDocument = {
    ...document,
    settings: {
      ...document.settings,
      theme: parseDemoTheme(document.settings.theme)
    },
    steps: document.steps.map((step) => ({
      ...step,
      audioNarration: step.audioNarration ? parseDemoAudioNarration(step.audioNarration) : null
    })),
    chapters: document.chapters.map((chapter) => ({
      ...chapter,
      // Presenter notes are private authoring metadata and must not enter a public manifest.
      presenterNotes: null,
      mediaUrl:
        typeof chapter.mediaUrl === "string" &&
        (chapter.mediaUrl.startsWith("blob:") ||
          validateSafeUrl(chapter.mediaUrl)?.startsWith("https:"))
          ? chapter.mediaUrl
          : null,
      form: chapter.form ? parseDemoFormSchema(chapter.form) : null,
      passwordProtection: chapter.passwordProtection
        ? parseChapterPasswordProtection(chapter.passwordProtection)
        : null,
      embedUrl: chapter.embedUrl ? sanitizeEmbedUrl(chapter.embedUrl) : null,
      buttons: chapter.buttons.map((button) => {
        const safeUrl = validateSafeUrl(button.url);
        const actionType =
          button.actionType === "url" && safeUrl
            ? "url"
            : button.actionType === "url"
              ? "next"
              : button.actionType;
        return {
          ...button,
          actionType,
          targetStepId: actionType === "url" ? null : (button.targetStepId ?? null),
          url: actionType === "url" ? safeUrl : null
        };
      })
    }))
  };
  const jsonStr = JSON.stringify(publishableDocument);
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
