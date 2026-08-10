"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { dataUrlToBlob, saveLocalCaptureBundle } from "../src/lib/local-capture-storage";

type ImportedStep = {
  id: string;
  title: string;
  description: string;
  blob: Blob;
  width: number;
  height: number;
};

const MAX_JSON_BYTES = 8 * 1024 * 1024;
const MAX_STEPS = 30;
const MAX_SCREENSHOT_BYTES = 1_800_000;
const MAX_TEXT_LENGTH = 160;

function boundedText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

function safeSourceUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return `${parsed.origin}${parsed.pathname}`.slice(0, 500);
  } catch {
    return "";
  }
}

async function imageDimensions(): Promise<{ width: number; height: number }> {
  // Avoid decoding an untrusted image just to read dimensions; the extension
  // capture viewport is bounded and the editor can still render the blob at its
  // natural size.
  return { width: 1280, height: 720 };
}

async function parseExtensionCapture(value: unknown): Promise<{
  title: string;
  sourceUrl: string;
  steps: ImportedStep[];
}> {
  if (!value || typeof value !== "object")
    throw new Error("The capture file is not a JSON object.");
  const record = value as Record<string, unknown>;
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];
  if (rawSteps.length > MAX_STEPS)
    throw new Error(`Capture files can contain at most ${String(MAX_STEPS)} steps.`);
  const lastCapture =
    record.lastCapture && typeof record.lastCapture === "object"
      ? (record.lastCapture as Record<string, unknown>)
      : {};
  const sourceUrl = safeSourceUrl(lastCapture.url);
  const title = boundedText(lastCapture.title) || "Chrome extension capture";
  const steps: ImportedStep[] = [];
  for (const [index, rawStep] of rawSteps.entries()) {
    if (!rawStep || typeof rawStep !== "object") continue;
    const step = rawStep as Record<string, unknown>;
    const dataUrl = typeof step.screenshot === "string" ? step.screenshot : "";
    if (!dataUrl || dataUrl.length > 2_400_000) continue;
    const blob = dataUrlToBlob(dataUrl);
    if (!blob || blob.size > MAX_SCREENSHOT_BYTES) continue;
    const dimensions = await imageDimensions();
    const eventType = boundedText(step.eventType, 30) || "interaction";
    const elementHint = boundedText(step.elementHint, 80) || "page";
    steps.push({
      id: `extension-step-${index + 1}`,
      title: `${eventType} · ${elementHint}`.slice(0, MAX_TEXT_LENGTH),
      description: sourceUrl
        ? `Captured from ${sourceUrl}.`
        : "Imported from the SupaDemo Chrome extension.",
      blob,
      width: dimensions.width,
      height: dimensions.height
    });
  }
  if (!steps.length) {
    throw new Error(
      "This capture has no usable screenshots. Record at least one step before importing."
    );
  }
  return { title, sourceUrl, steps };
}

export function ExtensionImportWorkbench() {
  const router = useRouter();
  const [capture, setCapture] = useState<Awaited<ReturnType<typeof parseExtensionCapture>> | null>(
    null
  );
  const [localCaptureId, setLocalCaptureId] = useState("");
  const [message, setMessage] = useState(
    "Choose the JSON file downloaded by the SupaDemo Chrome extension."
  );
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const previewUrls = useMemo(() => {
    const urls = new Map<string, string>();
    capture?.steps.forEach((step) => urls.set(step.id, URL.createObjectURL(step.blob)));
    return urls;
  }, [capture]);

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const readFile = async (file: File) => {
    setError("");
    if (file.size > MAX_JSON_BYTES) {
      setError("Capture JSON files must be 8 MB or smaller.");
      return;
    }
    if (
      file.type &&
      file.type !== "application/json" &&
      !file.name.toLowerCase().endsWith(".json")
    ) {
      setError("Choose a JSON capture file.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const next = await parseExtensionCapture(parsed);
      setCapture(next);
      setLocalCaptureId("");
      setMessage(`${next.steps.length} screenshot steps are ready to import.`);
    } catch (parseError) {
      setCapture(null);
      setError(
        parseError instanceof Error ? parseError.message : "The capture file could not be read."
      );
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void readFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const importCapture = async () => {
    if (!capture) return;
    const id = `extension-${Date.now()}`;
    const saved = await saveLocalCaptureBundle({
      version: 1,
      id,
      kind: "screenshots",
      createdAtIso: new Date().toISOString(),
      title: capture.title,
      mimeType: "image/png",
      screenshots: capture.steps.map((step) => ({
        id: step.id,
        blob: step.blob,
        width: step.width,
        height: step.height,
        title: step.title,
        description: step.description
      }))
    });
    if (!saved) {
      setError("The capture could not be saved in this browser. Download the JSON and retry.");
      return;
    }
    setLocalCaptureId(id);
    setError("");
    setMessage("Capture imported. Open the editor to place hotspots and publish it.");
  };

  return (
    <main className="extension-import-page">
      <header className="extension-import-header">
        <a className="extension-import-back" href="/download">
          ← Back to recorders
        </a>
        <p className="eyebrow">Create · Chrome extension</p>
        <h1>Import a guided browser capture</h1>
        <p>
          Download a capture from the SupaDemo extension, then bring its ordered screenshots into
          the local editor. The JSON is validated in this browser and never sent to a server.
        </p>
      </header>

      <section className="extension-import-card" aria-labelledby="extension-import-heading">
        <div>
          <p className="eyebrow">1 · Choose capture JSON</p>
          <h2 id="extension-import-heading">Bring in your recording</h2>
          <p>
            Only bounded screenshot data, safe page metadata, and interaction labels are imported.
          </p>
        </div>
        <div
          className={"extension-import-dropzone" + (isDragging ? " is-dragging" : "")}
          role="button"
          tabIndex={0}
          aria-label="Drop extension JSON here or press Enter to browse"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.querySelector<HTMLInputElement>("input")?.click();
            }
          }}
        >
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleInput}
            aria-label="Choose extension JSON"
          />
          <strong>{isDragging ? "Release to import" : "Drop capture JSON or browse"}</strong>
          <span>JSON up to 8 MB</span>
        </div>
      </section>

      {capture ? (
        <section
          className="extension-import-preview"
          aria-labelledby="extension-import-preview-heading"
        >
          <div className="extension-import-section-heading">
            <div>
              <p className="eyebrow">2 · Review steps</p>
              <h2 id="extension-import-preview-heading">{capture.title}</h2>
            </div>
            <span>{capture.steps.length} screenshots</span>
          </div>
          {capture.sourceUrl ? (
            <p className="extension-import-source">Source: {capture.sourceUrl}</p>
          ) : null}
          <ol>
            {capture.steps.map((step, index) => (
              <li key={step.id}>
                <img src={previewUrls.get(step.id)} alt="" />
                <span>
                  <strong>
                    {index + 1}. {step.title}
                  </strong>
                  <small>{step.description}</small>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {error ? (
        <p className="extension-import-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="extension-import-status" role="status" aria-live="polite">
        {message}
      </p>

      <section className="extension-import-actions" aria-label="Import actions">
        <button
          type="button"
          className="extension-import-primary"
          disabled={!capture}
          onClick={() => void importCapture()}
        >
          Import capture
        </button>
        {localCaptureId ? (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/demos/${encodeURIComponent(`draft-${localCaptureId}`)}/edit?capture=extension&localCapture=${encodeURIComponent(localCaptureId)}`
              )
            }
          >
            Open editor →
          </button>
        ) : null}
      </section>
    </main>
  );
}
