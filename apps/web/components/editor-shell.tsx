"use client";

import {
  deleteSteps,
  duplicateStep,
  generateBranchingDiagnosticSummary,
  generateIframeSnippet,
  generateSopMarkdownExport,
  nudgeHotspot,
  publishDemoDocument,
  parseDemoDocument,
  reorderSteps,
  resizeHotspot,
  validateSafeUrl,
  type DemoDocument,
  type DemoStep,
  type DemoHotspot,
  type PublishedDemoManifest
} from "@supademo/domain";
import { Modal } from "@supademo/ui";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export type CaptureMode = "guided" | "html" | "sandbox" | "screenshot" | "video" | "upload";

const captureModeCopy: Record<CaptureMode, { title: string; description: string }> = {
  guided: {
    title: "Guided demo capture",
    description:
      "Add screens from a focused workflow, then place hotspots on the moments that matter."
  },
  html: {
    title: "Guided HTML capture",
    description:
      "Use the browser recorder for clickable web states, or import a screen to start the storyboard."
  },
  sandbox: {
    title: "Sandbox demo capture",
    description:
      "Start with a screen or video, then turn the story into an explorable product path."
  },
  screenshot: {
    title: "Screenshot capture",
    description: "Import a crisp image and add focused annotations or hotspots."
  },
  video: {
    title: "Video capture",
    description: "Import a short walkthrough video and keep the surrounding story in one editor."
  },
  upload: {
    title: "Upload media",
    description:
      "Bring in screenshots or video you already recorded. Files stay local until you save them."
  }
};

function normalizeStepOrder(steps: readonly DemoStep[]): readonly DemoStep[] {
  return steps.map((step, index) => ({ ...step, orderIndex: index }));
}

function clampPercent(value: number, minimum = 0, maximum = 100): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function safeExportDocument(document: DemoDocument): DemoDocument {
  return {
    ...document,
    steps: document.steps.map((step) => ({
      ...step,
      hotspots: step.hotspots.map((hotspot) => {
        if (hotspot.actionType !== "open_url") return hotspot;
        const safeUrl = validateSafeUrl(hotspot.url);
        return {
          ...hotspot,
          actionType: safeUrl ? "open_url" : "next_step",
          targetStepId: safeUrl ? null : hotspot.targetStepId,
          url: safeUrl
        };
      }),
      media:
        step.media && isSafeMediaUrl(step.media.storagePath)
          ? step.media
          : step.media
            ? { ...step.media, storagePath: "" }
            : null
    }))
  };
}

const URL_DESTINATION_OPTION = "__supademo_open_url__";

function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("blob:")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeTrackingKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 64);
}

function persistLocalDocument(demoId: string, demoDocument: DemoDocument): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`supademo_draft_${demoId}`, JSON.stringify(demoDocument));
  } catch {
    // Local persistence is a best-effort fallback for the browser-only demo workspace.
  }
}

type ShareTab = "Link" | "Embed" | "Export" | "Present";

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SharePanel({
  open,
  initialTab,
  demoId,
  demoDocument,
  readOnly,
  onClose
}: {
  open: boolean;
  initialTab: ShareTab;
  demoId: string;
  demoDocument: DemoDocument;
  readOnly: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ShareTab>(initialTab);
  const [trackingKey, setTrackingKey] = useState("");
  const [publishedManifest, setPublishedManifest] = useState<PublishedDemoManifest | null>(null);
  const [publishError, setPublishError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setCopyStatus("");
    setPublishError("");
    try {
      const raw = localStorage.getItem(`supademo_published_${demoId}`);
      if (!raw) {
        setPublishedManifest(null);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) {
        setPublishedManifest(null);
        return;
      }
      const candidate = parsed as Record<string, unknown>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.demoId !== "string" ||
        typeof candidate.version !== "number" ||
        typeof candidate.contentHash !== "string" ||
        typeof candidate.publishedAtIso !== "string" ||
        candidate.isPublished !== true
      ) {
        setPublishedManifest(null);
        return;
      }
      const document = parseDemoDocument(candidate.document);
      setPublishedManifest({
        id: candidate.id,
        demoId: candidate.demoId,
        version: candidate.version,
        contentHash: candidate.contentHash,
        publishedAtIso: candidate.publishedAtIso,
        isPublished: true,
        document
      });
    } catch {
      setPublishedManifest(null);
    }
  }, [demoId, initialTab, open]);

  const baseUrl = typeof globalThis.location?.origin === "string" ? globalThis.location.origin : "";
  const viewerPath = `/demos/${encodeURIComponent(demoId)}/view`;
  const shareUrl = `${baseUrl}${viewerPath}${
    trackingKey.trim() ? `?ref=${encodeURIComponent(sanitizeTrackingKey(trackingKey))}` : ""
  }`;
  const embedSnippet = generateIframeSnippet({
    demoId,
    baseUrl: baseUrl || undefined
  });
  const exportDocument = safeExportDocument(demoDocument);
  const sopMarkdown = generateSopMarkdownExport(exportDocument);
  const tabs: readonly ShareTab[] = ["Link", "Embed", "Export", "Present"];

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied to clipboard");
    } catch {
      setCopyStatus("Copy was blocked. Select the text and copy it manually.");
    }
  };

  const handlePublish = (): void => {
    if (readOnly) return;
    if (demoDocument.steps.length === 0) {
      setPublishError("Add at least one screen before publishing this demo.");
      return;
    }
    try {
      const manifest = publishDemoDocument(demoDocument, publishedManifest?.version ?? 0);
      setPublishedManifest(manifest);
      setPublishError("");
      try {
        localStorage.setItem(`supademo_published_${demoId}`, JSON.stringify(manifest));
      } catch {
        // The viewer remains usable in this tab even when local storage is unavailable.
      }
    } catch (error: unknown) {
      setPublishError(
        error instanceof Error ? error.message : "This demo cannot be published yet."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share demo"
      description="Publish a version, copy a trackable link, embed the viewer, or present it full-screen."
      className="editor-share-modal"
    >
      <div className="editor-share-tabs" role="tablist" aria-label="Share options">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "is-active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Link" ? (
        <div className="editor-share-section">
          <div className="editor-share-status-card">
            <span className={`editor-share-dot${publishedManifest ? " is-published" : ""}`} />
            <span>
              <strong>{publishedManifest ? "Published" : "Draft"}</strong>
              <small>
                {publishedManifest
                  ? `Version ${publishedManifest.version} is ready to share.`
                  : "Publish only after the viewer path is ready."}
              </small>
            </span>
            {!readOnly && !publishedManifest ? (
              <button
                type="button"
                className="editor-button editor-button-primary"
                onClick={handlePublish}
              >
                Publish
              </button>
            ) : null}
          </div>
          {publishError ? (
            <p className="editor-share-error" role="alert">
              {publishError}
            </p>
          ) : null}
          <label className="editor-field">
            <span>Trackable link label</span>
            <input
              type="text"
              value={trackingKey}
              maxLength={64}
              placeholder="e.g. launch-email"
              onChange={(event) => setTrackingKey(event.currentTarget.value)}
            />
          </label>
          <div className="editor-share-copy-row">
            <input type="text" readOnly value={shareUrl} aria-label="Share link" />
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void copyText(shareUrl)}
            >
              Copy link
            </button>
          </div>
          <p className="editor-share-note">
            Viewer events from the link can be attributed by its `ref` label.
          </p>
        </div>
      ) : null}

      {tab === "Embed" ? (
        <div className="editor-share-section">
          <p className="editor-share-lede">
            Paste this responsive iframe snippet into a help center, website, or LMS.
          </p>
          <textarea
            className="editor-share-code"
            readOnly
            value={embedSnippet}
            aria-label="Embed snippet"
          />
          <div className="editor-share-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              onClick={() => void copyText(embedSnippet)}
            >
              Copy embed code
            </button>
          </div>
          <p className="editor-share-note">
            The demo ID is URL-encoded and the iframe only requests fullscreen and clipboard-write.
          </p>
        </div>
      ) : null}

      {tab === "Export" ? (
        <div className="editor-share-section">
          <p className="editor-share-lede">
            Download a handoff for your team or keep the structured document as a backup.
          </p>
          <div className="editor-share-export-grid">
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() =>
                downloadTextFile(`${demoId}-sop.md`, sopMarkdown, "text/markdown;charset=utf-8")
              }
            >
              Download SOP (Markdown)
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() =>
                downloadTextFile(
                  `${demoId}.json`,
                  JSON.stringify(demoDocument, null, 2),
                  "application/json"
                )
              }
            >
              Download document (JSON)
            </button>
          </div>
          <p className="editor-share-note">
            Media paths are included only when they use a safe HTTPS or local blob URL.
          </p>
        </div>
      ) : null}

      {tab === "Present" ? (
        <div className="editor-share-section editor-share-present">
          <span className="editor-kicker">Presenter mode</span>
          <h3>Open the focused viewer preview</h3>
          <p>
            Use the same step path your audience will see, with hotspots and next/previous controls.
          </p>
          <a className="editor-button editor-button-primary" href={viewerPath}>
            Open viewer preview
          </a>
        </div>
      ) : null}

      {copyStatus ? (
        <p className="editor-share-feedback" role="status">
          {copyStatus}
        </p>
      ) : null}
    </Modal>
  );
}

function CaptureEntryPanel({
  copy,
  captureError,
  captureStatus,
  captureMode,
  compact = false,
  fileInputRef,
  onFileChange,
  onOpenFilePicker,
  readOnly
}: {
  copy: { title: string; description: string };
  captureError: string;
  captureStatus: string;
  captureMode: CaptureMode;
  compact?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  readOnly: boolean;
}) {
  return (
    <section className={`editor-capture-entry${compact ? " is-compact" : ""}`}>
      <div className="editor-capture-copy">
        <span className="editor-kicker">{copy.title}</span>
        <strong>{compact ? "Add another screen" : "Start with your first screen"}</strong>
        <p>{copy.description}</p>
      </div>
      {!readOnly ? (
        <div className="editor-capture-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={onFileChange}
            className="editor-file-input"
            aria-label="Choose an image or video capture"
          />
          <button
            type="button"
            className="editor-button editor-button-primary"
            onClick={onOpenFilePicker}
          >
            Import screenshot or video
          </button>
          {captureMode === "html" || captureMode === "sandbox" ? (
            <a className="editor-capture-link" href="/download">
              Open recorder setup
            </a>
          ) : null}
        </div>
      ) : null}
      {captureError ? (
        <span className="editor-capture-error" role="alert">
          {captureError}
        </span>
      ) : null}
      {captureStatus ? (
        <span className="editor-capture-status" role="status">
          {captureStatus}
        </span>
      ) : null}
      <small className="editor-capture-limit">Images and videos up to 100 MB</small>
    </section>
  );
}

export interface EditorShellProps {
  demoId: string;
  initialDocument: DemoDocument;
  readOnly?: boolean;
  saveState?: "saved" | "saving" | "offline" | "conflict" | "error";
  onSaveDocument?: (doc: DemoDocument) => Promise<void>;
  onPreview?: () => void;
  onShare?: () => void;
  captureMode?: CaptureMode;
}

export function EditorShell({
  demoId,
  initialDocument,
  readOnly = false,
  saveState = "saved",
  onSaveDocument,
  onPreview,
  onShare,
  captureMode = "guided"
}: EditorShellProps) {
  const [document, setDocument] = useState<DemoDocument>(initialDocument);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialDocument.steps[0]?.id ?? null
  );
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState("");
  const [captureError, setCaptureError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const undoStackRef = useRef<DemoDocument[]>([]);
  const redoStackRef = useRef<DemoDocument[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInitialTab, setShareInitialTab] = useState<ShareTab>("Link");
  const [hotspotUrlDraft, setHotspotUrlDraft] = useState("");

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (readOnly || initialDocument.steps.length > 0 || typeof localStorage === "undefined") {
      return;
    }
    try {
      const raw = localStorage.getItem(`supademo_draft_${demoId}`);
      if (!raw) return;
      const restored = parseDemoDocument(JSON.parse(raw));
      if (restored.demoId !== demoId) return;
      setDocument(restored);
      setSelectedStepId(restored.steps[0]?.id ?? null);
      setSelectedHotspotId(null);
    } catch {
      // A malformed or stale local draft fails closed to the server-provided empty document.
    }
  }, [demoId, initialDocument.steps.length, readOnly]);

  const selectedStep = document.steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedHotspot = selectedStep?.hotspots.find((h) => h.id === selectedHotspotId) ?? null;
  const branchSummary = generateBranchingDiagnosticSummary(document);

  useEffect(() => {
    setHotspotUrlDraft(selectedHotspot?.url ?? "");
  }, [selectedHotspot?.id, selectedHotspot?.url]);

  const makeLocalId = (prefix: string): string => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}`;
  };

  const commitDocument = (nextDocument: DemoDocument): void => {
    const updated: DemoDocument = {
      ...nextDocument,
      demoId,
      updatedAtIso: new Date().toISOString()
    };
    undoStackRef.current.push(document);
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryVersion((version) => version + 1);
    setDocument(updated);
    persistLocalDocument(demoId, updated);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const restoreFromHistory = (nextDocument: DemoDocument): void => {
    const updated: DemoDocument = {
      ...nextDocument,
      demoId,
      updatedAtIso: new Date().toISOString()
    };
    setHistoryVersion((version) => version + 1);
    setDocument(updated);
    const restoredStep =
      updated.steps.find((step) => step.id === selectedStepId) ?? updated.steps[0];
    setSelectedStepId(restoredStep?.id ?? null);
    setSelectedHotspotId(
      restoredStep?.hotspots.some((hotspot) => hotspot.id === selectedHotspotId)
        ? selectedHotspotId
        : null
    );
    persistLocalDocument(demoId, updated);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const handleUndo = (): void => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(document);
    restoreFromHistory(previous);
  };

  const handleRedo = (): void => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(document);
    restoreFromHistory(next);
  };

  const handleTitleChange = (newTitle: string) => {
    if (readOnly) return;
    const updatedSteps = document.steps[0]
      ? [{ ...document.steps[0], title: newTitle }, ...document.steps.slice(1)]
      : document.steps;
    commitDocument({ ...document, steps: updatedSteps });
  };

  const handleAddStep = () => {
    if (readOnly) return;
    const newStepId = makeLocalId("step");
    const newStep: DemoStep = {
      id: newStepId,
      orderIndex: document.steps.length,
      title: `Step ${document.steps.length + 1}`,
      description: null,
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    };
    const updated = { ...document, steps: [...document.steps, newStep] };
    commitDocument(updated);
    setSelectedStepId(newStepId);
    setSelectedHotspotId(null);
  };

  const handleDuplicateStep = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;
    const duplicate = duplicateStep(selectedStep, selectedIndex + 1);
    const nextSteps = normalizeStepOrder([
      ...document.steps.slice(0, selectedIndex + 1),
      duplicate,
      ...document.steps.slice(selectedIndex + 1)
    ]);
    commitDocument({ ...document, steps: nextSteps });
    setSelectedStepId(duplicate.id);
    setSelectedHotspotId(null);
  };

  const handleDeleteStep = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;
    const remaining = deleteSteps(document.steps, new Set([selectedStep.id]));
    commitDocument({ ...document, steps: remaining });
    const fallback = remaining[selectedIndex] ?? remaining[selectedIndex - 1] ?? null;
    setSelectedStepId(fallback?.id ?? null);
    setSelectedHotspotId(null);
  };

  const handleMoveStep = (direction: "up" | "down"): void => {
    if (readOnly || !selectedStep) return;
    const fromIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (fromIndex < 0) return;
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= document.steps.length) return;
    const nextSteps = reorderSteps(document.steps, fromIndex, toIndex);
    commitDocument({ ...document, steps: nextSteps });
  };

  const handleCaptureFile = (event: ChangeEvent<HTMLInputElement>): void => {
    if (readOnly) return;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const maxBytes = 100 * 1024 * 1024;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setCaptureError("Choose an image or video file.");
      setCaptureStatus("");
      return;
    }
    if (file.size > maxBytes) {
      setCaptureError("Files must be 100 MB or smaller.");
      setCaptureStatus("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);
    const stepId = makeLocalId("step");
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._ -]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const title = safeName || (isVideo ? "Captured video" : "Captured screen");
    const newStep: DemoStep = {
      id: stepId,
      orderIndex: document.steps.length,
      title,
      description: isVideo ? "Imported video walkthrough." : "Imported screen capture.",
      media: {
        assetId: makeLocalId("local-asset"),
        assetType: isVideo ? "video" : "screenshot",
        storagePath: objectUrl,
        width: null,
        height: null,
        durationSeconds: null,
        posterPath: null
      },
      hotspots: [],
      callouts: [],
      audioNarration: null
    };
    commitDocument({ ...document, steps: [...document.steps, newStep] });
    setSelectedStepId(stepId);
    setSelectedHotspotId(null);
    setCaptureError("");
    setCaptureStatus(`${isVideo ? "Video" : "Screen"} added as step ${document.steps.length + 1}.`);
  };

  const handleAddHotspot = () => {
    if (readOnly || !selectedStep) return;
    const newHotspotId = makeLocalId("hotspot");
    const newHotspot: DemoHotspot = {
      id: newHotspotId,
      x: 40,
      y: 40,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Click to continue",
      actionType: "next_step",
      url: null,
      style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
    };
    const updatedSteps = document.steps.map((s) => {
      if (s.id !== selectedStep.id) return s;
      return { ...s, hotspots: [...s.hotspots, newHotspot] };
    });
    const updated = { ...document, steps: updatedSteps };
    commitDocument(updated);
    setSelectedHotspotId(newHotspotId);
  };

  const handleAddBranchChoice = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;

    const nextStep = document.steps[selectedIndex + 1] ?? null;
    const branchStepId = makeLocalId("branch");
    const branchStep: DemoStep = {
      id: branchStepId,
      orderIndex: document.steps.length,
      title: `Branch ${document.steps.length + 1}`,
      description: "A viewer-selected branch destination.",
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    };

    const branchChoice: DemoHotspot = {
      id: makeLocalId("hotspot"),
      x: 18 + (selectedStep.hotspots.length % 3) * 24,
      y: 68,
      width: 20,
      height: 12,
      targetStepId: branchStepId,
      tooltipText: `Explore ${branchStep.title}`,
      actionType: "goto_step",
      url: null,
      style: { pulse: true, color: "#7c5cff", opacity: 0.86 }
    };

    const seededChoices: readonly DemoHotspot[] =
      selectedStep.hotspots.length === 0 && nextStep
        ? [
            {
              id: makeLocalId("hotspot"),
              x: 18,
              y: 52,
              width: 20,
              height: 12,
              targetStepId: nextStep.id,
              tooltipText: "Continue to next step",
              actionType: "goto_step",
              url: null,
              style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
            },
            branchChoice
          ]
        : [...selectedStep.hotspots, branchChoice];

    const updatedSteps = normalizeStepOrder([
      ...document.steps.slice(0, selectedIndex),
      { ...selectedStep, hotspots: seededChoices },
      ...document.steps.slice(selectedIndex + 1),
      branchStep
    ]);
    commitDocument({ ...document, steps: updatedSteps });
    setSelectedStepId(selectedStep.id);
    setSelectedHotspotId(branchChoice.id);
  };

  const updateSelectedHotspot = (patch: Partial<DemoHotspot>): void => {
    if (readOnly || !selectedStep || !selectedHotspot) return;
    const updatedSteps = document.steps.map((step) => {
      if (step.id !== selectedStep.id) return step;
      return {
        ...step,
        hotspots: step.hotspots.map((hotspot) =>
          hotspot.id === selectedHotspot.id ? { ...hotspot, ...patch } : hotspot
        )
      };
    });
    commitDocument({ ...document, steps: updatedSteps });
  };

  const handleNudgeHotspot = (direction: "up" | "down" | "left" | "right"): void => {
    if (!selectedHotspot) return;
    updateSelectedHotspot({
      ...nudgeHotspot(selectedHotspot, direction, 1)
    });
  };

  const handleHotspotKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const directions: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      handleNudgeHotspot(direction);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      handleDeleteHotspot();
    }
  };

  const handleDeleteHotspot = (): void => {
    if (readOnly || !selectedStep || !selectedHotspot) return;
    const updatedSteps = document.steps.map((step) =>
      step.id === selectedStep.id
        ? {
            ...step,
            hotspots: step.hotspots.filter((hotspot) => hotspot.id !== selectedHotspot.id)
          }
        : step
    );
    commitDocument({ ...document, steps: updatedSteps });
    setSelectedHotspotId(null);
  };

  const handlePreview = (): void => {
    if (onPreview) {
      onPreview();
      return;
    }
    setShareInitialTab("Present");
    setShareOpen(true);
  };

  const handleShare = (): void => {
    if (onShare) {
      onShare();
      return;
    }
    setShareInitialTab("Link");
    setShareOpen(true);
  };

  return (
    <div className="editor-shell">
      {readOnly ? (
        <div className="editor-readonly-banner" role="status">
          Read-only mode — You do not have permission to edit this demo.
        </div>
      ) : null}
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <a className="editor-back-link" href="/demos">
            <span aria-hidden="true">←</span> Back to Demos
          </a>
          <span className="editor-divider" aria-hidden="true" />
          <input
            className="editor-title-input"
            type="text"
            value={document.steps[0]?.title ?? "Untitled Demo"}
            disabled={readOnly}
            onChange={(event) => handleTitleChange(event.currentTarget.value)}
            aria-label="Demo Title"
          />
          <span className={`editor-save-state editor-save-${saveState}`} role="status">
            {saveState === "saved" && "✓ Saved"}
            {saveState === "saving" && "⟳ Saving…"}
            {saveState === "offline" && "⚠ Offline"}
            {saveState === "conflict" && "⚡ Conflict"}
            {saveState === "error" && "✖ Save error"}
          </span>
        </div>
        <div className="editor-topbar-actions" data-history-version={historyVersion}>
          {!readOnly ? (
            <>
              <button
                type="button"
                className="editor-small-button"
                onClick={handleUndo}
                disabled={undoStackRef.current.length === 0}
                aria-label="Undo last edit"
              >
                Undo
              </button>
              <button
                type="button"
                className="editor-small-button"
                onClick={handleRedo}
                disabled={redoStackRef.current.length === 0}
                aria-label="Redo last edit"
              >
                Redo
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="editor-button editor-button-secondary"
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="editor-button editor-button-primary"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </header>

      <div className="editor-workspace">
        <aside className="editor-step-rail" aria-label="Step Navigation Rail">
          <div className="editor-panel-heading">
            <div>
              <span className="editor-kicker">Storyboard</span>
              <strong>Steps ({document.steps.length})</strong>
            </div>
            {!readOnly ? (
              <button type="button" className="editor-small-button" onClick={handleAddStep}>
                + Step
              </button>
            ) : null}
          </div>
          <div className="editor-step-list">
            {document.steps.map((step, index) => {
              const isSelected = step.id === selectedStepId;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`editor-step-card${isSelected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSelectedStepId(step.id);
                    setSelectedHotspotId(null);
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="editor-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="editor-step-copy">
                    <strong>{step.title}</strong>
                    <small>
                      {step.hotspots.length} hotspot{step.hotspots.length === 1 ? "" : "s"}
                    </small>
                  </span>
                </button>
              );
            })}
            {document.steps.length === 0 ? (
              <p className="editor-empty-state">No steps yet. Add one to start your demo.</p>
            ) : null}
          </div>
        </aside>

        <main className="editor-canvas" aria-label="Editor Canvas">
          <div className="editor-canvas-toolbar">
            <span>Canvas</span>
            <span>
              {document.layout.aspectRatio} · {document.steps.length} screen
              {document.steps.length === 1 ? "" : "s"}
            </span>
          </div>
          {selectedStep ? (
            <div
              className={`editor-preview editor-preview-${document.layout.aspectRatio.replace(":", "-")}`}
            >
              {selectedStep.media ? (
                selectedStep.media.assetType === "video" ? (
                  <video
                    src={selectedStep.media.storagePath}
                    controls
                    playsInline
                    aria-label={selectedStep.title}
                  />
                ) : (
                  <img src={selectedStep.media.storagePath} alt={selectedStep.title} />
                )
              ) : (
                <div className="editor-preview-placeholder">
                  <span className="editor-placeholder-icon" aria-hidden="true">
                    ▦
                  </span>
                  <strong>{selectedStep.title}</strong>
                  <small>Add a screen or video to this step</small>
                </div>
              )}
              {selectedStep.hotspots.map((hotspot) => {
                const isSelected = hotspot.id === selectedHotspotId;
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`editor-hotspot${isSelected ? " is-selected" : ""}${
                      hotspot.style.pulse ? " is-pulsing" : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedHotspotId(hotspot.id);
                    }}
                    onKeyDown={handleHotspotKeyDown}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                      backgroundColor: hotspot.style.color,
                      borderColor: hotspot.style.color,
                      opacity: clampPercent(hotspot.style.opacity, 0, 1)
                    }}
                    aria-label={hotspot.tooltipText ?? "Hotspot"}
                  >
                    <span aria-hidden="true">•</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <CaptureEntryPanel
              copy={captureModeCopy[captureMode]}
              captureError={captureError}
              captureStatus={captureStatus}
              fileInputRef={fileInputRef}
              onFileChange={handleCaptureFile}
              onOpenFilePicker={() => fileInputRef.current?.click()}
              readOnly={readOnly}
              captureMode={captureMode}
            />
          )}
          {selectedStep && !readOnly ? (
            <CaptureEntryPanel
              compact
              copy={captureModeCopy[captureMode]}
              captureError={captureError}
              captureStatus={captureStatus}
              fileInputRef={fileInputRef}
              onFileChange={handleCaptureFile}
              onOpenFilePicker={() => fileInputRef.current?.click()}
              readOnly={readOnly}
              captureMode={captureMode}
            />
          ) : null}
        </main>

        <aside className="editor-inspector" aria-label="Context Inspector">
          <div className="editor-panel-heading">
            <div>
              <span className="editor-kicker">Inspector</span>
              <strong>
                {selectedHotspot
                  ? "Hotspot properties"
                  : selectedStep
                    ? "Step properties"
                    : "Demo settings"}
              </strong>
            </div>
          </div>
          {selectedHotspot ? (
            <div className="editor-inspector-stack">
              <label className="editor-field">
                <span>Tooltip text</span>
                <input
                  type="text"
                  value={selectedHotspot.tooltipText ?? ""}
                  disabled={readOnly}
                  maxLength={160}
                  onChange={(event) =>
                    updateSelectedHotspot({ tooltipText: event.currentTarget.value })
                  }
                />
              </label>
              <label className="editor-field">
                <span>Destination</span>
                <select
                  value={
                    selectedHotspot.actionType === "open_url"
                      ? URL_DESTINATION_OPTION
                      : (selectedHotspot.targetStepId ?? "")
                  }
                  disabled={readOnly}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (value === URL_DESTINATION_OPTION) {
                      updateSelectedHotspot({
                        actionType: "open_url",
                        targetStepId: null,
                        url: validateSafeUrl(hotspotUrlDraft)
                      });
                      return;
                    }
                    updateSelectedHotspot({
                      actionType: value ? "goto_step" : "next_step",
                      targetStepId: value || null,
                      url: null
                    });
                  }}
                >
                  <option value="">Next step (linear)</option>
                  {document.steps
                    .filter((step) => step.id !== selectedStep?.id)
                    .map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.title}
                      </option>
                    ))}
                  <option value={URL_DESTINATION_OPTION}>Open URL</option>
                </select>
              </label>
              {selectedHotspot.actionType === "open_url" ? (
                <label className="editor-field">
                  <span>Destination URL</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={hotspotUrlDraft}
                    maxLength={2048}
                    placeholder="https://example.com/next-step"
                    aria-invalid={Boolean(hotspotUrlDraft && !validateSafeUrl(hotspotUrlDraft))}
                    onChange={(event) => {
                      const value = event.currentTarget.value.slice(0, 2048);
                      setHotspotUrlDraft(value);
                      updateSelectedHotspot({
                        actionType: "open_url",
                        targetStepId: null,
                        url: validateSafeUrl(value)
                      });
                    }}
                  />
                  <small className="editor-url-help">
                    Use an HTTPS link or a relative path. Unsafe URL schemes are blocked.
                  </small>
                </label>
              ) : null}
              <div className="editor-field-grid">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label className="editor-field" key={field}>
                    <span>{field === "x" || field === "y" ? field.toUpperCase() : field}</span>
                    <input
                      type="number"
                      min={field === "width" || field === "height" ? 5 : 0}
                      max={100}
                      step={1}
                      value={selectedHotspot[field]}
                      disabled={readOnly}
                      onChange={(event) => {
                        const value = clampPercent(
                          Number(event.currentTarget.value),
                          field === "width" || field === "height" ? 5 : 0
                        );
                        if (field === "width" || field === "height") {
                          updateSelectedHotspot({
                            ...resizeHotspot(
                              selectedHotspot,
                              field === "width" ? value : selectedHotspot.width,
                              field === "height" ? value : selectedHotspot.height
                            )
                          });
                        } else {
                          updateSelectedHotspot({ [field]: value });
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
              <label className="editor-field">
                <span>Color</span>
                <input
                  type="color"
                  value={selectedHotspot.style.color}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: { ...selectedHotspot.style, color: event.currentTarget.value }
                    })
                  }
                />
              </label>
              <label className="editor-field">
                <span>Opacity</span>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.1}
                  value={clampPercent(selectedHotspot.style.opacity, 0.2, 1)}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: {
                        ...selectedHotspot.style,
                        opacity: clampPercent(Number(event.currentTarget.value), 0.2, 1)
                      }
                    })
                  }
                />
              </label>
              <label className="editor-checkbox-field">
                <input
                  type="checkbox"
                  checked={selectedHotspot.style.pulse}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: { ...selectedHotspot.style, pulse: event.currentTarget.checked }
                    })
                  }
                />
                <span>Pulse hotspot</span>
              </label>
              <div className="editor-inspector-note">
                <span className="editor-note-dot" aria-hidden="true" />
                Use arrow keys on the selected hotspot to nudge it by 1%.
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className="editor-button editor-button-danger editor-wide-button"
                  onClick={handleDeleteHotspot}
                >
                  Delete hotspot
                </button>
              ) : null}
            </div>
          ) : selectedStep ? (
            <div className="editor-inspector-stack">
              <label className="editor-field">
                <span>Step title</span>
                <input
                  type="text"
                  value={selectedStep.title}
                  disabled={readOnly}
                  maxLength={120}
                  onChange={(event) =>
                    commitDocument({
                      ...document,
                      steps: document.steps.map((step) =>
                        step.id === selectedStep.id
                          ? { ...step, title: event.currentTarget.value }
                          : step
                      )
                    })
                  }
                />
              </label>
              <div className="editor-inspector-note">
                <span className="editor-note-dot" aria-hidden="true" />
                Keep the step focused on one viewer action.
              </div>
              <section className="editor-branch-panel" aria-labelledby="editor-branch-title">
                <div className="editor-branch-heading">
                  <div>
                    <span className="editor-kicker">Chapter paths</span>
                    <strong id="editor-branch-title">Conditional branching</strong>
                  </div>
                  <span className="editor-branch-count">
                    {selectedStep.hotspots.length} path
                    {selectedStep.hotspots.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p>Give viewers multiple buttons to choose a relevant path inside this demo.</p>
                {selectedStep.hotspots.length > 0 ? (
                  <div className="editor-branch-list" aria-label="Branch choices">
                    {selectedStep.hotspots.map((hotspot, index) => {
                      const target = document.steps.find(
                        (step) => step.id === hotspot.targetStepId
                      );
                      const destination =
                        hotspot.actionType === "open_url"
                          ? hotspot.url || "External URL"
                          : (target?.title ?? "Next step (linear)");
                      return (
                        <button
                          key={hotspot.id}
                          type="button"
                          className="editor-branch-choice"
                          onClick={() => setSelectedHotspotId(hotspot.id)}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{hotspot.tooltipText || "Untitled path"}</strong>
                          <small>{destination}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <small className="editor-branch-empty">
                    No choices yet. The viewer will follow the linear path.
                  </small>
                )}
                {branchSummary.diagnostics.length > 0 ? (
                  <p className="editor-branch-warning" role="status">
                    {branchSummary.diagnostics.length} path issue
                    {branchSummary.diagnostics.length === 1 ? "" : "s"} to review before publishing.
                  </p>
                ) : null}
                {!readOnly ? (
                  <button
                    type="button"
                    className="editor-small-button editor-branch-add"
                    onClick={handleAddBranchChoice}
                  >
                    + Add branch choice
                  </button>
                ) : null}
              </section>
              {!readOnly ? (
                <>
                  <button
                    type="button"
                    className="editor-button editor-button-primary editor-wide-button"
                    onClick={handleAddHotspot}
                  >
                    + Add hotspot
                  </button>
                  <div className="editor-step-actions" aria-label="Step actions">
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={() => handleMoveStep("up")}
                      disabled={
                        document.steps.findIndex((step) => step.id === selectedStep.id) === 0
                      }
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={() => handleMoveStep("down")}
                      disabled={
                        document.steps.findIndex((step) => step.id === selectedStep.id) ===
                        document.steps.length - 1
                      }
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={handleDuplicateStep}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="editor-small-button editor-button-danger"
                      onClick={handleDeleteStep}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="editor-empty-state">Select a step or hotspot to edit its properties.</p>
          )}
        </aside>
      </div>
      <SharePanel
        open={shareOpen}
        initialTab={shareInitialTab}
        demoId={demoId}
        demoDocument={document}
        readOnly={readOnly}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
