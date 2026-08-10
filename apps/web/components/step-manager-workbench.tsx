"use client";

import {
  deleteSteps,
  duplicateStep,
  reorderSteps,
  type DemoStep,
  type DemoStepMedia
} from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_STEPS = 100;
const MAX_TITLE_LENGTH = 120;
const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

type ImportMode = "add" | "replace";

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function safeFileName(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function createBlankStep(index: number): DemoStep {
  return {
    id: makeId("step"),
    orderIndex: index,
    title: `Step ${index + 1}`,
    description: null,
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
}

function createMedia(file: File, url: string): DemoStepMedia {
  return {
    assetId: makeId("asset"),
    assetType: file.type.startsWith("video/") ? "video" : "screenshot",
    storagePath: url,
    width: null,
    height: null,
    durationSeconds: null,
    posterPath: null
  };
}

function normalizeSteps(steps: readonly DemoStep[]): readonly DemoStep[] {
  return steps.map((step, index) => ({ ...step, orderIndex: index }));
}

function moveSelected(
  steps: readonly DemoStep[],
  selectedIds: ReadonlySet<string>,
  direction: "up" | "down"
): readonly DemoStep[] {
  let next = [...steps];
  const indices = next
    .map((step, index) => (selectedIds.has(step.id) ? index : -1))
    .filter((index) => index >= 0);
  if (direction === "up") {
    for (const index of indices) {
      if (index <= 0 || selectedIds.has(next[index - 1]!.id)) continue;
      next = [...reorderSteps(next, index, index - 1)];
    }
  } else {
    for (const index of [...indices].reverse()) {
      if (index >= next.length - 1 || selectedIds.has(next[index + 1]!.id)) continue;
      next = [...reorderSteps(next, index, index + 1)];
    }
  }
  return normalizeSteps(next);
}

export function StepManagerWorkbench() {
  const [steps, setSteps] = useState<readonly DemoStep[]>([
    createBlankStep(0),
    createBlankStep(1),
    createBlankStep(2)
  ]);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("add");
  const [message, setMessage] = useState("Select one or more steps to manage your storyboard.");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedSteps = useMemo(
    () => steps.filter((step) => selectedSet.has(step.id)),
    [selectedSet, steps]
  );
  const selectedOne = selectedSteps.length === 1 ? selectedSteps[0] : null;

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
      objectUrlsRef.current.clear();
    };
  }, []);

  const updateSteps = (next: readonly DemoStep[]) => {
    setSteps(normalizeSteps(next));
    setError("");
  };

  const addBlankStep = () => {
    if (steps.length >= MAX_STEPS) {
      setError(`A demo can contain up to ${String(MAX_STEPS)} steps.`);
      return;
    }
    const next = createBlankStep(steps.length);
    updateSteps([...steps, next]);
    setSelectedIds([next.id]);
    setMessage(`${next.title} added.`);
  };

  const openFilePicker = (mode: ImportMode) => {
    setImportMode(mode);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, WebP, MP4, WebM, or QuickTime file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Media files must be 100 MB or smaller.");
      return;
    }
    if (importMode === "replace" && !selectedOne) {
      setError("Select exactly one step before replacing its media.");
      return;
    }
    if (importMode === "add" && steps.length >= MAX_STEPS) {
      setError(`A demo can contain up to ${String(MAX_STEPS)} steps.`);
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    const media = createMedia(file, url);
    const name = safeFileName(file.name) || "Imported media";
    if (importMode === "replace" && selectedOne) {
      const previousPath = selectedOne.media?.storagePath;
      if (previousPath && objectUrlsRef.current.has(previousPath)) {
        URL.revokeObjectURL(previousPath);
        objectUrlsRef.current.delete(previousPath);
      }
      updateSteps(
        steps.map((step) =>
          step.id === selectedOne.id
            ? { ...step, title: name.slice(0, MAX_TITLE_LENGTH), media }
            : step
        )
      );
      setMessage(`Media replaced on ${selectedOne.title}.`);
      return;
    }

    const nextStep: DemoStep = {
      ...createBlankStep(steps.length),
      title: name.slice(0, MAX_TITLE_LENGTH),
      description: media.assetType === "video" ? "Imported video walkthrough." : null,
      media
    };
    updateSteps([...steps, nextStep]);
    setSelectedIds([nextStep.id]);
    setMessage(`${name} added as step ${String(steps.length + 1)}.`);
  };

  const toggleStep = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const duplicateSelected = () => {
    if (!selectedSteps.length) {
      setError("Select at least one step to duplicate.");
      return;
    }
    if (steps.length + selectedSteps.length > MAX_STEPS) {
      setError(`A demo can contain up to ${String(MAX_STEPS)} steps.`);
      return;
    }
    const selected = new Set(selectedIds);
    const duplicates: DemoStep[] = [];
    const next: DemoStep[] = [];
    for (const step of steps) {
      next.push(step);
      if (selected.has(step.id)) {
        const duplicate = duplicateStep(step, next.length);
        duplicates.push(duplicate);
        next.push(duplicate);
      }
    }
    updateSteps(next);
    setSelectedIds(duplicates.map((step) => step.id));
    setMessage(
      `${String(duplicates.length)} step${duplicates.length === 1 ? "" : "s"} duplicated.`
    );
  };

  const deleteSelected = () => {
    if (!selectedSteps.length) {
      setError("Select at least one step to delete.");
      return;
    }
    for (const step of selectedSteps) {
      const path = step.media?.storagePath;
      if (path && objectUrlsRef.current.has(path)) {
        URL.revokeObjectURL(path);
        objectUrlsRef.current.delete(path);
      }
    }
    updateSteps(deleteSteps(steps, selectedSet));
    setSelectedIds([]);
    setMessage(
      `${String(selectedSteps.length)} step${selectedSteps.length === 1 ? "" : "s"} deleted.`
    );
  };

  const move = (direction: "up" | "down") => {
    if (!selectedSteps.length) {
      setError("Select one or more steps to move.");
      return;
    }
    updateSteps(moveSelected(steps, selectedSet, direction));
    setMessage(`Selected step${selectedSteps.length === 1 ? "" : "s"} moved ${direction}.`);
  };

  const updateTitle = (id: string, title: string) => {
    setSteps((current) =>
      normalizeSteps(
        current.map((step) =>
          step.id === id ? { ...step, title: title.slice(0, MAX_TITLE_LENGTH) } : step
        )
      )
    );
  };

  const downloadPlan = () => {
    const payload = {
      version: 1,
      steps: steps.map((step) => ({
        id: step.id,
        orderIndex: step.orderIndex,
        title: step.title,
        media: step.media ? { assetType: step.media.assetType, assetId: step.media.assetId } : null
      }))
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "supademo-step-plan.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Step plan downloaded. The source media stays local to this browser.");
  };

  return (
    <main className="step-manager-page">
      <header className="step-manager-header">
        <a className="step-manager-back" href="/demos">
          ← Back to demos
        </a>
        <p className="eyebrow">Edit · Step manager</p>
        <h1>Build the story one step at a time</h1>
        <p>
          Add, replace, duplicate, delete, or reorder screens without losing the shape of your demo.
          Select several steps for a single bulk action.
        </p>
      </header>

      <section className="step-manager-toolbar" aria-label="Step actions">
        <div className="step-manager-toolbar-primary">
          <button type="button" className="step-manager-primary" onClick={addBlankStep}>
            + Add blank step
          </button>
          <button
            type="button"
            className="step-manager-secondary"
            onClick={() => openFilePicker("add")}
          >
            Import media as step
          </button>
          <input
            ref={fileInputRef}
            className="step-manager-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            aria-label="Choose step media"
          />
        </div>
        <div className="step-manager-toolbar-actions">
          <button
            type="button"
            className="step-manager-secondary"
            disabled={!selectedOne}
            onClick={() => openFilePicker("replace")}
          >
            Replace selected media
          </button>
          <button
            type="button"
            className="step-manager-secondary"
            disabled={!selectedSteps.length}
            onClick={duplicateSelected}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="step-manager-secondary"
            disabled={!selectedSteps.length}
            onClick={() => move("up")}
          >
            Move up
          </button>
          <button
            type="button"
            className="step-manager-secondary"
            disabled={!selectedSteps.length}
            onClick={() => move("down")}
          >
            Move down
          </button>
          <button
            type="button"
            className="step-manager-danger"
            disabled={!selectedSteps.length}
            onClick={deleteSelected}
          >
            Delete
          </button>
        </div>
      </section>

      <div className="step-manager-feedback">
        <span role="status">{message}</span>
        {error ? (
          <span className="step-manager-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>

      <section className="step-manager-layout">
        <div className="step-manager-list-panel">
          <div className="step-manager-panel-heading">
            <div>
              <p className="eyebrow">Storyboard</p>
              <h2>{String(steps.length)} steps</h2>
            </div>
            <span className="step-manager-selection-count">
              {String(selectedSteps.length)} selected
            </span>
          </div>
          <div
            className="step-manager-list"
            role="listbox"
            aria-label="Demo steps"
            aria-multiselectable="true"
          >
            {steps.map((step, index) => {
              const selected = selectedSet.has(step.id);
              return (
                <article
                  className={`step-manager-card${selected ? " is-selected" : ""}`}
                  key={step.id}
                >
                  <label className="step-manager-card-select">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStep(step.id)}
                      aria-label={`Select step ${String(index + 1)}`}
                    />
                    <span className="step-manager-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="step-manager-preview"
                    onClick={() => toggleStep(step.id)}
                    aria-label={`Open step ${String(index + 1)}`}
                  >
                    {step.media?.assetType === "video" ? (
                      <video src={step.media.storagePath} muted playsInline />
                    ) : step.media ? (
                      <img src={step.media.storagePath} alt="" />
                    ) : (
                      <span className="step-manager-placeholder" aria-hidden="true">
                        ▦
                      </span>
                    )}
                  </button>
                  <div className="step-manager-card-copy">
                    <input
                      type="text"
                      value={step.title}
                      maxLength={MAX_TITLE_LENGTH}
                      aria-label={`Step ${String(index + 1)} title`}
                      onChange={(event) => updateTitle(step.id, event.currentTarget.value)}
                    />
                    <small>{step.media ? `${step.media.assetType} media` : "No media yet"}</small>
                  </div>
                </article>
              );
            })}
          </div>
          {!steps.length ? (
            <p className="step-manager-empty">Add a blank step or import a screen to begin.</p>
          ) : null}
        </div>

        <aside className="step-manager-inspector" aria-label="Step manager inspector">
          <div className="step-manager-panel-heading">
            <div>
              <p className="eyebrow">Selection</p>
              <h2>
                {selectedSteps.length
                  ? `${String(selectedSteps.length)} selected`
                  : "Nothing selected"}
              </h2>
            </div>
          </div>
          {selectedSteps.length ? (
            <div className="step-manager-selection-summary">
              <p>Bulk actions keep the selected steps together and preserve their order.</p>
              <ul>
                {selectedSteps.slice(0, 8).map((step) => (
                  <li key={step.id}>{step.title}</li>
                ))}
              </ul>
              {selectedSteps.length > 8 ? (
                <small>+ {String(selectedSteps.length - 8)} more</small>
              ) : null}
            </div>
          ) : (
            <p className="step-manager-empty">
              Choose a step to replace its media or several steps to run a bulk action.
            </p>
          )}
          <button type="button" className="step-manager-download" onClick={downloadPlan}>
            Download step plan
          </button>
          <p className="step-manager-note">
            The downloaded plan contains ordering and media type only. Source files never leave this
            browser.
          </p>
        </aside>
      </section>
    </main>
  );
}
