"use client";

import {
  createDefaultAnnotation,
  generateRedactionBurnInManifest,
  sanitizeAnnotationText,
  type AnnotationKind,
  type AnnotationPrimitive,
  type RedactionRegion
} from "@supademo/domain";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_REDACTIONS = 24;
const MAX_ANNOTATIONS = 40;
const MAX_TEXT_LENGTH = 240;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ANNOTATION_KINDS: readonly AnnotationKind[] = [
  "text",
  "callout",
  "arrow",
  "rectangle",
  "ellipse",
  "highlight"
];

type RedactionDraft = RedactionRegion & { intensity: number };

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeRegion(
  region: RedactionDraft,
  patch: Partial<RedactionDraft> = {}
): RedactionDraft {
  const x = clamp(patch.x ?? region.x, 0, 100);
  const y = clamp(patch.y ?? region.y, 0, 100);
  const width = clamp(patch.width ?? region.width, 1, 100 - x);
  const height = clamp(patch.height ?? region.height, 1, 100 - y);
  return {
    ...region,
    ...patch,
    x,
    y,
    width,
    height,
    label: (patch.label ?? region.label ?? "Sensitive area").slice(0, 120),
    intensity: clamp(patch.intensity ?? region.intensity, 0.2, 1)
  };
}

function normalizeAnnotation(
  annotation: AnnotationPrimitive,
  patch: Partial<AnnotationPrimitive> = {}
): AnnotationPrimitive {
  const x = clamp(patch.x ?? annotation.x, 0, 100);
  const y = clamp(patch.y ?? annotation.y, 0, 100);
  return {
    ...annotation,
    ...patch,
    x,
    y,
    width: clamp(patch.width ?? annotation.width, 1, 100 - x),
    height: clamp(patch.height ?? annotation.height, 1, 100 - y),
    text: sanitizeAnnotationText(patch.text ?? annotation.text)?.slice(0, MAX_TEXT_LENGTH) ?? null,
    style: { ...annotation.style, ...(patch.style ?? {}) }
  };
}

export function BlurAnnotateWorkbench() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1280, height: 720 });
  const [redactions, setRedactions] = useState<readonly RedactionDraft[]>([]);
  const [annotations, setAnnotations] = useState<readonly AnnotationPrimitive[]>([]);
  const [selectedRedactionId, setSelectedRedactionId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationKind, setAnnotationKind] = useState<AnnotationKind>("callout");
  const [message, setMessage] = useState(
    "Load a screenshot to blur sensitive information or annotate one key detail."
  );
  const [error, setError] = useState("");
  const imageUrlRef = useRef<string | null>(null);

  const selectedRedaction = redactions.find((region) => region.id === selectedRedactionId) ?? null;
  const selectedAnnotation =
    annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null;

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, or WebP screenshot. Video blur is not supported.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Screenshots must be 12 MB or smaller.");
      return;
    }
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    imageUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
    setFileName(
      file.name
        .replace(/[^a-zA-Z0-9._ -]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120)
    );
    setRedactions([]);
    setAnnotations([]);
    setSelectedRedactionId(null);
    setSelectedAnnotationId(null);
    setError("");
    setMessage(
      "Screenshot loaded. Add a blur or annotation, then adjust its bounds in the inspector."
    );
  };

  const addRedaction = () => {
    if (!imageUrl) {
      setError("Load a screenshot before adding a blur.");
      return;
    }
    if (redactions.length >= MAX_REDACTIONS) {
      setError(`You can add up to ${String(MAX_REDACTIONS)} blur regions.`);
      return;
    }
    const next: RedactionDraft = {
      id: makeId("blur"),
      x: 12 + (redactions.length % 3) * 24,
      y: 14 + (redactions.length % 4) * 16,
      width: 24,
      height: 14,
      label: "Sensitive area",
      isPermanent: false,
      intensity: 0.78
    };
    setRedactions((current) => [...current, next]);
    setSelectedRedactionId(next.id);
    setSelectedAnnotationId(null);
    setMessage(
      "Blur added. Mark it permanent only when you are ready to burn it into the exported asset."
    );
    setError("");
  };

  const addAnnotation = () => {
    if (!imageUrl) {
      setError("Load a screenshot before adding an annotation.");
      return;
    }
    if (annotations.length >= MAX_ANNOTATIONS) {
      setError(`You can add up to ${String(MAX_ANNOTATIONS)} annotations.`);
      return;
    }
    const next = normalizeAnnotation(
      createDefaultAnnotation(
        annotationKind,
        18 + (annotations.length % 3) * 24,
        18 + (annotations.length % 4) * 16
      ),
      {
        text:
          annotationKind === "text" || annotationKind === "callout" ? "Explain this detail" : null,
        style: {
          backgroundColor: annotationKind === "highlight" ? "rgba(251, 191, 36, 0.4)" : "#4f46e5"
        }
      }
    );
    setAnnotations((current) => [...current, next]);
    setSelectedAnnotationId(next.id);
    setSelectedRedactionId(null);
    setMessage(`${annotationKind[0]!.toUpperCase()}${annotationKind.slice(1)} added.`);
    setError("");
  };

  const updateRedaction = (patch: Partial<RedactionDraft>) => {
    if (!selectedRedaction) return;
    setRedactions((current) =>
      current.map((region) =>
        region.id === selectedRedaction.id ? normalizeRegion(region, patch) : region
      )
    );
  };

  const updateAnnotation = (patch: Partial<AnnotationPrimitive>) => {
    if (!selectedAnnotation) return;
    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === selectedAnnotation.id
          ? normalizeAnnotation(annotation, patch)
          : annotation
      )
    );
  };

  const removeSelected = () => {
    if (selectedRedaction) {
      setRedactions((current) => current.filter((region) => region.id !== selectedRedaction.id));
      setSelectedRedactionId(null);
      setMessage("Blur removed.");
      return;
    }
    if (selectedAnnotation) {
      setAnnotations((current) =>
        current.filter((annotation) => annotation.id !== selectedAnnotation.id)
      );
      setSelectedAnnotationId(null);
      setMessage("Annotation removed.");
    }
  };

  const downloadManifest = () => {
    if (!imageUrl) {
      setError("Load a screenshot before downloading an annotation plan.");
      return;
    }
    const manifest = generateRedactionBurnInManifest(
      fileName || "screenshot",
      imageSize.width,
      imageSize.height,
      null,
      redactions
    );
    const payload = {
      version: 1,
      fileName: fileName || "screenshot",
      imageSize,
      redactionManifest: manifest,
      redactions: redactions.map(({ id, x, y, width, height, label, isPermanent, intensity }) => ({
        id,
        x,
        y,
        width,
        height,
        label,
        isPermanent,
        intensity
      })),
      annotations: annotations.map((annotation) => ({
        ...annotation,
        text: sanitizeAnnotationText(annotation.text)
      }))
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "supademo-blur-annotate-plan.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(
      "Blur and annotation plan downloaded. Permanent redactions are listed for burn-in processing."
    );
  };

  return (
    <main className="blur-annotate-page">
      <header className="blur-annotate-header">
        <a className="blur-annotate-back" href="/demos">
          ← Back to demos
        </a>
        <p className="eyebrow">Customize · Blur &amp; annotate</p>
        <h1>Hide sensitive details and point to what matters</h1>
        <p>
          Redact emails, names, and phone numbers on screenshot steps, then add a clear annotation
          for the viewer.
        </p>
      </header>

      <section className="blur-annotate-notice" role="note">
        <strong>Screenshot steps only</strong>
        <span>
          Video blur and video annotations are not supported. Source media remains local until you
          export a plan.
        </span>
        <a href="/crop-media">Need framing changes? Open Crop Media →</a>
      </section>

      <section className="blur-annotate-upload">
        <div>
          <p className="eyebrow">1 · Choose a screenshot</p>
          <h2>{fileName || "Start with a screenshot"}</h2>
          <p>PNG, JPEG, or WebP up to 12 MB.</p>
        </div>
        <label className="blur-annotate-file-button">
          {imageUrl ? "Replace screenshot" : "Choose screenshot"}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
        </label>
      </section>

      <div className="blur-annotate-feedback">
        <span role="status">{message}</span>
        {error ? (
          <span className="blur-annotate-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>

      <section className="blur-annotate-workspace" aria-label="Blur and annotate workspace">
        <div className="blur-annotate-canvas-panel">
          <div className="blur-annotate-canvas-heading">
            <div>
              <p className="eyebrow">2 · Review the screen</p>
              <h2>Preview</h2>
            </div>
            {imageUrl ? (
              <span>
                {imageSize.width} × {imageSize.height}px
              </span>
            ) : null}
          </div>
          <div className="blur-annotate-canvas">
            {imageUrl ? (
              <div className="blur-annotate-image-wrap">
                <img
                  src={imageUrl}
                  alt={fileName || "Screenshot preview"}
                  onLoad={(event) =>
                    setImageSize({
                      width: event.currentTarget.naturalWidth || 1280,
                      height: event.currentTarget.naturalHeight || 720
                    })
                  }
                />
                {redactions.map((region) => (
                  <button
                    type="button"
                    key={region.id}
                    className={`blur-annotate-redaction${selectedRedactionId === region.id ? " is-selected" : ""}`}
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      width: `${region.width}%`,
                      height: `${region.height}%`,
                      opacity: region.intensity
                    }}
                    onClick={() => {
                      setSelectedRedactionId(region.id);
                      setSelectedAnnotationId(null);
                    }}
                    aria-label={`Blur ${region.label || "sensitive area"}`}
                  >
                    <span>Blur</span>
                  </button>
                ))}
                {annotations.map((annotation) => (
                  <button
                    type="button"
                    key={annotation.id}
                    className={`blur-annotate-annotation blur-annotate-annotation-${annotation.kind}${selectedAnnotationId === annotation.id ? " is-selected" : ""}`}
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                      width: `${annotation.width}%`,
                      height: `${annotation.height}%`,
                      backgroundColor: annotation.style.backgroundColor,
                      color: annotation.style.textColor
                    }}
                    onClick={() => {
                      setSelectedAnnotationId(annotation.id);
                      setSelectedRedactionId(null);
                    }}
                    aria-label={`${annotation.kind} annotation`}
                  >
                    {annotation.text || annotation.kind}
                  </button>
                ))}
              </div>
            ) : (
              <div className="blur-annotate-empty">Your screenshot preview appears here.</div>
            )}
          </div>
        </div>

        <aside className="blur-annotate-inspector" aria-label="Blur and annotation inspector">
          <div className="blur-annotate-inspector-heading">
            <div>
              <p className="eyebrow">3 · Add guidance</p>
              <h2>Tools</h2>
            </div>
          </div>
          <div className="blur-annotate-tool-row">
            <button type="button" className="blur-annotate-primary" onClick={addRedaction}>
              + Add blur
            </button>
            <select
              value={annotationKind}
              onChange={(event) => setAnnotationKind(event.currentTarget.value as AnnotationKind)}
              aria-label="Annotation type"
            >
              {ANNOTATION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind[0]!.toUpperCase()}
                  {kind.slice(1)}
                </option>
              ))}
            </select>
            <button type="button" className="blur-annotate-secondary" onClick={addAnnotation}>
              Add annotation
            </button>
          </div>

          {selectedRedaction ? (
            <div className="blur-annotate-fields">
              <p className="eyebrow">Selected blur</p>
              <label>
                Label
                <input
                  value={selectedRedaction.label ?? ""}
                  maxLength={120}
                  onChange={(event) => updateRedaction({ label: event.currentTarget.value })}
                />
              </label>
              <div className="blur-annotate-field-grid">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label key={field}>
                    {field.toUpperCase()}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={selectedRedaction[field]}
                      onChange={(event) =>
                        updateRedaction({ [field]: Number(event.currentTarget.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                Blur intensity
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={selectedRedaction.intensity}
                  onChange={(event) =>
                    updateRedaction({ intensity: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label className="blur-annotate-check">
                <input
                  type="checkbox"
                  checked={selectedRedaction.isPermanent}
                  onChange={(event) =>
                    updateRedaction({ isPermanent: event.currentTarget.checked })
                  }
                />{" "}
                Burn this redaction into the published asset
              </label>
              <button type="button" className="blur-annotate-danger" onClick={removeSelected}>
                Remove blur
              </button>
            </div>
          ) : selectedAnnotation ? (
            <div className="blur-annotate-fields">
              <p className="eyebrow">Selected annotation</p>
              <label>
                Text
                <input
                  value={selectedAnnotation.text ?? ""}
                  maxLength={MAX_TEXT_LENGTH}
                  onChange={(event) => updateAnnotation({ text: event.currentTarget.value })}
                />
              </label>
              <div className="blur-annotate-field-grid">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label key={field}>
                    {field.toUpperCase()}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={selectedAnnotation[field]}
                      onChange={(event) =>
                        updateAnnotation({ [field]: Number(event.currentTarget.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                Color
                <input
                  type="color"
                  value={
                    selectedAnnotation.style.backgroundColor?.startsWith("#")
                      ? selectedAnnotation.style.backgroundColor
                      : "#4f46e5"
                  }
                  onChange={(event) =>
                    updateAnnotation({
                      style: {
                        ...selectedAnnotation.style,
                        backgroundColor: event.currentTarget.value
                      }
                    })
                  }
                />
              </label>
              <button type="button" className="blur-annotate-danger" onClick={removeSelected}>
                Remove annotation
              </button>
            </div>
          ) : (
            <p className="blur-annotate-empty-note">
              Select a blur or annotation on the canvas to edit its bounds.
            </p>
          )}

          <div className="blur-annotate-layers">
            <div className="blur-annotate-layer-heading">
              <strong>Layers</strong>
              <span>{redactions.length + annotations.length}</span>
            </div>
            {redactions.map((region, index) => (
              <button
                type="button"
                key={region.id}
                className={selectedRedactionId === region.id ? "is-selected" : ""}
                onClick={() => {
                  setSelectedRedactionId(region.id);
                  setSelectedAnnotationId(null);
                }}
              >
                Blur {String(index + 1)}
                {region.isPermanent ? " · permanent" : ""}
              </button>
            ))}
            {annotations.map((annotation, index) => (
              <button
                type="button"
                key={annotation.id}
                className={selectedAnnotationId === annotation.id ? "is-selected" : ""}
                onClick={() => {
                  setSelectedAnnotationId(annotation.id);
                  setSelectedRedactionId(null);
                }}
              >
                {annotation.kind} {String(index + 1)}
              </button>
            ))}
            {!redactions.length && !annotations.length ? <small>No layers yet.</small> : null}
          </div>

          <button type="button" className="blur-annotate-download" onClick={downloadManifest}>
            Download blur &amp; annotation plan
          </button>
          <p className="blur-annotate-note">
            Permanent redactions are exported as pixel coordinates for a server-side burn-in.
            Preview overlays are never trusted as privacy protection.
          </p>
        </aside>
      </section>
    </main>
  );
}
