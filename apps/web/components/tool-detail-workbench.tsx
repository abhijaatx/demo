"use client";

import { useRef, useState } from "react";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function ScreenshotEditorWorkbench() {
  const [status, setStatus] = useState("Upload a screenshot to start editing.");
  const inputRef = useRef<HTMLInputElement>(null);

  function onUpload(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/u.test(file.type) || file.size > MAX_IMAGE_BYTES) {
      setStatus("Choose a PNG, JPEG, or WebP image smaller than 10 MB.");
      return;
    }
    setStatus(`${file.name} is ready to annotate.`);
  }

  return (
    <div className="tool-detail-annotation-workbench tool-detail-screenshot-workbench">
      <div className="tool-detail-annotation-editor">
        <div className="tool-detail-annotation-toolbar" aria-label="Screenshot editing tools">
          {[
            ["Crop", "Crop tool selected"],
            ["Redact", "Redact tool selected"],
            ["Arrow", "Arrow tool selected"],
            ["Rectangle", "Rectangle tool selected"],
            ["Highlighter", "Highlighter tool selected"],
            ["Text", "Text tool selected"],
            ["Background", "Background tool selected"]
          ].map(([label, message]) => (
            <button type="button" key={label} onClick={() => setStatus(message)}>
              {label}
            </button>
          ))}
        </div>
        <div className="tool-detail-screenshot-canvas">
          <div className="tool-detail-screenshot-canvas-card">
            <h3>Online Screenshot Editor</h3>
            <p>
              Upload screenshots and start editing instantly. Or use the free Chrome extension to
              capture screenshots, videos and interactive demos.
            </p>
            <div className="tool-detail-screenshot-actions">
              <a className="marketing-button" href="/download">
                Add free extension
              </a>
              <button
                type="button"
                className="marketing-button"
                onClick={() => inputRef.current?.click()}
              >
                Upload screenshot
              </button>
            </div>
            <span>or drag &amp; drop an image anywhere on this area</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => onUpload(event.target.files?.[0])}
            />
          </div>
          <div
            className="tool-detail-screenshot-footer-actions"
            aria-label="Screenshot output actions"
          >
            <button type="button" onClick={() => setStatus("Fullscreen preview toggled.")}>
              Fullscreen
            </button>
            <button type="button" onClick={() => setStatus("Screenshot copied to clipboard.")}>
              Copy
            </button>
            <button type="button" onClick={() => setStatus("Screenshot download prepared.")}>
              Download
            </button>
          </div>
          <p className="tool-detail-screenshot-status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
