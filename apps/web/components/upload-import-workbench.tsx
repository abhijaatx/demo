"use client";

import { createDefaultDemoDocument, type DemoDocument } from "@supademo/domain";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { saveLocalCaptureBundle } from "../src/lib/local-capture-storage";

type UploadAssetKind = "image" | "video" | "document";

type UploadAssetDraft = {
  id: string;
  name: string;
  title: string;
  description: string;
  kind: UploadAssetKind;
  blob: Blob;
  url: string;
  widthPx: number | null;
  heightPx: number | null;
  sizeBytes: number;
};

const MAX_ASSETS = 8;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_BYTES = 1_200_000;
const MAX_INLINE_IMAGE_LENGTH = 1_800_000;
const DRAFT_DEMO_ID = "upload-import-draft";
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

function safeFileName(name: string) {
  return (
    name
      .replace(/\.[a-z0-9]+$/iu, "")
      .replace(/[^a-z0-9 _-]/giu, " ")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 120) || "Uploaded step"
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readImage(file: File, id: string): Promise<UploadAssetDraft> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Images must be 1.2 MB or smaller."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (!url || url.length > MAX_INLINE_IMAGE_LENGTH) {
        reject(new Error("The image is too large to keep locally."));
        return;
      }
      const image = new window.Image();
      image.onerror = () => reject(new Error("The image is not readable."));
      image.onload = () =>
        resolve({
          id,
          name: file.name,
          title: safeFileName(file.name),
          description: "",
          kind: "image",
          blob: file,
          url,
          widthPx: Math.min(10_000, image.naturalWidth),
          heightPx: Math.min(10_000, image.naturalHeight),
          sizeBytes: file.size
        });
      image.src = url;
    };
    reader.readAsDataURL(file);
  });
}

function readLocalAsset(file: File, index: number): Promise<UploadAssetDraft> {
  const id = `upload-${Date.now()}-${index}`;
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return readImage(file, id);
  const kind = ALLOWED_VIDEO_TYPES.has(file.type)
    ? "video"
    : ALLOWED_DOCUMENT_TYPES.has(file.type)
      ? "document"
      : null;
  if (!kind) {
    return Promise.reject(new Error("Choose PNG, JPG, WebP, MP4, WebM, PDF, or PowerPoint files."));
  }
  return Promise.resolve({
    id,
    name: file.name,
    title: safeFileName(file.name),
    description: "",
    kind,
    blob: file,
    url: URL.createObjectURL(file),
    widthPx: null,
    heightPx: null,
    sizeBytes: file.size
  });
}

export function UploadImportWorkbench() {
  const router = useRouter();
  const [assets, setAssets] = useState<UploadAssetDraft[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Choose screenshots, videos, or presentation files to begin."
  );
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [exported, setExported] = useState(false);
  const [localCaptureId, setLocalCaptureId] = useState("");
  const assetsRef = useRef<UploadAssetDraft[]>([]);

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0] || null;

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const addFiles = async (files: File[]) => {
    const remaining = Math.max(0, MAX_ASSETS - assets.length);
    const candidates = files.slice(0, remaining);
    if (!candidates.length) {
      setError(`You can add up to ${String(MAX_ASSETS)} files to one draft.`);
      return;
    }
    setError("");
    try {
      const nextAssets: UploadAssetDraft[] = [];
      for (const [index, file] of candidates.entries()) {
        if (file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name} exceeds the ${formatBytes(MAX_FILE_BYTES)} local limit.`);
        }
        nextAssets.push(await readLocalAsset(file, assets.length + index));
      }
      const next = [...assets, ...nextAssets].slice(0, MAX_ASSETS);
      setAssets(next);
      setSelectedAssetId((current) => current || next[0]?.id || null);
      setMessage("Files added. Rearrange and annotate the steps before opening the editor.");
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "A file could not be added.");
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (files.length) void addFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) void addFiles(Array.from(event.dataTransfer.files));
  };

  const moveAsset = (assetId: string, direction: -1 | 1) => {
    setAssets((current) => {
      const index = current.findIndex((asset) => asset.id === assetId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const removeAsset = (assetId: string) => {
    const removed = assets.find((asset) => asset.id === assetId);
    if (removed?.url.startsWith("blob:")) URL.revokeObjectURL(removed.url);
    const next = assets.filter((asset) => asset.id !== assetId);
    setAssets(next);
    setSelectedAssetId((current) => (current === assetId ? next[0]?.id || null : current));
  };

  const updateAsset = (assetId: string, patch: Partial<UploadAssetDraft>) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              title: patch.title === undefined ? asset.title : patch.title.slice(0, 120),
              description:
                patch.description === undefined
                  ? asset.description
                  : patch.description.slice(0, 400)
            }
          : asset
      )
    );
  };

  const exportToEditor = async () => {
    if (!assets.length) {
      setError("Add at least one file before opening the editor.");
      return;
    }
    try {
      const captureId = `upload-${Date.now()}`;
      const saved = await saveLocalCaptureBundle({
        version: 1,
        id: captureId,
        kind: "upload",
        createdAtIso: new Date().toISOString(),
        title: "Uploaded demo",
        mimeType: "application/pdf",
        assets: assets.map((asset) => ({
          id: asset.id,
          blob: asset.blob,
          assetType: asset.kind,
          mimeType: asset.blob.type || "application/octet-stream",
          width: asset.widthPx,
          height: asset.heightPx,
          title: asset.title,
          description: asset.description
        }))
      });
      if (!saved) throw new Error("The upload bundle could not be saved locally.");
      const base = createDefaultDemoDocument(DRAFT_DEMO_ID);
      const document: DemoDocument = {
        ...base,
        steps: assets.map((asset, index) => ({
          id: `upload-step-${index + 1}`,
          orderIndex: index,
          title: asset.title || `Uploaded step ${index + 1}`,
          description: asset.description || null,
          media: {
            assetId: asset.id,
            assetType:
              asset.kind === "video" ? "video" : asset.kind === "document" ? "document" : "image",
            storagePath: asset.url,
            width: asset.widthPx,
            height: asset.heightPx,
            durationSeconds: null,
            posterPath: null
          },
          hotspots: [],
          callouts: [],
          audioNarration: null
        }))
      };
      localStorage.setItem(`supademo_draft_${DRAFT_DEMO_ID}`, JSON.stringify(document));
      setLocalCaptureId(captureId);
      setExported(true);
      setError("");
      setMessage(
        "Your local upload draft is ready. Opening the editor keeps these files in this browser."
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "The draft could not be saved locally. Remove a file and try again."
      );
    }
  };

  useEffect(() => {
    return () => {
      assetsRef.current.forEach((asset) => {
        if (asset.url.startsWith("blob:")) URL.revokeObjectURL(asset.url);
      });
    };
  }, []);

  return (
    <main className="upload-import-page">
      <header className="upload-import-header">
        <a href="/download" className="upload-import-back">
          ← Back to recorders
        </a>
        <p className="eyebrow">Create · Upload</p>
        <h1>Create an interactive demo from uploads</h1>
        <p>
          Add screenshots, videos, PDFs, or presentation slides, then arrange and annotate the story
          before opening the familiar Supademo editor.
        </p>
      </header>

      <section className="upload-import-card" aria-labelledby="upload-import-add-heading">
        <div>
          <p className="eyebrow">1 · Upload visuals</p>
          <h2 id="upload-import-add-heading">Choose your files</h2>
          <p>
            Files stay local until you explicitly export a draft. Up to eight files, 12 MB each.
          </p>
        </div>
        <div
          className={"upload-import-dropzone" + (isDragging ? " is-dragging" : "")}
          role="button"
          tabIndex={0}
          aria-label="Drop files here or press Enter to browse"
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
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            multiple
            onChange={handleInput}
            aria-label="Choose upload files"
          />
          <strong>{isDragging ? "Release to add files" : "Drop files here or browse"}</strong>
          <span>PNG, JPG, WebP, MP4, WebM, PDF, and PowerPoint</span>
          <small>
            {assets.length} / {MAX_ASSETS} files selected
          </small>
        </div>
      </section>

      <section className="upload-import-workspace" aria-labelledby="upload-import-arrange-heading">
        <div className="upload-import-list">
          <div className="upload-import-section-heading">
            <div>
              <p className="eyebrow">2 · Rearrange</p>
              <h2 id="upload-import-arrange-heading">Build the story</h2>
            </div>
            <span>{assets.length} steps</span>
          </div>
          {assets.length ? (
            <ol>
              {assets.map((asset, index) => (
                <li key={asset.id} className={asset.id === selectedAsset?.id ? "is-selected" : ""}>
                  <button type="button" onClick={() => setSelectedAssetId(asset.id)}>
                    {asset.kind === "image" ? (
                      <img src={asset.url} alt="" />
                    ) : (
                      <span className="upload-import-file-icon">
                        {asset.kind === "video" ? "▶" : "▤"}
                      </span>
                    )}
                    <span>
                      <strong>
                        {index + 1}. {asset.title}
                      </strong>
                      <small>
                        {formatBytes(asset.sizeBytes)} · {asset.kind}
                      </small>
                    </span>
                  </button>
                  <div className="upload-import-item-actions">
                    <button
                      type="button"
                      aria-label={`Move ${asset.title} up`}
                      onClick={() => moveAsset(asset.id, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${asset.title} down`}
                      onClick={() => moveAsset(asset.id, 1)}
                      disabled={index === assets.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${asset.title}`}
                      onClick={() => removeAsset(asset.id)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="upload-import-empty">Your uploaded steps will appear here.</p>
          )}
        </div>
        <div className="upload-import-inspector">
          {selectedAsset ? (
            <>
              {selectedAsset.kind === "image" ? (
                <img src={selectedAsset.url} alt={selectedAsset.title} />
              ) : selectedAsset.kind === "video" ? (
                <video
                  src={selectedAsset.url}
                  controls
                  playsInline
                  aria-label={selectedAsset.title}
                />
              ) : (
                <div className="upload-import-document-preview">
                  <span aria-hidden="true">▤</span>
                  <strong>{selectedAsset.name}</strong>
                  <small>Document files are kept local for the editor handoff.</small>
                </div>
              )}
              <label>
                Step title
                <input
                  value={selectedAsset.title}
                  maxLength={120}
                  onChange={(event) => updateAsset(selectedAsset.id, { title: event.target.value })}
                />
              </label>
              <label>
                Description for viewers
                <textarea
                  value={selectedAsset.description}
                  maxLength={400}
                  rows={4}
                  onChange={(event) =>
                    updateAsset(selectedAsset.id, { description: event.target.value })
                  }
                />
              </label>
            </>
          ) : (
            <p className="upload-import-empty">Choose a file to add a title and description.</p>
          )}
        </div>
      </section>

      {error ? (
        <p className="upload-import-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="upload-import-status" role="status" aria-live="polite">
        {message}
      </p>

      <section className="upload-import-export" aria-labelledby="upload-import-export-heading">
        <div>
          <p className="eyebrow">3 · Add hotspots</p>
          <h2 id="upload-import-export-heading">Continue in the editor</h2>
          <p>
            Export creates a local draft. Add hotspots, chapters, voiceovers, and sharing settings
            next.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="upload-import-primary"
            onClick={() => void exportToEditor()}
          >
            Export to editor
          </button>
          {exported ? (
            <button
              type="button"
              className="upload-import-open"
              onClick={() =>
                router.push(
                  `/demos/${DRAFT_DEMO_ID}/edit?capture=upload&localCapture=${encodeURIComponent(localCaptureId)}`
                )
              }
            >
              Open editor →
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
