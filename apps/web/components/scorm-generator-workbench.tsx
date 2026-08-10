"use client";

import {
  buildScormFiles,
  createStoredZip,
  normalizeScormSource,
  type ScormCompletionRule
} from "@supademo/domain";
import { useMemo, useState } from "react";

const EMBED_PLACEHOLDER = `<div style="position: relative; width: 100%; aspect-ratio: 1.76;">
  <iframe src="https://app.supademo.com/embed/cmp33sl3904h9gh7abylz7nl0?embed_v=2&utm_source=embed"></iframe>
</div>`;

function slugFromTitle(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
  return slug || "interactive-demo";
}

function downloadZip(filename: string, bytes: Uint8Array): void {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const completionOptions: readonly { value: ScormCompletionRule; label: string }[] = [
  {
    value: "supademo-finish",
    label: "Auto-complete when Supademo demo finishes (recommended)"
  },
  { value: "active-time", label: "Complete after active viewing time" },
  { value: "manual", label: "Complete when learner clicks a button" },
  { value: "launched", label: "Complete when launched" }
];

export function ScormGeneratorWorkbench() {
  const [sourceText, setSourceText] = useState("");
  const [courseTitle, setCourseTitle] = useState("Interactive Demo");
  const [courseIdentifier, setCourseIdentifier] = useState("interactive-demo-course");
  const [identifierDirty, setIdentifierDirty] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1.76");
  const [minHeight, setMinHeight] = useState("480");
  const [completionRule, setCompletionRule] = useState<ScormCompletionRule>("supademo-finish");
  const [activeViewingSeconds, setActiveViewingSeconds] = useState("30");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [status, setStatus] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const normalizedSource = useMemo(() => {
    if (!sourceText.trim()) return null;
    try {
      return normalizeScormSource(sourceText);
    } catch {
      return null;
    }
  }, [sourceText]);

  function updateTitle(value: string): void {
    setCourseTitle(value);
    if (!identifierDirty) setCourseIdentifier(slugFromTitle(value));
  }

  function handleGenerate(): void {
    setBusy(true);
    setStatus("");
    try {
      const normalized = normalizeScormSource(sourceText);
      const files = buildScormFiles({
        sourceUrl: normalized.sourceUrl,
        courseTitle,
        courseIdentifier,
        aspectRatio: Number(aspectRatio),
        minHeight: Number(minHeight),
        completionRule,
        activeViewingSeconds: Number(activeViewingSeconds),
        showManualFallback
      });
      const zip = createStoredZip(files);
      downloadZip(`${slugFromTitle(courseTitle)}-scorm.zip`, zip);
      setPreviewUrl(normalized.sourceUrl);
      setStatus("SCORM package downloaded. Upload the ZIP to your LMS to launch the module.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not generate the SCORM package.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="scorm-tool-page" aria-labelledby="scorm-tool-title">
      <div className="scorm-tool-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">›</span>
        <a href="/tools">Free Tools</a>
        <span aria-hidden="true">›</span>
        <strong>Iframe to SCORM Generator</strong>
      </div>
      <div className="scorm-tool-hero">
        <div>
          <p className="tool-detail-eyebrow">Free browser-based tool</p>
          <h1 id="scorm-tool-title">Free Iframe to SCORM Generator</h1>
          <p>
            Paste any iframe, URL, HTML embed, or Supademo link to generate a SCORM 1.2 zip with an{" "}
            <code>imsmanifest.xml</code> and a SCORM runtime wrapper that any compatible LMS can
            launch and track.
          </p>
          <a className="marketing-button" href="#scorm-generator">
            Generate SCORM package <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="scorm-tool-hero-card" aria-label="SCORM package contents">
          <span>SCORM 1.2</span>
          <strong>Launch hosted content inside your LMS</strong>
          <small>Manifest · launch page · runtime · stylesheet</small>
        </div>
      </div>

      <div className="scorm-tool-layout" id="scorm-generator">
        <form
          className="scorm-generator-card"
          onSubmit={(event) => {
            event.preventDefault();
            handleGenerate();
          }}
        >
          <div className="scorm-generator-card-heading">
            <div>
              <p className="tool-detail-eyebrow">Create your package</p>
              <h2>Paste a URL or any iframe embed code</h2>
            </div>
            <button
              type="button"
              className="scorm-help-button"
              onClick={() => setTutorialOpen(true)}
            >
              How does this work?
            </button>
          </div>
          <label className="scorm-field scorm-field-wide">
            <span>Paste a URL or any iframe embed code</span>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value.slice(0, 20_000))}
              placeholder={EMBED_PLACEHOLDER}
              rows={7}
              spellCheck={false}
            />
          </label>
          <p className="scorm-field-note">
            Your embed code is processed locally in your browser. Nothing is uploaded to Supademo.
            <button
              type="button"
              className="scorm-inline-help"
              onClick={() => setTutorialOpen(true)}
            >
              How does this work?
            </button>
          </p>
          <div className="scorm-fields-grid">
            <label className="scorm-field">
              <span>Course title</span>
              <input value={courseTitle} onChange={(event) => updateTitle(event.target.value)} />
            </label>
            <label className="scorm-field">
              <span>Course identifier</span>
              <input
                value={courseIdentifier}
                onChange={(event) => {
                  setIdentifierDirty(true);
                  setCourseIdentifier(event.target.value);
                }}
              />
              <small>
                Used as the SCORM manifest identifier. Auto-generated from the course title.
              </small>
            </label>
            <label className="scorm-field">
              <span>Aspect ratio</span>
              <input
                type="number"
                min="0.5"
                max="4"
                step="0.01"
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value)}
              />
              <small>Width ÷ height. Supademo default is 1.76.</small>
            </label>
            <label className="scorm-field">
              <span>Min height (px)</span>
              <input
                type="number"
                min="160"
                max="4000"
                step="1"
                value={minHeight}
                onChange={(event) => setMinHeight(event.target.value)}
              />
              <small>Floor so the embed does not collapse in narrow LMS frames.</small>
            </label>
          </div>
          <div className="scorm-rule-row">
            <label className="scorm-field">
              <span>Completion rule</span>
              <select
                value={completionRule}
                onChange={(event) => setCompletionRule(event.target.value as ScormCompletionRule)}
              >
                {completionOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {completionRule === "active-time" ? (
              <label className="scorm-field">
                <span>Active viewing time (seconds)</span>
                <input
                  type="number"
                  min="5"
                  max="3600"
                  step="1"
                  value={activeViewingSeconds}
                  onChange={(event) => setActiveViewingSeconds(event.target.value)}
                />
                <small>
                  Pauses when the embed is off-screen or the LMS tab is in the background.
                </small>
              </label>
            ) : null}
          </div>
          <label className="scorm-checkbox">
            <input
              type="checkbox"
              checked={showManualFallback}
              onChange={(event) => setShowManualFallback(event.target.checked)}
            />
            <span>Show manual fallback button</span>
          </label>
          <p className="scorm-field-note">
            Adds a learner-facing button so the user can mark the module complete themselves.
          </p>
          <button type="submit" className="marketing-button scorm-generate-button" disabled={busy}>
            {busy ? "Generating…" : "Generate SCORM package"}
          </button>
          {status ? (
            <p className="scorm-status" role="status">
              {status}
            </p>
          ) : null}
        </form>

        <aside className="scorm-preview-card" aria-label="SCORM launch preview">
          <p className="tool-detail-eyebrow">Preview</p>
          <h2>SCORM launch preview</h2>
          {normalizedSource ? (
            <iframe
              title="SCORM launch preview"
              src={previewUrl || normalizedSource.sourceUrl}
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="scorm-preview-empty">
              <strong>Paste an embed to preview your launch page</strong>
              <p>
                Drop in a Supademo URL, iframe, or embed block. We’ll render the page learners will
                see when they launch the SCORM module.
              </p>
            </div>
          )}
          <p className="scorm-field-note">
            Final completion tracking happens inside your LMS once the SCORM ZIP is uploaded.
          </p>
          <div className="scorm-contents">
            <h3>What’s in the ZIP</h3>
            <ul>
              <li>
                <code>imsmanifest.xml</code>
              </li>
              <li>
                <code>index.html</code>
              </li>
              <li>
                <code>scorm-wrapper.js</code>
              </li>
              <li>
                <code>styles.css</code>
              </li>
            </ul>
            <p>SCORM 1.2 · uploads directly to your LMS.</p>
          </div>
        </aside>
      </div>

      {tutorialOpen ? (
        <div
          className="scorm-modal-backdrop"
          role="presentation"
          onClick={() => setTutorialOpen(false)}
        >
          <div
            className="scorm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scorm-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="scorm-modal-close"
              aria-label="Close tutorial"
              onClick={() => setTutorialOpen(false)}
            >
              ×
            </button>
            <p className="tool-detail-eyebrow">SCORM wrapper</p>
            <h2 id="scorm-modal-title">Transform Supademos or iFrames into SCORM</h2>
            <p>
              Paste a hosted HTTPS URL or iframe, choose how completion should be reported, then
              download a SCORM 1.2 ZIP for your LMS.
            </p>
            <ol>
              <li>
                The package contains a manifest, launch page, runtime wrapper, and stylesheet.
              </li>
              <li>The original content remains hosted at its URL; it is not uploaded or copied.</li>
              <li>Test the ZIP in your target LMS before assigning it to learners.</li>
            </ol>
            <button
              type="button"
              className="marketing-button"
              onClick={() => setTutorialOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
