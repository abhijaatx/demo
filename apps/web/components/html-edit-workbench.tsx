"use client";

import { resolveTemplateTokens, sanitizeHtmlContent } from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  saveLocalCaptureBundle,
  type LocalCaptureHtmlNode
} from "../src/lib/local-capture-storage";

const MAX_TEXT_LENGTH = 400;
const MAX_VARIABLE_LENGTH = 160;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

type HtmlNode = {
  readonly id: string;
  readonly tag: "heading" | "paragraph" | "image" | "button";
  readonly label: string;
  readonly text: string;
  readonly hidden: boolean;
  readonly redacted: boolean;
  readonly imageUrl: string | null;
  readonly imageName: string | null;
  readonly imageBlob?: Blob;
};

type ApplyScope = "current" | "all";

const INITIAL_NODES: readonly HtmlNode[] = [
  {
    id: "node-heading",
    tag: "heading",
    label: "Hero heading",
    text: "Welcome to {{company}}",
    hidden: false,
    redacted: false,
    imageUrl: null,
    imageName: null
  },
  {
    id: "node-copy",
    tag: "paragraph",
    label: "Hero copy",
    text: "Show {{name}} how your team can move faster.",
    hidden: false,
    redacted: false,
    imageUrl: null,
    imageName: null
  },
  {
    id: "node-image",
    tag: "image",
    label: "Product screenshot",
    text: "Product screenshot",
    hidden: false,
    redacted: false,
    imageUrl: null,
    imageName: null
  },
  {
    id: "node-button",
    tag: "button",
    label: "Primary CTA",
    text: "Start a conversation",
    hidden: false,
    redacted: false,
    imageUrl: null,
    imageName: null
  }
];

function serializeNodes(nodes: readonly HtmlNode[]): string {
  return nodes
    .filter((node) => !node.hidden)
    .map((node) => {
      if (node.tag === "image") {
        return node.redacted
          ? "<p>[REDACTED]</p>"
          : `<img alt="${node.label}" src="asset://${node.id}">`;
      }
      const tag = node.tag === "heading" ? "h1" : node.tag === "button" ? "button" : "p";
      const text = node.redacted ? "[REDACTED]" : node.text;
      return `<${tag}>${text}</${tag}>`;
    })
    .join("\n");
}

function downloadPlan(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function HtmlEditWorkbench() {
  const [nodes, setNodes] = useState<readonly HtmlNode[]>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState(INITIAL_NODES[0]!.id);
  const [scope, setScope] = useState<ApplyScope>("current");
  const [variables, setVariables] = useState({
    name: "Maya",
    company: "Northstar",
    role: "Product leader"
  });
  const [disableScroll, setDisableScroll] = useState(false);
  const [message, setMessage] = useState(
    "Select an element to edit its text, image, or protection effect."
  );
  const [error, setError] = useState("");
  const [localCaptureId, setLocalCaptureId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<{
    removedTagsCount: number;
    removedAttrsCount: number;
  } | null>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0]!;
  const renderedHtml = useMemo(
    () => sanitizeHtmlContent(serializeNodes(nodes)).sanitizedHtml,
    [nodes]
  );
  const selectedPreviewText = selectedNode.redacted
    ? "[REDACTED]"
    : resolveTemplateTokens(selectedNode.text, variables);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current.values()) URL.revokeObjectURL(url);
      objectUrlsRef.current.clear();
    };
  }, []);

  const updateSelected = (patch: Partial<HtmlNode>) => {
    setNodes((current) =>
      current.map((node) => {
        if (scope === "current") return node.id === selectedNode.id ? { ...node, ...patch } : node;
        if (node.tag !== selectedNode.tag) return node;
        return { ...node, ...patch };
      })
    );
    setReport(null);
    setError("");
    setMessage(
      scope === "all"
        ? `Applied this ${selectedNode.tag} edit to matching elements.`
        : "Element edit updated locally."
    );
  };

  const saveChanges = () => {
    const nextReport = sanitizeHtmlContent(serializeNodes(nodes));
    setReport({
      removedTagsCount: nextReport.removedTagsCount,
      removedAttrsCount: nextReport.removedAttrsCount
    });
    setMessage(
      "Changes saved locally after HTML sanitization. Review the safe export before publishing."
    );
  };

  const openEditor = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const htmlNodes: LocalCaptureHtmlNode[] = nodes.map((node) => ({
      id: node.id,
      tag: node.tag,
      label: node.hidden
        ? "Hidden element"
        : node.redacted
          ? "Redacted element"
          : node.label.slice(0, 160),
      text: node.hidden || node.redacted ? "[REDACTED]" : node.text.slice(0, MAX_TEXT_LENGTH),
      hidden: node.hidden,
      redacted: node.redacted,
      imageAssetId:
        !node.hidden && !node.redacted && node.imageBlob ? `html-image-${node.id}` : undefined
    }));
    const imageAssets = nodes
      .filter(
        (node): node is HtmlNode & { imageBlob: Blob } =>
          !node.hidden && !node.redacted && node.imageBlob instanceof Blob
      )
      .map((node) => ({
        id: `html-image-${node.id}`,
        blob: node.imageBlob,
        assetType: "image" as const,
        mimeType: node.imageBlob.type,
        width: null,
        height: null,
        title: node.imageName || node.label,
        description: "Image replacement from the sanitized HTML plan."
      }));
    const captureId = `html-${Date.now()}`;
    const saved = await saveLocalCaptureBundle({
      version: 1,
      id: captureId,
      kind: "html",
      createdAtIso: new Date().toISOString(),
      title: "Captured HTML plan",
      mimeType: "text/html",
      htmlNodes,
      htmlVariables: variables,
      htmlDisableScroll: disableScroll,
      assets: imageAssets
    });
    if (!saved) {
      setError("The sanitized HTML plan could not be saved locally.");
      setIsSaving(false);
      return;
    }
    setLocalCaptureId(captureId);
    setError("");
    setMessage(
      "The sanitized HTML plan is ready in the local editor. No page scripts were stored."
    );
    globalThis.location.assign(
      `/demos/${encodeURIComponent(`draft-${captureId}`)}/edit?capture=html&localCapture=${encodeURIComponent(captureId)}`
    );
  };

  const focusNodeOption = (nodeId: string): void => {
    globalThis.requestAnimationFrame(() => {
      document.getElementById(`html-node-option-${nodeId}`)?.focus();
    });
  };

  const handleNodeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? nodes.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % nodes.length
            : (index - 1 + nodes.length) % nodes.length;
    const nextNode = nodes[nextIndex];
    if (!nextNode) return;
    setSelectedId(nextNode.id);
    focusNodeOption(nextNode.id);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      setError("Choose a PNG, JPEG, WebP, or GIF image up to 12 MB.");
      return;
    }
    const previous = objectUrlsRef.current.get(selectedNode.id);
    if (previous) URL.revokeObjectURL(previous);
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.set(selectedNode.id, url);
    updateSelected({ imageUrl: url, imageName: file.name.slice(0, 120), imageBlob: file });
    setMessage(
      `${file.name.slice(0, 120)} ready locally. Save changes to keep the replacement in this plan.`
    );
  };

  const plan = {
    schemaVersion: 1,
    source: "browser-local-html-edit-workbench",
    scope,
    disableScroll,
    variables,
    sanitizedHtml: renderedHtml,
    nodes: nodes.map(({ id, tag, label, text, hidden, redacted, imageName, imageUrl }) => ({
      id,
      tag,
      label,
      text,
      hidden,
      redacted,
      imageName,
      imageUrl: imageUrl?.startsWith("blob:") ? "local-object-url" : imageUrl
    }))
  };

  return (
    <main className="motion-workbench-page html-edit-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Edit HTML</span>
        <h1>Personalize captured HTML without code</h1>
        <p>
          Choose an element, edit its text or image, hide or redact it, and save the change for the
          current step or every matching element.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-secondary"
          onClick={() => downloadPlan(plan, "supademo-html-edit-plan.json")}
        >
          Download plan
        </button>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-primary"
          onClick={() => void openEditor()}
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save and open editor"}
        </button>
        {localCaptureId ? (
          <a
            className="motion-workbench-button motion-workbench-button-secondary"
            href={`/demos/${encodeURIComponent(`draft-${localCaptureId}`)}/edit?capture=html&localCapture=${encodeURIComponent(localCaptureId)}`}
          >
            Open HTML plan in editor →
          </a>
        ) : null}
      </div>
      {error ? (
        <p className="html-edit-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="html-edit-workbench-layout" aria-label="HTML editor">
        <aside className="motion-workbench-panel html-edit-workbench-elements">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Element picker</span>
              <h2>Page elements</h2>
            </div>
            <span className="motion-workbench-count">{nodes.length}</span>
          </div>
          <div
            className="html-edit-workbench-element-list"
            role="listbox"
            aria-label="HTML elements"
          >
            {nodes.map((node, index) => (
              <button
                id={`html-node-option-${node.id}`}
                type="button"
                role="option"
                aria-selected={node.id === selectedNode.id}
                tabIndex={node.id === selectedNode.id ? 0 : -1}
                className={`html-edit-workbench-element${node.id === selectedNode.id ? " is-selected" : ""}`}
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                onKeyDown={(event) => handleNodeKeyDown(event, index)}
              >
                <span className="html-edit-workbench-element-icon">
                  {node.tag === "image"
                    ? "▧"
                    : node.tag === "heading"
                      ? "H"
                      : node.tag === "button"
                        ? "▣"
                        : "¶"}
                </span>
                <span>
                  <strong>{node.label}</strong>
                  <small>
                    {node.tag}
                    {node.hidden ? " · hidden" : node.redacted ? " · redacted" : ""}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={disableScroll}
              onChange={(event) => setDisableScroll(event.currentTarget.checked)}
            />
            <span>
              <strong>Disable viewer scrolling</strong>
              <small>Lock this step into a guided experience.</small>
            </span>
          </label>
        </aside>

        <section className="motion-workbench-panel html-edit-workbench-preview-panel">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Live preview</span>
              <h2>Step canvas</h2>
            </div>
            <span className="html-edit-workbench-sandbox-badge">Sandboxed preview</span>
          </div>
          <div
            className="html-edit-workbench-canvas"
            data-scroll-disabled={disableScroll ? "true" : "false"}
          >
            <div className="html-edit-workbench-browser-bar">
              <i />
              <i />
              <i />
              <small>captured-product.local</small>
            </div>
            <div className="html-edit-workbench-canvas-content">
              {nodes.map((node) =>
                node.hidden ? (
                  <div className="html-edit-workbench-hidden" key={node.id}>
                    {node.label} hidden
                  </div>
                ) : node.tag === "image" ? (
                  <button
                    type="button"
                    className={`html-edit-workbench-image${node.id === selectedNode.id ? " is-selected" : ""}`}
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    aria-label={`Select ${node.label}`}
                  >
                    {node.imageUrl ? (
                      <img src={node.imageUrl} alt={node.label} />
                    ) : (
                      <span>Replace image</span>
                    )}
                    <small>{node.imageName ?? "Product screenshot"}</small>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`html-edit-workbench-node html-edit-workbench-node-${node.tag}${node.id === selectedNode.id ? " is-selected" : ""}`}
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                  >
                    {node.redacted ? "[REDACTED]" : resolveTemplateTokens(node.text, variables)}
                  </button>
                )
              )}
            </div>
          </div>
          <div className="html-edit-workbench-safe-output">
            <span className="motion-workbench-label">Sanitized output</span>
            <pre>{renderedHtml}</pre>
            {report ? (
              <small>
                Removed {report.removedTagsCount} tags and {report.removedAttrsCount} attributes.
              </small>
            ) : null}
          </div>
        </section>

        <aside className="motion-workbench-panel html-edit-workbench-inspector">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Inspector</span>
              <h2>{selectedNode.label}</h2>
            </div>
          </div>
          <fieldset className="html-edit-workbench-fieldset">
            <legend>Apply changes to</legend>
            <label>
              <input
                type="radio"
                name="html-scope"
                checked={scope === "current"}
                onChange={() => setScope("current")}
              />{" "}
              Current step
            </label>
            <label>
              <input
                type="radio"
                name="html-scope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
              />{" "}
              All matching elements
            </label>
          </fieldset>
          {selectedNode.tag === "image" ? (
            <label className="motion-workbench-button motion-workbench-button-secondary html-edit-workbench-file-button">
              Replace image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageUpload}
                aria-label="Replace image"
              />
            </label>
          ) : (
            <label className="motion-workbench-field">
              <span>
                Text{" "}
                <output>
                  {selectedNode.text.length}/{MAX_TEXT_LENGTH}
                </output>
              </span>
              <textarea
                rows={5}
                maxLength={MAX_TEXT_LENGTH}
                value={selectedNode.text}
                onChange={(event) =>
                  updateSelected({ text: event.currentTarget.value.slice(0, MAX_TEXT_LENGTH) })
                }
              />
            </label>
          )}
          <div className="html-edit-workbench-effect-actions">
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-secondary"
              onClick={() => updateSelected({ hidden: !selectedNode.hidden })}
            >
              {selectedNode.hidden ? "Show element" : "Hide element"}
            </button>
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-secondary"
              onClick={() => updateSelected({ redacted: !selectedNode.redacted })}
            >
              {selectedNode.redacted ? "Remove redaction" : "Redact"}
            </button>
          </div>
          <div className="motion-workbench-divider" />
          <span className="motion-workbench-label">Preview variables</span>
          {Object.entries(variables).map(([name, value]) => (
            <label className="motion-workbench-field" key={name}>
              <span>{`{{${name}}}`}</span>
              <input
                value={value}
                maxLength={MAX_VARIABLE_LENGTH}
                onChange={(event) =>
                  setVariables((current) => ({
                    ...current,
                    [name]: event.currentTarget.value.slice(0, MAX_VARIABLE_LENGTH)
                  }))
                }
              />
            </label>
          ))}
          <p className="html-edit-workbench-selected-copy">
            Selected preview: <strong>{selectedPreviewText}</strong>
          </p>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary html-edit-workbench-save"
            onClick={saveChanges}
          >
            Save changes
          </button>
        </aside>
      </section>
    </main>
  );
}
