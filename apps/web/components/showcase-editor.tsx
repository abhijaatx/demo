"use client";

import {
  addShowcaseItem,
  addShowcaseSection,
  createShowcaseDocument,
  parseShowcaseDocument,
  publishShowcase,
  removeShowcaseItem,
  sanitizeShowcaseUrl,
  updateShowcaseDocument,
  type ShowcaseContentType,
  type ShowcaseDocument
} from "@supademo/domain";
import { Modal } from "@supademo/ui";
import { useEffect, useMemo, useState } from "react";

const MAX_SAVED_SHOWCASES = 25;
const showcaseTypes: readonly { readonly value: ShowcaseContentType; readonly label: string }[] = [
  { value: "demo", label: "Interactive demo" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF" },
  { value: "embed", label: "Embedded content" }
];

function newShowcaseId(): string {
  const suffix =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 12)
      : String(Date.now());
  return `showcase-${suffix.replace(/[^a-zA-Z0-9_-]/gu, "")}`;
}

function persistShowcase(document: ShowcaseDocument): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem("supademo_showcase_draft", JSON.stringify(document));
    const current = JSON.parse(localStorage.getItem("supademo_showcases") ?? "[]");
    const records = Array.isArray(current) ? current : [];
    const next = records
      .filter(
        (record) =>
          typeof record === "object" &&
          record !== null &&
          (record as Record<string, unknown>).id !== document.id
      )
      .slice(-MAX_SAVED_SHOWCASES + 1);
    next.push(document);
    localStorage.setItem("supademo_showcases", JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function ShowcaseEditorDialog({
  open,
  onClose,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [document, setDocument] = useState<ShowcaseDocument>(() =>
    createShowcaseDocument(newShowcaseId())
  );
  const [sectionTitle, setSectionTitle] = useState("");
  const [itemSectionId, setItemSectionId] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemType, setItemType] = useState<ShowcaseContentType>("demo");
  const [itemUrl, setItemUrl] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = createShowcaseDocument(newShowcaseId());
    setDocument(next);
    setSectionTitle("");
    setItemSectionId(next.sections[0]?.id ?? "");
    setItemTitle("");
    setItemType("demo");
    setItemUrl("");
    setItemDescription("");
    setError("");
    setShareUrl("");
  }, [open]);

  const shareOrigin =
    typeof globalThis.location?.origin === "string" ? globalThis.location.origin : "";
  const sectionOptions = useMemo(
    () => document.sections.map((section) => ({ id: section.id, title: section.title })),
    [document.sections]
  );

  const updateSectionTitle = (sectionId: string, title: string): void => {
    setDocument((current) =>
      parseShowcaseDocument({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, title: title.slice(0, 160) } : section
        )
      })
    );
  };

  const handleAddSection = (): void => {
    try {
      const next = addShowcaseSection(document, sectionTitle || "New section");
      setDocument(next);
      setSectionTitle("");
      setItemSectionId(next.sections.at(-1)?.id ?? next.sections[0]?.id ?? "");
      setError("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "The section could not be added.");
    }
  };

  const handleAddItem = (): void => {
    const targetSection = itemSectionId || document.sections[0]?.id;
    if (!targetSection) {
      setError("Add a section before adding content.");
      return;
    }
    if (itemUrl && !sanitizeShowcaseUrl(itemUrl)) {
      setError("Use a public HTTPS URL for this resource.");
      return;
    }
    try {
      setDocument(
        addShowcaseItem(document, targetSection, {
          title: itemTitle || "Untitled resource",
          type: itemType,
          url: itemUrl || null,
          description: itemDescription
        })
      );
      setItemTitle("");
      setItemUrl("");
      setItemDescription("");
      setError("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "The resource could not be added.");
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      const published = publishShowcase(document);
      if (!persistShowcase(published)) {
        setError("This browser could not save the showcase. Try again or allow local storage.");
        return;
      }
      const nextShareUrl = `${shareOrigin}/showcase?collection=${encodeURIComponent(published.id)}`;
      setShareUrl(nextShareUrl);
      try {
        await navigator.clipboard.writeText(nextShareUrl);
      } catch {
        // Copy is best effort; the URL remains visible for manual copy.
      }
      onSaved("Showcase saved and published. Share URL copied.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "The showcase could not be published.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create showcase"
      description="Group demos and resources into one shareable destination."
      className="workspace-ref-showcase-dialog"
    >
      <div className="workspace-ref-showcase-editor">
        <div className="workspace-ref-showcase-editor-actions">
          <button type="button" className="workspace-ref-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="workspace-ref-primary" onClick={() => void handleSave()}>
            Save & publish
          </button>
        </div>
        <div className="workspace-ref-showcase-editor-grid">
          <label className="workspace-ref-editor-field">
            <span>Name</span>
            <input
              value={document.title}
              maxLength={160}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setDocument((current) => updateShowcaseDocument(current, { title: value }));
              }}
            />
          </label>
          <label className="workspace-ref-editor-field">
            <span>Layout</span>
            <select
              value={document.layout}
              onChange={(event) => {
                const layout = event.currentTarget.value as ShowcaseDocument["layout"];
                setDocument((current) => updateShowcaseDocument(current, { layout }));
              }}
            >
              <option value="section">Section</option>
              <option value="checklist">Checklist</option>
              <option value="gallery">Gallery</option>
            </select>
          </label>
        </div>
        <label className="workspace-ref-editor-field">
          <span>Description</span>
          <textarea
            value={document.description}
            maxLength={600}
            rows={2}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setDocument((current) => updateShowcaseDocument(current, { description: value }));
            }}
          />
        </label>
        <label className="workspace-ref-editor-checkbox">
          <input
            type="checkbox"
            checked={document.autoplayNext}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setDocument((current) => updateShowcaseDocument(current, { autoplayNext: checked }));
            }}
          />
          <span>Next Demo Autoplay</span>
          <small>Advance to the next demo when the current one is complete.</small>
        </label>

        <section className="workspace-ref-editor-section" aria-labelledby="showcase-sections-title">
          <div className="workspace-ref-editor-section-heading">
            <div>
              <span className="workspace-ref-editor-kicker">Content</span>
              <h3 id="showcase-sections-title">Sections and resources</h3>
            </div>
            <div className="workspace-ref-editor-add-section">
              <input
                value={sectionTitle}
                maxLength={160}
                placeholder="New section name"
                aria-label="New section name"
                onChange={(event) => setSectionTitle(event.currentTarget.value)}
              />
              <button type="button" className="workspace-ref-secondary" onClick={handleAddSection}>
                Add section
              </button>
            </div>
          </div>
          <div className="workspace-ref-editor-sections">
            {document.sections.map((section) => (
              <article className="workspace-ref-editor-section-card" key={section.id}>
                <input
                  value={section.title}
                  maxLength={160}
                  aria-label={`Section name for ${section.title}`}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    updateSectionTitle(section.id, value);
                  }}
                />
                {section.items.length === 0 ? <p>No resources yet.</p> : null}
                {section.items.map((item) => (
                  <div className="workspace-ref-editor-item" key={item.id}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {showcaseTypes.find((candidate) => candidate.value === item.type)?.label}
                      </small>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() =>
                        setDocument((current) => removeShowcaseItem(current, section.id, item.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section
          className="workspace-ref-editor-resource"
          aria-labelledby="showcase-resource-title"
        >
          <h3 id="showcase-resource-title">Add demo or resource</h3>
          <div className="workspace-ref-showcase-editor-grid">
            <label className="workspace-ref-editor-field">
              <span>Section</span>
              <select
                value={itemSectionId}
                onChange={(event) => setItemSectionId(event.currentTarget.value)}
              >
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="workspace-ref-editor-field">
              <span>Type</span>
              <select
                value={itemType}
                onChange={(event) => setItemType(event.currentTarget.value as ShowcaseContentType)}
              >
                {showcaseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="workspace-ref-editor-field">
            <span>Title</span>
            <input
              value={itemTitle}
              maxLength={160}
              aria-label="Title"
              onChange={(event) => setItemTitle(event.currentTarget.value)}
            />
          </label>
          <label className="workspace-ref-editor-field">
            <span>Public HTTPS URL</span>
            <input
              value={itemUrl}
              maxLength={20_000}
              placeholder="https://app.supademo.com/demo/..."
              aria-label="Public HTTPS URL"
              onChange={(event) => setItemUrl(event.currentTarget.value)}
            />
          </label>
          <label className="workspace-ref-editor-field">
            <span>Description</span>
            <textarea
              value={itemDescription}
              maxLength={600}
              rows={2}
              aria-label="Resource description"
              onChange={(event) => setItemDescription(event.currentTarget.value)}
            />
          </label>
          <button type="button" className="workspace-ref-secondary" onClick={handleAddItem}>
            Add resource
          </button>
        </section>
        {error ? (
          <p className="workspace-ref-editor-error" role="alert">
            {error}
          </p>
        ) : null}
        {shareUrl ? (
          <label className="workspace-ref-editor-field">
            <span>Share URL</span>
            <input readOnly value={shareUrl} aria-label="Showcase share URL" />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
