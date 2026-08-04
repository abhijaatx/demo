"use client";

import { generateIframeSnippet, generatePopupEmbedSnippet } from "@supademo/domain";
import { useMemo, useState } from "react";

type EmbedTarget = "demo" | "showcase" | "html";

const TARGET_LABELS: Record<EmbedTarget, string> = {
  demo: "Individual Supademo",
  showcase: "Multi-demo Showcase",
  html: "HTML demo"
};

function sanitizeId(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9_-]/gu, "-")
      .slice(0, 96) || "demo-onboarding"
  );
}

function generateShowcaseSnippet(
  id: string,
  aspect: string,
  fullscreen: boolean,
  lazy: boolean
): string {
  const safeId = encodeURIComponent(sanitizeId(id));
  const ratio = aspect === "4:3" ? "75.00" : aspect === "1:1" ? "100.00" : "56.25";
  const allow = fullscreen ? 'allow="fullscreen; clipboard-write"' : 'allow="clipboard-write"';
  const loading = lazy ? 'loading="lazy"' : "";
  return `<div style="position: relative; width: 100%; padding-bottom: ${ratio}%; height: 0; overflow: hidden; border-radius: 8px;">
  <iframe
    src="https://app.supademo.com/showcase/${safeId}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    ${allow}
    ${loading}
    title="Supademo Showcase"
  ></iframe>
  </div>`.trim();
}

export function EmbedWorkbench() {
  const [target, setTarget] = useState<EmbedTarget>("demo");
  const [contentId, setContentId] = useState("demo-onboarding");
  const [aspect, setAspect] = useState("16:9");
  const [fullscreen, setFullscreen] = useState(true);
  const [lazy, setLazy] = useState(true);
  const [popup, setPopup] = useState(false);
  const [message, setMessage] = useState(
    "Choose what to embed, tune the frame, and copy a ready-to-paste snippet."
  );

  const safeId = sanitizeId(contentId);
  const snippet = useMemo(() => {
    if (target === "showcase") return generateShowcaseSnippet(safeId, aspect, fullscreen, lazy);
    if (popup) return generatePopupEmbedSnippet({ demoId: safeId });
    const [aspectWidth, aspectHeight] = aspect.split(":").map(Number);
    return generateIframeSnippet({
      demoId: safeId,
      baseUrl: "https://app.supademo.com",
      aspectWidth,
      aspectHeight,
      allowFullscreen: fullscreen,
      lazyLoad: lazy
    });
  }, [aspect, fullscreen, lazy, popup, safeId, target]);

  const embedUrl =
    target === "showcase"
      ? `https://app.supademo.com/showcase/${encodeURIComponent(safeId)}`
      : `https://app.supademo.com/e/${encodeURIComponent(safeId)}`;

  const copySnippet = async (): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(snippet);
      setMessage("Embed code copied. It contains only the selected ID and safe display options.");
    } catch {
      setMessage("Copy permission was unavailable; select the code and copy it manually.");
    }
  };

  return (
    <main className="motion-workbench-page embed-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Embed · Share anywhere</span>
        <h1>Bring interactive demos into the tools you already use</h1>
        <p>
          Embed one Supademo or a multi-demo Showcase in docs, websites, learning systems, Notion,
          Confluence, Framer, or GitBook.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="embed-workbench-local-badge">Snippet generator preview</span>
      </div>

      <div className="embed-workbench-layout">
        <section
          className="motion-workbench-panel embed-workbench-editor"
          aria-label="Embed settings"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Configure</span>
              <h2>Embed settings</h2>
            </div>
            <span className="motion-workbench-count">Safe</span>
          </div>
          <fieldset className="embed-workbench-fieldset">
            <legend>What should appear?</legend>
            {(["demo", "showcase", "html"] as const).map((item) => (
              <label className="embed-workbench-radio" key={item}>
                <input
                  type="radio"
                  name="embed-target"
                  checked={target === item}
                  onChange={() => {
                    setTarget(item);
                    setPopup(false);
                  }}
                />
                <span>
                  <strong>{TARGET_LABELS[item]}</strong>
                  <small>
                    {item === "showcase"
                      ? "Present multiple demos behind one shareable URL."
                      : item === "html"
                        ? "Embed a captured HTML workflow."
                        : "Present one interactive demo."}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="motion-workbench-field">
            <span>{target === "showcase" ? "Showcase ID" : "Demo ID"}</span>
            <input
              type="text"
              maxLength={96}
              value={contentId}
              onChange={(event) => setContentId(event.currentTarget.value)}
              placeholder="demo-onboarding"
            />
            <small>Only letters, numbers, underscores, and hyphens are kept.</small>
          </label>
          <div className="embed-workbench-two-column">
            <label className="motion-workbench-field">
              <span>Aspect ratio</span>
              <select value={aspect} onChange={(event) => setAspect(event.currentTarget.value)}>
                <option value="16:9">16:9 widescreen</option>
                <option value="4:3">4:3 standard</option>
                <option value="1:1">1:1 square</option>
              </select>
            </label>
            <label className="motion-workbench-field">
              <span>Embed mode</span>
              <select
                value={popup ? "popup" : "inline"}
                onChange={(event) => setPopup(event.currentTarget.value === "popup")}
              >
                <option value="inline">Inline iframe</option>
                <option value="popup" disabled={target === "showcase"}>
                  Popup button
                </option>
              </select>
            </label>
          </div>
          <div className="embed-workbench-two-column">
            <label className="embed-workbench-check">
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={(event) => setFullscreen(event.currentTarget.checked)}
              />
              <span>Allow fullscreen</span>
            </label>
            <label className="embed-workbench-check">
              <input
                type="checkbox"
                checked={lazy}
                onChange={(event) => setLazy(event.currentTarget.checked)}
              />
              <span>Lazy-load iframe</span>
            </label>
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary embed-workbench-copy"
            onClick={() => void copySnippet()}
          >
            Copy embed code
          </button>
        </section>

        <section
          className="motion-workbench-panel embed-workbench-preview"
          aria-label="Embed preview"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Preview</span>
              <h2>{TARGET_LABELS[target]}</h2>
            </div>
            <span className="embed-workbench-url">{embedUrl}</span>
          </div>
          <div
            className={`embed-workbench-frame embed-workbench-frame-${aspect.replace(":", "-")}`}
          >
            <div className="embed-workbench-browser-bar">
              <i />
              <i />
              <i />
              <small>{target === "showcase" ? "showcase" : "interactive demo"}</small>
            </div>
            <div className="embed-workbench-body">
              <span>Supademo</span>
              <strong>
                {target === "showcase"
                  ? "Customer onboarding Showcase"
                  : target === "html"
                    ? "Captured HTML workflow"
                    : "Customer onboarding"}
              </strong>
              <p>Interactive content appears here when this snippet is added to your site.</p>
              <button type="button">{popup ? "Take a tour" : "Open demo"}</button>
            </div>
          </div>
          <label className="embed-workbench-code-label">
            <span>Generated code</span>
            <textarea readOnly rows={12} value={snippet} aria-label="Generated embed code" />
          </label>
          <p className="embed-workbench-note">
            The snippet uses an iframe with a controlled source, responsive aspect ratio, optional
            fullscreen, and lazy loading. Popup embeds use the approved Supademo script URL.
          </p>
        </section>
      </div>
      <p className="embed-workbench-disclaimer">
        This browser-local preview does not load third-party content or execute generated script.
        Publish only snippets reviewed against your site’s CSP and allowed origins.
      </p>
    </main>
  );
}
