"use client";

import {
  parseDemoDocument,
  type DemoDocument,
  type DemoHotspot,
  validateSafeUrl
} from "@supademo/domain";
import { useEffect, useMemo, useState } from "react";

function safeMediaUrl(value: string): string | null {
  if (value.startsWith("blob:")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function readStoredDocument(demoId: string): DemoDocument | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(`supademo_published_${demoId}`) ??
      localStorage.getItem(`supademo_draft_${demoId}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "document" in parsed) {
      return parseDemoDocument((parsed as { document: unknown }).document);
    }
    return parseDemoDocument(parsed);
  } catch {
    return null;
  }
}

function recordViewerEvent(demoId: string, stepId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const query = new URLSearchParams(globalThis.location?.search ?? "");
    const ref =
      query
        .get("ref")
        ?.replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 64) ?? null;
    const key = `supademo_view_events_${demoId}`;
    const current = JSON.parse(localStorage.getItem(key) ?? "[]");
    const events = Array.isArray(current) ? current.slice(-99) : [];
    events.push({ stepId, ref, viewedAtIso: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // Viewer analytics are best effort and never block playback.
  }
}

export function DemoViewer({
  demoId,
  initialDocument
}: {
  demoId: string;
  initialDocument: DemoDocument;
}) {
  const [demoDocument, setDemoDocument] = useState<DemoDocument>(initialDocument);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    const stored = readStoredDocument(demoId);
    if (stored) setDemoDocument(stored);
    setLoadedFromStorage(true);
  }, [demoId]);

  const step = demoDocument.steps[currentIndex] ?? null;
  const mediaUrl = step?.media ? safeMediaUrl(step.media.storagePath) : null;
  const progress = useMemo(
    () =>
      demoDocument.steps.length === 0
        ? 0
        : Math.round(((currentIndex + 1) / demoDocument.steps.length) * 100),
    [currentIndex, demoDocument.steps.length]
  );

  const goToStep = (nextIndex: number): void => {
    const bounded = Math.max(0, Math.min(demoDocument.steps.length - 1, nextIndex));
    const nextStep = demoDocument.steps[bounded];
    if (!nextStep) return;
    setCurrentIndex(bounded);
    recordViewerEvent(demoId, nextStep.id);
  };

  const goNext = (): void => {
    if (!step) return;
    const last = currentIndex >= demoDocument.steps.length - 1;
    goToStep(last ? 0 : currentIndex + 1);
  };

  const goHotspot = (hotspot: DemoHotspot): void => {
    if (hotspot.actionType === "open_url") {
      const safeUrl = validateSafeUrl(hotspot.url);
      if (safeUrl) {
        globalThis.location.assign(safeUrl);
        return;
      }
    }
    if (!hotspot.targetStepId) {
      goNext();
      return;
    }
    const targetIndex = demoDocument.steps.findIndex(
      (candidate) => candidate.id === hotspot.targetStepId
    );
    goToStep(targetIndex >= 0 ? targetIndex : currentIndex + 1);
  };

  return (
    <main className="demo-viewer-shell">
      <header className="demo-viewer-topbar">
        <a className="demo-viewer-brand" href="/demos">
          <span aria-hidden="true">S</span> Supademo
        </a>
        <span className="demo-viewer-mode">Viewer preview</span>
        <a className="demo-viewer-exit" href={`/demos/${encodeURIComponent(demoId)}/edit`}>
          Back to editor
        </a>
      </header>

      {!loadedFromStorage ? (
        <div className="demo-viewer-empty" role="status">
          Loading demo…
        </div>
      ) : !step ? (
        <div className="demo-viewer-empty">
          <strong>This demo has no published screens yet.</strong>
          <p>Return to the editor, add a capture, and publish it before sharing the viewer link.</p>
          <a
            className="editor-button editor-button-primary"
            href={`/demos/${encodeURIComponent(demoId)}/edit`}
          >
            Return to editor
          </a>
        </div>
      ) : (
        <div className="demo-viewer-layout">
          <aside className="demo-viewer-steps" aria-label="Viewer steps">
            <span className="editor-kicker">Interactive demo</span>
            <strong>{demoDocument.steps.length} screens</strong>
            <div className="demo-viewer-progress" aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            {demoDocument.settings.showStepList
              ? demoDocument.steps.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={index === currentIndex ? "is-active" : ""}
                    onClick={() => goToStep(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{candidate.title}</strong>
                  </button>
                ))
              : null}
          </aside>
          <section className="demo-viewer-stage" aria-label="Demo viewer">
            <div className="demo-viewer-frame">
              {mediaUrl && step.media?.assetType === "video" ? (
                <video src={mediaUrl} controls playsInline aria-label={step.title} />
              ) : mediaUrl ? (
                <img src={mediaUrl} alt={step.title} />
              ) : (
                <div className="demo-viewer-placeholder">
                  <span aria-hidden="true">▦</span>
                  <strong>{step.title}</strong>
                  <small>Media is available after the capture is uploaded.</small>
                </div>
              )}
              {step.hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  type="button"
                  className="demo-viewer-hotspot"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                    backgroundColor: hotspot.style.color,
                    opacity: Math.max(0.2, Math.min(1, hotspot.style.opacity))
                  }}
                  onClick={() => goHotspot(hotspot)}
                  aria-label={hotspot.tooltipText ?? "Continue"}
                >
                  {hotspot.tooltipText ?? "Continue"}
                </button>
              ))}
            </div>
            <div className="demo-viewer-controls">
              <button
                type="button"
                className="editor-button editor-button-secondary"
                onClick={() => goToStep(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              <span aria-live="polite">
                Step {currentIndex + 1} of {demoDocument.steps.length}
              </span>
              <button
                type="button"
                className="editor-button editor-button-primary"
                onClick={goNext}
              >
                {currentIndex === demoDocument.steps.length - 1 ? "Restart" : "Next step"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
