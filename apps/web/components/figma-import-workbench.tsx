"use client";

import {
  convertFigmaFramesToDemoDocument,
  createFigmaImportPayload,
  type DemoDocument
} from "@supademo/domain";
import { useState, type ChangeEvent } from "react";

type FigmaFrameDraft = {
  frameId: string;
  frameName: string;
  description: string;
  imageUrl: string;
  widthPx: number;
  heightPx: number;
};

const MAX_FRAMES = 8;
const MAX_IMAGE_BYTES = 1_200_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const DRAFT_DEMO_ID = "figma-import-draft";

function safeFrameName(name: string) {
  return name
    .replace(/\.[a-z0-9]+$/iu, "")
    .replace(/[^a-z0-9 _-]/giu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 120);
}

function readFrame(file: File, index: number): Promise<FigmaFrameDraft> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      reject(new Error("Only PNG, JPG, and WebP frames can be imported."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Each frame must be 1.2 MB or smaller."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("A selected frame could not be read."));
    reader.onload = () => {
      const imageUrl = typeof reader.result === "string" ? reader.result : "";
      if (!imageUrl || imageUrl.length > 1_800_000) {
        reject(new Error("A selected frame is too large to keep locally."));
        return;
      }
      const image = new window.Image();
      image.onerror = () => reject(new Error("A selected frame is not a readable image."));
      image.onload = () =>
        resolve({
          frameId: "frame-" + String(Date.now()) + "-" + String(index),
          frameName: safeFrameName(file.name) || "Frame " + String(index + 1),
          description: "",
          imageUrl,
          widthPx: Math.min(10_000, image.naturalWidth),
          heightPx: Math.min(10_000, image.naturalHeight)
        });
      image.src = imageUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function FigmaImportWorkbench() {
  const [fileKey, setFileKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [frames, setFrames] = useState<FigmaFrameDraft[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [message, setMessage] = useState("Connect a Figma file, then select the frames to import.");
  const [error, setError] = useState("");
  const [exported, setExported] = useState(false);

  const selectedFrame =
    frames.find((frame) => frame.frameId === selectedFrameId) || frames[0] || null;

  const connect = () => {
    const normalized = fileKey.trim().slice(0, 120);
    if (!normalized) {
      setError("Enter a Figma file key or name before connecting.");
      return;
    }
    setFileKey(normalized);
    setConnected(true);
    setError("");
    setMessage("File connected. Select up to eight local frame exports.");
  };

  const addFrames = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []).slice(0, MAX_FRAMES - frames.length);
    event.currentTarget.value = "";
    if (!files.length) return;
    setError("");
    try {
      const nextFrames: FigmaFrameDraft[] = [];
      for (const [index, file] of files.entries()) {
        nextFrames.push(await readFrame(file, frames.length + index));
      }
      const next = [...frames, ...nextFrames].slice(0, MAX_FRAMES);
      setFrames(next);
      setSelectedFrameId((currentSelected) => currentSelected || next[0]?.frameId || null);
      setMessage("Frames added. Reorder and annotate them before export.");
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "A frame could not be imported.");
    }
  };

  const updateFrame = (frameId: string, patch: Partial<FigmaFrameDraft>) => {
    setFrames((current) =>
      current.map((frame) =>
        frame.frameId === frameId
          ? {
              ...frame,
              frameName:
                patch.frameName === undefined ? frame.frameName : patch.frameName.slice(0, 120),
              description:
                patch.description === undefined
                  ? frame.description
                  : patch.description.slice(0, 400)
            }
          : frame
      )
    );
  };

  const moveFrame = (frameId: string, direction: -1 | 1) => {
    setFrames((current) => {
      const index = current.findIndex((frame) => frame.frameId === frameId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const removeFrame = (frameId: string) => {
    const next = frames.filter((frame) => frame.frameId !== frameId);
    setFrames(next);
    setSelectedFrameId((selected) => (selected === frameId ? next[0]?.frameId || null : selected));
  };

  const exportToEditor = () => {
    if (!connected || !frames.length) {
      setError("Connect a file and add at least one frame before exporting.");
      return;
    }
    try {
      const payload = createFigmaImportPayload(
        fileKey || "local-figma-file",
        frames.map((frame, index) => ({
          frameId: frame.frameId,
          frameName: frame.frameName,
          imageUrl: frame.imageUrl,
          widthPx: frame.widthPx,
          heightPx: frame.heightPx,
          orderIndex: index
        }))
      );
      const baseDocument = convertFigmaFramesToDemoDocument(payload, "local-workspace");
      const document: DemoDocument = {
        ...baseDocument,
        demoId: DRAFT_DEMO_ID,
        steps: baseDocument.steps.map((step, index) => ({
          ...step,
          description: frames[index]?.description || null
        }))
      };
      localStorage.setItem("supademo_draft_" + DRAFT_DEMO_ID, JSON.stringify(document));
      setExported(true);
      setError("");
      setMessage(
        "Frames exported to a local Supademo draft. Open the editor to add hotspots and publish."
      );
    } catch {
      setError("The frames could not be exported. Clear a few frames and try again.");
    }
  };

  return (
    <main className="figma-import-page">
      <header className="figma-import-header">
        <a href="/features/figma" className="figma-import-back">
          ← Figma plugin
        </a>
        <p className="eyebrow">Create · Figma</p>
        <h1>Turn Figma frames into an interactive prototype</h1>
        <p>
          Follow the same four-step flow as the plugin: connect, select, annotate, and export to the
          demo editor.
        </p>
      </header>

      <nav className="figma-import-steps" aria-label="Figma import steps">
        <span className={connected ? "is-complete" : "is-current"}>1 Connect</span>
        <span className={frames.length ? "is-complete" : ""}>2 Select frames</span>
        <span className={frames.length ? "is-current" : ""}>3 Annotate</span>
        <span className={exported ? "is-complete" : ""}>4 Export</span>
      </nav>

      <section className="figma-import-card" aria-labelledby="figma-connect-heading">
        <div>
          <p className="eyebrow">1 · Connect</p>
          <h2 id="figma-connect-heading">Connect a Figma file</h2>
          <p>Local frame exports stay in this browser until you explicitly export the draft.</p>
        </div>
        <div className="figma-import-connect">
          <label htmlFor="figma-file-key">Figma file key or name</label>
          <input
            id="figma-file-key"
            value={fileKey}
            maxLength={120}
            onChange={(event) => setFileKey(event.target.value)}
            placeholder="e.g. checkout-flow"
          />
          <button type="button" className="figma-import-primary" onClick={connect}>
            {connected ? "Reconnect file" : "Connect file"}
          </button>
        </div>
      </section>

      <section className="figma-import-card" aria-labelledby="figma-select-heading">
        <div>
          <p className="eyebrow">2 · Select</p>
          <h2 id="figma-select-heading">Select your frames</h2>
          <p>
            Upload the frames you selected in Figma. PNG, JPG, and WebP images up to 1.2 MB each.
          </p>
        </div>
        <label className="figma-import-upload">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) => void addFrames(event)}
            disabled={!connected || frames.length >= MAX_FRAMES}
          />
          <strong>
            {frames.length >= MAX_FRAMES ? "Frame limit reached" : "Choose frame exports"}
          </strong>
          <span>
            {frames.length} / {MAX_FRAMES} selected
          </span>
        </label>
      </section>

      <section className="figma-import-workspace" aria-labelledby="figma-annotate-heading">
        <div className="figma-import-frame-list">
          <div className="figma-import-section-title">
            <div>
              <p className="eyebrow">3 · Annotate</p>
              <h2 id="figma-annotate-heading">Arrange your story</h2>
            </div>
            <span>{frames.length} frames</span>
          </div>
          {frames.length ? (
            <ol>
              {frames.map((frame, index) => (
                <li
                  key={frame.frameId}
                  className={frame.frameId === selectedFrame?.frameId ? "is-selected" : ""}
                >
                  <button type="button" onClick={() => setSelectedFrameId(frame.frameId)}>
                    <img src={frame.imageUrl} alt="" />
                    <span>
                      <strong>
                        {index + 1}. {frame.frameName}
                      </strong>
                      <small>
                        {frame.widthPx} × {frame.heightPx}
                      </small>
                    </span>
                  </button>
                  <div className="figma-import-frame-actions">
                    <button
                      type="button"
                      aria-label={"Move " + frame.frameName + " up"}
                      onClick={() => moveFrame(frame.frameId, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={"Move " + frame.frameName + " down"}
                      onClick={() => moveFrame(frame.frameId, 1)}
                      disabled={index === frames.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={"Remove " + frame.frameName}
                      onClick={() => removeFrame(frame.frameId)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="figma-import-empty">Your selected frames will appear here.</p>
          )}
        </div>
        <div className="figma-import-inspector">
          {selectedFrame ? (
            <>
              <img
                className="figma-import-large-preview"
                src={selectedFrame.imageUrl}
                alt={selectedFrame.frameName}
              />
              <label>
                Frame title
                <input
                  value={selectedFrame.frameName}
                  maxLength={120}
                  onChange={(event) =>
                    updateFrame(selectedFrame.frameId, { frameName: event.target.value })
                  }
                />
              </label>
              <label>
                Description for viewers
                <textarea
                  value={selectedFrame.description}
                  maxLength={400}
                  rows={4}
                  onChange={(event) =>
                    updateFrame(selectedFrame.frameId, { description: event.target.value })
                  }
                />
              </label>
            </>
          ) : (
            <p className="figma-import-empty">Choose a frame to add a title and annotation.</p>
          )}
        </div>
      </section>

      {error ? (
        <p className="figma-import-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="figma-import-status" role="status" aria-live="polite">
        {message}
      </p>
      <section className="figma-import-export" aria-labelledby="figma-export-heading">
        <div>
          <p className="eyebrow">4 · Export</p>
          <h2 id="figma-export-heading">Open the prototype editor</h2>
          <p>
            Export creates a local draft. Add hotspots, voiceovers, personalization, and share
            settings in the editor.
          </p>
        </div>
        <div>
          <button type="button" className="figma-import-primary" onClick={exportToEditor}>
            Export to editor
          </button>
          {exported ? (
            <a href={"/demos/" + DRAFT_DEMO_ID + "/edit?capture=figma"}>Open editor →</a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
