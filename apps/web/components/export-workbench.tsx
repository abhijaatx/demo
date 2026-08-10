"use client";

import {
  buildScormFiles,
  createDefaultDemoDocument,
  createStoredZip,
  generateSopHtmlExport,
  generateSopMarkdownExport,
  generateSopTextExport,
  type DemoDocument,
  type ScormCompletionRule
} from "@supademo/domain";
import { useMemo, useState } from "react";
import {
  createDemoPng,
  createDemoVideo,
  downloadBlob,
  type ExportResolution,
  type VideoExportFormat
} from "../src/lib/export-client";

type ExportMode = "copy-steps" | "image" | "video" | "scorm";
type CopyFormat = "html" | "text" | "markdown";

const demoChoices = [
  { id: "demo-onboarding", title: "Customer onboarding", steps: 6 },
  { id: "demo-product", title: "Product walkthrough", steps: 8 },
  { id: "demo-analytics", title: "Analytics overview", steps: 5 }
] as const;

function sampleDocument(demoId: string, stepCount: number): DemoDocument {
  const base = createDefaultDemoDocument(demoId);
  return {
    ...base,
    steps: Array.from({ length: stepCount }, (_, index) => ({
      id: `${demoId}-step-${index + 1}`,
      orderIndex: index,
      title: ["Open the workspace", "Choose a demo", "Review the steps", "Share with your team"][
        index % 4
      ]!,
      description: "Follow this guided step to understand the workflow and keep your team moving.",
      media: null,
      hotspots: [
        {
          id: `${demoId}-hotspot-${index + 1}`,
          x: 50,
          y: 45,
          width: 18,
          height: 12,
          targetStepId: index + 1 < stepCount ? `${demoId}-step-${index + 2}` : null,
          tooltipText: "Continue to the next step",
          actionType: "next_step" as const,
          url: null,
          style: { pulse: true, color: "#635bff", opacity: 1 }
        }
      ],
      callouts: [],
      audioNarration: null
    }))
  };
}

function safeDownloadName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/gu, "-").slice(0, 80) || "supademo";
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}

function downloadScorm(files: Readonly<Record<string, string>>, filename: string): void {
  const bytes = createStoredZip(files);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  downloadBlob(filename, new Blob([buffer], { type: "application/zip" }));
}

export function ExportWorkbench() {
  const [demoId, setDemoId] = useState<string>(demoChoices[0]!.id);
  const [mode, setMode] = useState<ExportMode>("copy-steps");
  const [copyFormat, setCopyFormat] = useState<CopyFormat>("html");
  const [videoFormat, setVideoFormat] = useState<VideoExportFormat>("mp4");
  const [resolution, setResolution] = useState<ExportResolution>("1080p");
  const [frameRate, setFrameRate] = useState("30");
  const [slideDuration, setSlideDuration] = useState("2");
  const [courseTitle, setCourseTitle] = useState("Customer onboarding");
  const [courseId, setCourseId] = useState("customer-onboarding");
  const [sourceUrl, setSourceUrl] = useState("https://app.supademo.com/e/demo-onboarding");
  const [completionRule, setCompletionRule] = useState<ScormCompletionRule>("supademo-finish");
  const [activeSeconds, setActiveSeconds] = useState("30");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [message, setMessage] = useState(
    "Choose an export format and download a browser-generated file from this preview."
  );
  const [error, setError] = useState("");

  const selectedDemo = demoChoices.find((demo) => demo.id === demoId) ?? demoChoices[0]!;
  const document = useMemo(
    () => sampleDocument(selectedDemo.id, selectedDemo.steps),
    [selectedDemo.id, selectedDemo.steps]
  );
  const copyPreview = useMemo(() => {
    if (copyFormat === "text") return generateSopTextExport(document);
    if (copyFormat === "markdown") return generateSopMarkdownExport(document);
    return generateSopHtmlExport(document);
  }, [copyFormat, document]);

  const copySteps = async (): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(copyPreview);
      setMessage(`${copyFormat.toUpperCase()} steps copied to the clipboard.`);
      setError("");
    } catch {
      setMessage("Clipboard access was unavailable; select the preview and copy it manually.");
    }
  };

  const exportPng = async (): Promise<void> => {
    setError("");
    setMessage("Rendering a contact-sheet PNG… keep this tab open until the download starts.");
    try {
      const blob = await createDemoPng(document);
      downloadBlob(`${safeDownloadName(selectedDemo.id)}-steps.png`, blob);
      setMessage("PNG export downloaded.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "PNG export failed.");
      setMessage("The PNG export could not be generated.");
    }
  };

  const exportVideo = async (): Promise<void> => {
    setError("");
    setMessage("Rendering the video export… keep this tab open until the download starts.");
    try {
      const result = await createDemoVideo(document, {
        format: videoFormat,
        resolution,
        frameRate: Number(frameRate),
        slideDurationMs: Number(slideDuration) * 1_000,
        transitionDelayMs: 250
      });
      downloadBlob(`${safeDownloadName(selectedDemo.id)}.${result.extension}`, result.blob);
      setMessage(
        result.extension === videoFormat
          ? `${videoFormat.toUpperCase()} export downloaded.`
          : `${videoFormat.toUpperCase()} is unavailable here; a WebM fallback was downloaded.`
      );
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Video export failed.");
      setMessage("The video export could not be generated in this browser.");
    }
  };

  const exportScorm = (): void => {
    setError("");
    try {
      const files = buildScormFiles({
        sourceUrl,
        courseTitle,
        courseIdentifier: courseId,
        aspectRatio: 16 / 9,
        minHeight: 480,
        completionRule,
        activeViewingSeconds: Number(activeSeconds),
        showManualFallback
      });
      downloadScorm(files, `${safeDownloadName(courseId)}-scorm.zip`);
      setMessage("SCORM 1.2 package downloaded. Test it in your target LMS before rollout.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "SCORM package generation failed.");
      setMessage("The SCORM package could not be generated.");
    }
  };

  return (
    <main className="motion-workbench-page export-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Export · Repurpose your demo</span>
        <h1>Turn one demo into the format your audience needs</h1>
        <p>
          Copy steps into docs, export a visual guide, render a video, or package a hosted demo as a
          SCORM 1.2 course.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="export-workbench-local-badge">Browser-generated export</span>
      </div>
      {error ? (
        <p className="export-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="export-workbench-layout">
        <section
          className="motion-workbench-panel export-workbench-settings"
          aria-label="Export settings"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Choose a demo</span>
              <h2>Export settings</h2>
            </div>
            <span className="motion-workbench-count">{selectedDemo.steps} steps</span>
          </div>
          <label className="motion-workbench-field">
            <span>Demo</span>
            <select value={demoId} onChange={(event) => setDemoId(event.currentTarget.value)}>
              {demoChoices.map((demo) => (
                <option value={demo.id} key={demo.id}>
                  {demo.title}
                </option>
              ))}
            </select>
          </label>
          <div className="export-workbench-mode-grid" role="tablist" aria-label="Export type">
            {(
              [
                ["copy-steps", "Copy steps", "HTML, text, or Markdown"],
                ["image", "PDF / PNG", "Portable visual guide"],
                ["video", "MP4 / GIF", "Shareable video file"],
                ["scorm", "SCORM 1.2", "Upload to an LMS"]
              ] as const
            ).map(([value, label, description]) => (
              <button
                type="button"
                role="tab"
                aria-selected={mode === value}
                className={mode === value ? "is-active" : ""}
                key={value}
                onClick={() => {
                  setMode(value);
                  setError("");
                }}
              >
                <strong>{label}</strong>
                <small>{description}</small>
              </button>
            ))}
          </div>

          {mode === "copy-steps" ? (
            <>
              <fieldset className="export-workbench-fieldset">
                <legend>Output format</legend>
                {(["html", "text", "markdown"] as const).map((format) => (
                  <label key={format} className="export-workbench-radio">
                    <input
                      type="radio"
                      name="copy-format"
                      checked={copyFormat === format}
                      onChange={() => setCopyFormat(format)}
                    />
                    <span>
                      {format === "html" ? "HTML" : format === "text" ? "Plain text" : "Markdown"}
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary"
                onClick={() => void copySteps()}
              >
                Copy {copyFormat.toUpperCase()} steps
              </button>
            </>
          ) : null}

          {mode === "image" ? (
            <div className="export-workbench-option-stack">
              <p>PDF opens a printable guide; PNG creates a contact sheet of every step.</p>
              <div className="export-workbench-action-row">
                <button
                  type="button"
                  className="motion-workbench-button motion-workbench-button-primary"
                  onClick={() =>
                    downloadTextFile(
                      `${safeDownloadName(selectedDemo.id)}-guide.html`,
                      `<!doctype html><meta charset="utf-8"><title>${safeDownloadName(selectedDemo.id)} guide</title>${copyPreview}`,
                      "text/html;charset=utf-8"
                    )
                  }
                >
                  Download HTML guide
                </button>
                <button
                  type="button"
                  className="motion-workbench-button"
                  onClick={() => void exportPng()}
                >
                  Download PNG
                </button>
              </div>
              <small>Use your browser’s Print → Save as PDF for a portable PDF.</small>
            </div>
          ) : null}

          {mode === "video" ? (
            <div className="export-workbench-option-stack">
              <div className="export-workbench-two-column">
                <label className="motion-workbench-field">
                  <span>Format</span>
                  <select
                    value={videoFormat}
                    onChange={(event) =>
                      setVideoFormat(event.currentTarget.value as VideoExportFormat)
                    }
                  >
                    <option value="mp4">MP4</option>
                    <option value="gif">GIF</option>
                  </select>
                </label>
                <label className="motion-workbench-field">
                  <span>Resolution</span>
                  <select
                    value={resolution}
                    onChange={(event) =>
                      setResolution(event.currentTarget.value as ExportResolution)
                    }
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                </label>
              </div>
              <div className="export-workbench-two-column">
                <label className="motion-workbench-field">
                  <span>Frame rate</span>
                  <select
                    value={frameRate}
                    onChange={(event) => setFrameRate(event.currentTarget.value)}
                  >
                    <option value="24">24 FPS</option>
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                  </select>
                </label>
                <label className="motion-workbench-field">
                  <span>Slide duration</span>
                  <select
                    value={slideDuration}
                    onChange={(event) => setSlideDuration(event.currentTarget.value)}
                  >
                    <option value="1">1 second</option>
                    <option value="2">2 seconds</option>
                    <option value="4">4 seconds</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary"
                onClick={() => void exportVideo()}
              >
                Download {videoFormat.toUpperCase()}
              </button>
              <small>
                Video exports are limited to 70 steps and may use a WebM fallback if the browser
                cannot encode MP4/GIF.
              </small>
            </div>
          ) : null}

          {mode === "scorm" ? (
            <div className="export-workbench-option-stack">
              <label className="motion-workbench-field">
                <span>Supademo link or iframe source</span>
                <textarea
                  value={sourceUrl}
                  maxLength={20_000}
                  rows={3}
                  onChange={(event) => setSourceUrl(event.currentTarget.value)}
                />
                <small>Only public HTTPS URLs or iframe embeds are accepted.</small>
              </label>
              <div className="export-workbench-two-column">
                <label className="motion-workbench-field">
                  <span>Course title</span>
                  <input
                    value={courseTitle}
                    maxLength={160}
                    onChange={(event) => setCourseTitle(event.currentTarget.value)}
                  />
                </label>
                <label className="motion-workbench-field">
                  <span>Course identifier</span>
                  <input
                    value={courseId}
                    maxLength={120}
                    onChange={(event) => setCourseId(event.currentTarget.value)}
                  />
                </label>
              </div>
              <label className="motion-workbench-field">
                <span>Completion rule</span>
                <select
                  value={completionRule}
                  onChange={(event) =>
                    setCompletionRule(event.currentTarget.value as ScormCompletionRule)
                  }
                >
                  <option value="supademo-finish">When the Supademo is finished</option>
                  <option value="active-time">After active viewing time</option>
                  <option value="manual">When learner clicks Mark complete</option>
                  <option value="launched">When the module launches</option>
                </select>
              </label>
              {completionRule === "active-time" ? (
                <label className="motion-workbench-field">
                  <span>Active viewing seconds</span>
                  <input
                    type="number"
                    min={5}
                    max={3600}
                    value={activeSeconds}
                    onChange={(event) => setActiveSeconds(event.currentTarget.value)}
                  />
                </label>
              ) : null}
              <label className="export-workbench-check">
                <input
                  type="checkbox"
                  checked={showManualFallback}
                  onChange={(event) => setShowManualFallback(event.currentTarget.checked)}
                />
                <span>Show a learner-facing “Mark complete” fallback</span>
              </label>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary"
                onClick={exportScorm}
              >
                Generate SCORM package
              </button>
            </div>
          ) : null}
        </section>

        <section
          className="motion-workbench-panel export-workbench-preview"
          aria-label="Export preview"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Preview</span>
              <h2>{selectedDemo.title}</h2>
            </div>
            <span className="export-workbench-format-pill">
              {mode === "copy-steps"
                ? copyFormat.toUpperCase()
                : mode === "image"
                  ? "PNG / PDF"
                  : mode === "video"
                    ? videoFormat.toUpperCase()
                    : "SCORM 1.2"}
            </span>
          </div>
          {mode === "copy-steps" ? (
            <textarea
              className="export-workbench-code"
              readOnly
              rows={23}
              value={copyPreview}
              aria-label="Export preview"
            />
          ) : (
            <div className="export-workbench-visual-preview">
              <div className="export-workbench-preview-header">
                <span>
                  {mode === "scorm"
                    ? "LMS course module"
                    : mode === "video"
                      ? "Video timeline"
                      : "Step-by-step guide"}
                </span>
                <strong>{selectedDemo.steps} steps</strong>
              </div>
              {Array.from({ length: Math.min(4, selectedDemo.steps) }, (_, index) => (
                <article key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{document.steps[index]?.title}</strong>
                    <small>{document.steps[index]?.description}</small>
                  </div>
                  <i aria-hidden="true" />
                </article>
              ))}
              <p>
                {mode === "scorm"
                  ? "The generated ZIP contains imsmanifest.xml, a launch page, runtime tracking, and styles."
                  : mode === "video"
                    ? "Each step becomes a timed frame using the selected resolution and frame rate."
                    : "Images and descriptions stay together so the guide can travel without an embed."}
              </p>
            </div>
          )}
          <p className="export-workbench-note">
            Local preview only: production authorization, storage, and download audit rules remain
            server-side.
          </p>
        </section>
      </div>
    </main>
  );
}
