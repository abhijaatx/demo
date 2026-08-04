"use client";

import { validateCropMetadata, type CropMetadata } from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type FitMode = "cover" | "contain";
type CropStep = {
  id: string;
  name: string;
  url: string;
  mediaType: "image" | "video";
  crop: CropMetadata;
  fit: FitMode;
};

const MAX_ASSETS = 8;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_BYTES = 1_200_000;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);
const DEFAULT_CROP: CropMetadata = Object.freeze({ x: 0, y: 0, width: 100, height: 100 });

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function rounded(value: number): number {
  return Number(value.toFixed(2));
}

function boundedCrop(input: Partial<CropMetadata>): CropMetadata {
  const base = validateCropMetadata({ ...DEFAULT_CROP, ...input }) ?? DEFAULT_CROP;
  const width = clamp(rounded(base.width), 1, 100);
  const height = clamp(rounded(base.height), 1, 100);
  return {
    x: rounded(clamp(base.x, 0, 100 - width)),
    y: rounded(clamp(base.y, 0, 100 - height)),
    width,
    height
  };
}

function fileType(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

export function CropMediaWorkbench() {
  const objectUrlsRef = useRef(new Map<string, string>());
  const [steps, setSteps] = useState<CropStep[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aspectPreset, setAspectPreset] = useState("free");
  const [message, setMessage] = useState(
    "Choose one or more screenshots or videos to standardize their framing."
  );
  const [error, setError] = useState("");

  const selectedStep = steps.find((step) => step.id === selectedId) ?? null;
  const selectedIndex = selectedStep ? steps.findIndex((step) => step.id === selectedStep.id) : -1;

  const revokeStepUrl = (id: string) => {
    const url = objectUrlsRef.current.get(id);
    if (url) URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(id);
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setError("");
    if (!files.length) return;
    const remaining = Math.max(0, MAX_ASSETS - steps.length);
    if (!remaining) {
      setError(`You can crop up to ${String(MAX_ASSETS)} media steps at once.`);
      return;
    }
    const accepted: CropStep[] = [];
    for (const [index, file] of files.slice(0, remaining).entries()) {
      if (!ALLOWED_TYPES.has(file.type)) continue;
      if (
        file.size > MAX_FILE_BYTES ||
        (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES)
      ) {
        setError("Images must be 1.2 MB or smaller; videos must be 12 MB or smaller.");
        continue;
      }
      const id = `crop-step-${Date.now()}-${index}`;
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.set(id, url);
      const safeName = Array.from(file.name.normalize("NFC"))
        .map((character) => (character.charCodeAt(0) < 32 ? " " : character))
        .join("")
        .slice(0, 120);
      accepted.push({
        id,
        name: safeName,
        url,
        mediaType: fileType(file),
        crop: DEFAULT_CROP,
        fit: "contain"
      });
    }
    if (!accepted.length) {
      setError("Choose PNG, JPEG, WebP, MP4, WebM, or QuickTime files.");
      return;
    }
    setSteps((current) => [...current, ...accepted]);
    setSelectedId((current) => current ?? accepted[0]?.id ?? null);
    setMessage(
      "Select a step, adjust its crop or fit, then apply the same framing to other steps if needed."
    );
  };

  const updateSelected = (patch: Partial<CropStep>) => {
    if (!selectedStep) return;
    setSteps((current) =>
      current.map((step) => (step.id === selectedStep.id ? { ...step, ...patch } : step))
    );
  };

  const updateCrop = (patch: Partial<CropMetadata>) => {
    if (!selectedStep) return;
    updateSelected({ crop: boundedCrop({ ...selectedStep.crop, ...patch }) });
    setAspectPreset("free");
  };

  const applyAspectPreset = (value: string) => {
    setAspectPreset(value);
    if (!selectedStep || value === "free") return;
    const [width, height] = value.split(":").map(Number);
    const target = width / height;
    const current = selectedStep.crop.width / selectedStep.crop.height;
    if (!Number.isFinite(target) || !Number.isFinite(current)) return;
    if (current > target) {
      const nextWidth = selectedStep.crop.height * target;
      updateCrop({
        x: (100 - nextWidth) / 2,
        width: nextWidth
      });
    } else {
      const nextHeight = selectedStep.crop.width / target;
      updateCrop({
        y: (100 - nextHeight) / 2,
        height: nextHeight
      });
    }
  };

  const applyToOtherSteps = () => {
    if (!selectedStep) return;
    setSteps((current) =>
      current.map((step) =>
        step.id === selectedStep.id
          ? step
          : {
              ...step,
              crop: { ...selectedStep.crop },
              fit: selectedStep.fit
            }
      )
    );
    setMessage(
      `Applied this crop and ${selectedStep.fit} alignment to ${String(Math.max(0, steps.length - 1))} other step(s).`
    );
  };

  const removeStep = (id: string) => {
    revokeStepUrl(id);
    const next = steps.filter((step) => step.id !== id);
    setSteps(next);
    setSelectedId((current) => (current === id ? (next[0]?.id ?? null) : current));
  };

  const downloadPlan = () => {
    if (!steps.length) {
      setError("Add at least one media step before exporting a crop plan.");
      return;
    }
    const payload = steps.map(({ id, name, mediaType, crop, fit }) => ({
      id,
      name,
      mediaType,
      crop,
      fit
    }));
    const blob = new Blob([JSON.stringify({ steps: payload }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supademo-crop-plan.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Crop plan downloaded. Apply it to the selected demo steps when you save.");
    setError("");
  };

  useEffect(() => {
    return () => {
      for (const id of objectUrlsRef.current.keys()) revokeStepUrl(id);
    };
  }, []);

  const previewStyle = useMemo(() => {
    if (!selectedStep) return undefined;
    const crop = selectedStep.crop;
    return {
      objectFit: selectedStep.fit,
      objectPosition: `${rounded(crop.x + crop.width / 2)}% ${rounded(crop.y + crop.height / 2)}%`,
      transform: `scale(${Math.max(1, rounded(100 / Math.min(crop.width, crop.height)))})`
    } as const;
  }, [selectedStep]);

  return (
    <main className="crop-media-page">
      <header className="crop-media-header">
        <a className="crop-media-back" href="/upload">
          ← Back to uploads
        </a>
        <p className="eyebrow">Customize · Crop media</p>
        <h1>Make every demo step fit together</h1>
        <p>
          Crop screenshots and videos to a consistent frame, choose Cover or Contain alignment, and
          apply the same treatment to the rest of the demo.
        </p>
      </header>

      <section className="crop-media-upload" aria-labelledby="crop-media-upload-heading">
        <div>
          <p className="eyebrow">1 · Choose steps</p>
          <h2 id="crop-media-upload-heading">Add screenshots or videos</h2>
          <p>Up to 8 local assets. Images are capped at 1.2 MB and videos at 12 MB.</p>
        </div>
        <label className="crop-media-file-button">
          {steps.length ? "Add more media" : "Choose media"}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFiles}
          />
        </label>
      </section>

      <section className="crop-media-workspace" aria-labelledby="crop-media-editor-heading">
        <div className="crop-media-step-list">
          <div className="crop-media-section-heading">
            <div>
              <p className="eyebrow">2 · Select a step</p>
              <h2 id="crop-media-editor-heading">Media steps</h2>
            </div>
            <span>
              {steps.length} / {MAX_ASSETS}
            </span>
          </div>
          {steps.length ? (
            <ol>
              {steps.map((step, index) => (
                <li key={step.id} className={step.id === selectedId ? "is-selected" : ""}>
                  <button type="button" onClick={() => setSelectedId(step.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step.name}</strong>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${step.name}`}
                    onClick={() => removeStep(step.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="crop-media-empty">Your selected media steps will appear here.</p>
          )}
        </div>

        <div className="crop-media-inspector" aria-label="Crop and alignment controls">
          {selectedStep ? (
            <>
              <div
                className="crop-media-preview-frame"
                style={{
                  aspectRatio: aspectPreset === "free" ? "16 / 9" : aspectPreset.replace(":", " / ")
                }}
              >
                {selectedStep.mediaType === "video" ? (
                  <video
                    src={selectedStep.url}
                    controls
                    playsInline
                    style={previewStyle}
                    aria-label={`${selectedStep.name} preview`}
                  />
                ) : (
                  <img
                    src={selectedStep.url}
                    alt={`${selectedStep.name} crop preview`}
                    style={previewStyle}
                  />
                )}
              </div>
              <div className="crop-media-controls">
                <label>
                  Aspect ratio
                  <select
                    value={aspectPreset}
                    onChange={(event) => applyAspectPreset(event.currentTarget.value)}
                  >
                    <option value="free">Free crop</option>
                    <option value="16:9">16:9</option>
                    <option value="4:3">4:3</option>
                    <option value="1:1">1:1</option>
                    <option value="9:16">9:16</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Media fit</legend>
                  <label>
                    <input
                      type="radio"
                      name="fit-mode"
                      checked={selectedStep.fit === "cover"}
                      onChange={() => updateSelected({ fit: "cover" })}
                    />{" "}
                    Cover
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="fit-mode"
                      checked={selectedStep.fit === "contain"}
                      onChange={() => updateSelected({ fit: "contain" })}
                    />{" "}
                    Contain
                  </label>
                </fieldset>
                <div className="crop-media-grid-fields">
                  {(["x", "y", "width", "height"] as const).map((key) => (
                    <label key={key}>
                      {key === "x"
                        ? "Left"
                        : key === "y"
                          ? "Top"
                          : key === "width"
                            ? "Width"
                            : "Height"}{" "}
                      (%)
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={selectedStep.crop[key]}
                        onChange={(event) =>
                          updateCrop({ [key]: Number(event.currentTarget.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="crop-media-actions">
                <button type="button" className="crop-media-primary" onClick={applyToOtherSteps}>
                  Apply to other steps
                </button>
                <span>
                  {selectedIndex + 1} of {steps.length} selected
                </span>
              </div>
            </>
          ) : (
            <p className="crop-media-empty">Choose a media step to open the crop tool.</p>
          )}
        </div>
      </section>

      {error ? (
        <p className="crop-media-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="crop-media-status" role="status" aria-live="polite">
        {message}
      </p>
      <section className="crop-media-export" aria-labelledby="crop-media-export-heading">
        <div>
          <p className="eyebrow">3 · Save</p>
          <h2 id="crop-media-export-heading">Keep the original media safe</h2>
          <p>
            Download a bounded crop plan. It records metadata only and never overwrites your source
            files.
          </p>
        </div>
        <button type="button" onClick={downloadPlan}>
          Download crop plan
        </button>
      </section>
    </main>
  );
}
