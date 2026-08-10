"use client";

/**
 * UploadZone — Resilient multi-file upload component (TASK-043)
 *
 * UI regions:
 *  - Drop area / file picker trigger (drag-and-drop, click to browse, keyboard accessible)
 *  - Upload queue table (per-file: name, size, status, progress bar, actions)
 *  - Accessible ARIA live region for screen-reader announcements
 *  - Navigation protection (beforeunload guard while uploads are active)
 *
 * Complies with UI_REQUIREMENTS.md:
 *  - Every async op shows progress, safe navigation behavior, and recovery options.
 *  - Accessible status announcements for each state transition.
 *  - Touch targets ≥ 44×44 CSS pixels.
 *  - Keyboard/tab accessible.
 */

import * as React from "react";
import {
  createUploadSessionClient,
  type UploadSession,
  type UploadSessionClient
} from "../src/lib/upload-session-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type UploadFileStatus =
  | "precheck" // client-side validation
  | "queued" // waiting to start
  | "initiating" // creating session on server
  | "uploading" // parts being sent
  | "paused" // user paused
  | "finalizing" // server verifying
  | "complete" // done
  | "error"; // failed

export interface UploadFile {
  readonly id: string;
  readonly file: File;
  status: UploadFileStatus;
  progress: number; // 0–100
  errorMessage: string | null;
  session: UploadSession | null;
  partsDone: number;
  partsTotal: number;
  assetId: string | null;
  abortController: AbortController | null;
}

export interface UploadZoneProps {
  readonly workspaceId: string;
  /** Accepted MIME type globs, e.g. "image/*,video/mp4". Defaults to all. */
  readonly accept?: string;
  /** Maximum individual file size in bytes. Default 5 GB. */
  readonly maxFileSizeBytes?: number;
  /** Maximum number of concurrent uploads. Default 3. */
  readonly maxConcurrent?: number;
  /** Called when a file successfully finishes (assetId provided). */
  readonly onUploadComplete?: (file: File, assetId: string) => void;
  /** Optional injected client for testing. */
  readonly client?: UploadSessionClient;
}

const MAX_FILE_SIZE_DEFAULT = 5 * 1024 * 1024 * 1024; // 5 GB
const EMPTY_CHECKSUM = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function createUploadFile(file: File): UploadFile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    status: "queued",
    progress: 0,
    errorMessage: null,
    session: null,
    partsDone: 0,
    partsTotal: 1,
    assetId: null,
    abortController: null
  };
}

/** Status badge colours following design-token conventions. */
function statusColor(status: UploadFileStatus): React.CSSProperties {
  const map: Record<UploadFileStatus, string> = {
    precheck: "#8b8fa8",
    queued: "#6b7280",
    initiating: "#3b82f6",
    uploading: "#2563eb",
    paused: "#d97706",
    finalizing: "#7c3aed",
    complete: "#16a34a",
    error: "#dc2626"
  };
  return { color: map[status] ?? "#6b7280" };
}

function statusLabel(status: UploadFileStatus): string {
  const labels: Record<UploadFileStatus, string> = {
    precheck: "Checking",
    queued: "Queued",
    initiating: "Starting",
    uploading: "Uploading",
    paused: "Paused",
    finalizing: "Verifying",
    complete: "Complete",
    error: "Failed"
  };
  return labels[status] ?? status;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function UploadZone({
  workspaceId,
  accept,
  maxFileSizeBytes = MAX_FILE_SIZE_DEFAULT,
  maxConcurrent = 3,
  onUploadComplete,
  client: providedClient
}: UploadZoneProps) {
  const client = React.useMemo(
    () => providedClient ?? createUploadSessionClient(),
    [providedClient]
  );

  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const activeUploads = React.useRef(new Set<string>());

  // ── Navigation protection ──────────────────────────────────────────────────
  const hasActiveUploads = files.some(
    (f) => f.status === "uploading" || f.status === "initiating" || f.status === "finalizing"
  );

  React.useEffect(() => {
    if (!hasActiveUploads) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have uploads in progress. If you leave, they will be cancelled.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasActiveUploads]);

  // ── File addition ──────────────────────────────────────────────────────────
  const addFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      const newEntries: UploadFile[] = [];
      const errors: string[] = [];

      for (const file of Array.from(incoming)) {
        // Client precheck: size
        if (file.size > maxFileSizeBytes) {
          errors.push(`${file.name} exceeds ${formatBytes(maxFileSizeBytes)} limit.`);
          continue;
        }
        // Duplicate detection (same name + size + last-modified)
        const isDuplicate = files.some(
          (f) =>
            f.file.name === file.name &&
            f.file.size === file.size &&
            f.file.lastModified === file.lastModified
        );
        if (isDuplicate) {
          errors.push(`${file.name} is already in the queue.`);
          continue;
        }
        newEntries.push(createUploadFile(file));
      }

      if (errors.length > 0) {
        setAnnouncement(`Could not add: ${errors.join(" ")}`);
      }

      if (newEntries.length > 0) {
        setFiles((prev) => [...prev, ...newEntries]);
        setAnnouncement(
          `Added ${newEntries.length} file${newEntries.length > 1 ? "s" : ""} to queue.`
        );
      }
    },
    [files, maxFileSizeBytes]
  );

  // ── Upload logic ───────────────────────────────────────────────────────────
  const updateFile = React.useCallback((id: string, patch: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const startUpload = React.useCallback(
    async (uploadFile: UploadFile) => {
      if (activeUploads.current.has(uploadFile.id)) return;
      activeUploads.current.add(uploadFile.id);

      const abort = new AbortController();
      updateFile(uploadFile.id, {
        status: "initiating",
        abortController: abort,
        errorMessage: null
      });

      try {
        const idempotencyKey = `upload-${uploadFile.id}`;
        setAnnouncement(`Starting upload: ${uploadFile.file.name}`);

        const { session, parts } = await client.initiate(workspaceId, {
          fileName: uploadFile.file.name,
          mimeType: uploadFile.file.type || "application/octet-stream",
          totalSizeInBytes: uploadFile.file.size,
          checksumSha256: EMPTY_CHECKSUM, // SHA-256 computed server-side from finalize
          idempotencyKey
        });

        updateFile(uploadFile.id, {
          status: "uploading",
          session,
          partsTotal: parts.length,
          partsDone: 0
        });

        // Upload each part in order
        for (let i = 0; i < parts.length; i++) {
          if (abort.signal.aborted) throw new Error("Upload cancelled.");

          const part = parts[i]!;
          const start = i * session.partSizeInBytes;
          const end = Math.min(start + session.partSizeInBytes, uploadFile.file.size);
          const blob = uploadFile.file.slice(start, end);

          await fetch(part.uploadUrl, {
            method: "PUT",
            headers: part.headers,
            body: blob,
            signal: abort.signal
          });

          const partsDone = i + 1;
          const progress = Math.round((partsDone / parts.length) * 100);
          updateFile(uploadFile.id, { partsDone, progress });
        }

        if (abort.signal.aborted) throw new Error("Upload cancelled.");

        // Finalize
        updateFile(uploadFile.id, { status: "finalizing" });
        setAnnouncement(`Verifying ${uploadFile.file.name}…`);

        const { assetId } = await client.finalize(workspaceId, session.id);
        updateFile(uploadFile.id, { status: "complete", progress: 100, assetId });
        setAnnouncement(`Upload complete: ${uploadFile.file.name}`);
        onUploadComplete?.(uploadFile.file, assetId);
      } catch (err) {
        if (
          (err as Error).name === "AbortError" ||
          (err as Error).message === "Upload cancelled."
        ) {
          updateFile(uploadFile.id, {
            status: "error",
            errorMessage: "Upload cancelled.",
            abortController: null
          });
          setAnnouncement(`Upload cancelled: ${uploadFile.file.name}`);
        } else {
          const msg = err instanceof Error ? err.message : "Upload failed.";
          updateFile(uploadFile.id, { status: "error", errorMessage: msg, abortController: null });
          setAnnouncement(`Upload failed: ${uploadFile.file.name}. ${msg}`);
        }
      } finally {
        activeUploads.current.delete(uploadFile.id);
      }
    },
    [client, workspaceId, onUploadComplete, updateFile]
  );

  // Auto-start queued uploads respecting concurrency limit
  React.useEffect(() => {
    const queued = files.filter((f) => f.status === "queued");
    const available = maxConcurrent - activeUploads.current.size;
    if (available <= 0 || queued.length === 0) return;
    const toStart = queued.slice(0, available);
    for (const f of toStart) {
      void startUpload(f);
    }
  }, [files, maxConcurrent, startUpload]);

  // ── Queue actions ──────────────────────────────────────────────────────────
  const retryUpload = (uploadFile: UploadFile) => {
    updateFile(uploadFile.id, {
      status: "queued",
      progress: 0,
      errorMessage: null,
      session: null,
      partsDone: 0,
      abortController: null
    });
    setAnnouncement(`Retrying: ${uploadFile.file.name}`);
  };

  const cancelUpload = (uploadFile: UploadFile) => {
    uploadFile.abortController?.abort();
    if (uploadFile.session) {
      void client.abort(workspaceId, uploadFile.session.id).catch(() => undefined);
    }
    updateFile(uploadFile.id, { status: "error", errorMessage: "Cancelled." });
    setAnnouncement(`Cancelled: ${uploadFile.file.name}`);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      f?.abortController?.abort();
      return prev.filter((x) => x.id !== id);
    });
  };

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      // Reset so the same file can be selected again
      e.target.value = "";
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  };

  const completedCount = files.filter((f) => f.status === "complete").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 680 }}>
      {/* Accessible live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap"
        }}
      >
        {announcement}
      </div>

      {/* Drop zone */}
      <div
        id="upload-drop-zone"
        role="button"
        tabIndex={0}
        aria-label="Drop files here or press Enter to browse files"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openFilePicker}
        onKeyDown={onKeyDown}
        style={{
          border: `2px dashed ${isDragging ? "#2563eb" : "#d1d5db"}`,
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragging ? "#eff6ff" : "#fafafa",
          transition: "all 0.15s ease",
          minHeight: 44 // accessible touch target
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1 }} aria-hidden="true">
          ☁️
        </div>
        <p style={{ margin: 0, fontWeight: 600, color: isDragging ? "#1d4ed8" : "#374151" }}>
          {isDragging ? "Release to add files" : "Drag and drop files here"}
        </p>
        <p style={{ margin: "6px 0 12px", fontSize: 14, color: "#6b7280" }}>
          or <span style={{ color: "#2563eb", textDecoration: "underline" }}>browse files</span>
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          Maximum file size: {formatBytes(maxFileSizeBytes)}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {/* Upload queue */}
      {files.length > 0 && (
        <section aria-labelledby="upload-queue-heading" style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8
            }}
          >
            <h2
              id="upload-queue-heading"
              style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}
            >
              Upload queue
              {files.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#6b7280"
                  }}
                >
                  {completedCount}/{files.length} complete
                  {errorCount > 0 && `, ${errorCount} failed`}
                </span>
              )}
            </h2>
            <button
              id="upload-clear-completed"
              onClick={() => setFiles((prev) => prev.filter((f) => f.status !== "complete"))}
              disabled={completedCount === 0}
              style={{
                padding: "4px 10px",
                fontSize: 13,
                border: "1px solid #d1d5db",
                borderRadius: 6,
                cursor: completedCount === 0 ? "default" : "pointer",
                background: "white",
                color: completedCount === 0 ? "#9ca3af" : "#374151",
                minHeight: 44 // a11y touch target
              }}
              aria-label="Clear completed uploads"
            >
              Clear done
            </button>
          </div>

          <ul
            style={{ listStyle: "none", margin: 0, padding: 0 }}
            role="list"
            aria-label="Upload queue"
          >
            {files.map((f) => (
              <UploadFileRow
                key={f.id}
                uploadFile={f}
                onCancel={() => cancelUpload(f)}
                onRetry={() => retryUpload(f)}
                onRemove={() => removeFile(f.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ── UploadFileRow ──────────────────────────────────────────────────────────────

interface UploadFileRowProps {
  readonly uploadFile: UploadFile;
  readonly onCancel: () => void;
  readonly onRetry: () => void;
  readonly onRemove: () => void;
}

function UploadFileRow({ uploadFile: f, onCancel, onRetry, onRemove }: UploadFileRowProps) {
  const isActive =
    f.status === "uploading" || f.status === "initiating" || f.status === "finalizing";
  const isError = f.status === "error";
  const isComplete = f.status === "complete";

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 8,
        marginBottom: 6,
        border: "1px solid",
        borderColor: isError ? "#fca5a5" : isComplete ? "#bbf7d0" : "#e5e7eb",
        backgroundColor: isError ? "#fff7f7" : isComplete ? "#f0fdf4" : "white"
      }}
      aria-label={`${f.file.name}: ${statusLabel(f.status)}${f.status === "uploading" ? `, ${f.progress}%` : ""}${f.errorMessage ? `, ${f.errorMessage}` : ""}`}
    >
      {/* File icon */}
      <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden="true">
        {isComplete ? "✅" : isError ? "❌" : "📄"}
      </span>

      {/* Info block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "60%"
            }}
            title={f.file.name}
          >
            {f.file.name}
          </span>
          <span style={{ fontSize: 12, color: "#6b7280", flexShrink: 0 }}>
            {formatBytes(f.file.size)}
          </span>
        </div>

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, ...statusColor(f.status) }}>
            {statusLabel(f.status)}
          </span>
          {f.status === "uploading" && f.partsTotal > 1 && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              ({f.partsDone}/{f.partsTotal} parts)
            </span>
          )}
          {isError && f.errorMessage && (
            <span style={{ fontSize: 11, color: "#dc2626" }}>— {f.errorMessage}</span>
          )}
        </div>

        {/* Progress bar */}
        {(isActive || f.status === "paused") && (
          <div
            role="progressbar"
            aria-valuenow={f.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${f.file.name} upload progress: ${f.progress}%`}
            style={{
              marginTop: 6,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#e5e7eb",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${f.progress}%`,
                backgroundColor: f.status === "finalizing" ? "#7c3aed" : "#2563eb",
                borderRadius: 2,
                transition: "width 0.3s ease"
              }}
            />
          </div>
        )}
        {isComplete && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#15803d" }}>
            Asset ready — ID: {f.assetId}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {isActive && (
          <button
            id={`upload-cancel-${f.id}`}
            onClick={onCancel}
            aria-label={`Cancel upload of ${f.file.name}`}
            style={actionButtonStyle}
          >
            ✕
          </button>
        )}
        {isError && (
          <>
            <button
              id={`upload-retry-${f.id}`}
              onClick={onRetry}
              aria-label={`Retry upload of ${f.file.name}`}
              style={{ ...actionButtonStyle, color: "#2563eb", borderColor: "#bfdbfe" }}
            >
              ↺
            </button>
            <button
              id={`upload-remove-${f.id}`}
              onClick={onRemove}
              aria-label={`Remove ${f.file.name} from queue`}
              style={actionButtonStyle}
            >
              ✕
            </button>
          </>
        )}
        {isComplete && (
          <button
            id={`upload-remove-${f.id}`}
            onClick={onRemove}
            aria-label={`Dismiss ${f.file.name}`}
            style={actionButtonStyle}
          >
            ✕
          </button>
        )}
      </div>
    </li>
  );
}

const actionButtonStyle: React.CSSProperties = {
  minWidth: 44, // a11y touch target
  minHeight: 44,
  padding: "0 8px",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  fontSize: 16,
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};
