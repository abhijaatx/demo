"use client";

import type { DemoDocument, DemoStep, DemoHotspot } from "@supademo/domain";
import { useState } from "react";

export interface EditorShellProps {
  demoId: string;
  initialDocument: DemoDocument;
  readOnly?: boolean;
  saveState?: "saved" | "saving" | "offline" | "conflict" | "error";
  onSaveDocument?: (doc: DemoDocument) => Promise<void>;
  onPreview?: () => void;
  onShare?: () => void;
}

export function EditorShell({
  demoId,
  initialDocument,
  readOnly = false,
  saveState = "saved",
  onSaveDocument,
  onPreview,
  onShare
}: EditorShellProps) {
  const [document, setDocument] = useState<DemoDocument>(initialDocument);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialDocument.steps[0]?.id ?? null
  );
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  const selectedStep = document.steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedHotspot = selectedStep?.hotspots.find((h) => h.id === selectedHotspotId) ?? null;

  const handleTitleChange = (newTitle: string) => {
    if (readOnly) return;
    const updatedSteps = document.steps[0]
      ? [{ ...document.steps[0], title: newTitle }, ...document.steps.slice(1)]
      : document.steps;
    const updated: DemoDocument = {
      ...document,
      demoId,
      steps: updatedSteps,
      updatedAtIso: new Date().toISOString()
    };
    setDocument(updated);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const handleAddStep = () => {
    if (readOnly) return;
    const newStepId = `step-${Date.now()}`;
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
    const updated: DemoDocument = {
      ...document,
      steps: [...document.steps, newStep],
      updatedAtIso: new Date().toISOString()
    };
    setDocument(updated);
    setSelectedStepId(newStepId);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const handleAddHotspot = () => {
    if (readOnly || !selectedStep) return;
    const newHotspotId = `hotspot-${Date.now()}`;
    const newHotspot: DemoHotspot = {
      id: newHotspotId,
      x: 40,
      y: 40,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Click to continue",
      style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
    };
    const updatedSteps = document.steps.map((s) => {
      if (s.id !== selectedStep.id) return s;
      return { ...s, hotspots: [...s.hotspots, newHotspot] };
    });
    const updated: DemoDocument = {
      ...document,
      steps: updatedSteps,
      updatedAtIso: new Date().toISOString()
    };
    setDocument(updated);
    setSelectedHotspotId(newHotspotId);
    if (onSaveDocument) void onSaveDocument(updated);
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
        <div className="editor-topbar-actions">
          <button
            type="button"
            className="editor-button editor-button-secondary"
            onClick={onPreview}
          >
            Preview
          </button>
          <button type="button" className="editor-button editor-button-primary" onClick={onShare}>
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
                <img src={selectedStep.media.storagePath} alt={selectedStep.title} />
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
                    className={`editor-hotspot${isSelected ? " is-selected" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedHotspotId(hotspot.id);
                    }}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`
                    }}
                    aria-label={hotspot.tooltipText ?? "Hotspot"}
                  >
                    <span aria-hidden="true">•</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="editor-canvas-empty">Select a step to preview its screen.</div>
          )}
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
            <label className="editor-field">
              <span>Tooltip text</span>
              <input
                type="text"
                value={selectedHotspot.tooltipText ?? ""}
                disabled={readOnly}
                onChange={(event) => {
                  const text = event.currentTarget.value;
                  const updatedSteps = document.steps.map((step) =>
                    step.id !== selectedStep?.id
                      ? step
                      : {
                          ...step,
                          hotspots: step.hotspots.map((hotspot) =>
                            hotspot.id === selectedHotspot.id
                              ? { ...hotspot, tooltipText: text }
                              : hotspot
                          )
                        }
                  );
                  setDocument({ ...document, steps: updatedSteps });
                }}
              />
            </label>
          ) : selectedStep ? (
            <div className="editor-inspector-stack">
              <label className="editor-field">
                <span>Step title</span>
                <input
                  type="text"
                  value={selectedStep.title}
                  disabled={readOnly}
                  onChange={(event) => {
                    const title = event.currentTarget.value;
                    setDocument({
                      ...document,
                      steps: document.steps.map((step) =>
                        step.id === selectedStep.id ? { ...step, title } : step
                      )
                    });
                  }}
                />
              </label>
              <div className="editor-inspector-note">
                <span className="editor-note-dot" aria-hidden="true" />
                Keep the step focused on one viewer action.
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className="editor-button editor-button-primary editor-wide-button"
                  onClick={handleAddHotspot}
                >
                  + Add hotspot
                </button>
              ) : null}
            </div>
          ) : (
            <p className="editor-empty-state">Select a step or hotspot to edit its properties.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
