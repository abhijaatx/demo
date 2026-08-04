"use client";

import { parseShowcaseDocument, type ShowcaseDocument, type ShowcaseItem } from "@supademo/domain";
import { useEffect, useState } from "react";

const SHOWCASE_STORAGE_KEY = "supademo_showcases";
const MAX_COLLECTION_ID_LENGTH = 96;

function readShowcase(collectionId: string): ShowcaseDocument | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const records: unknown = JSON.parse(localStorage.getItem(SHOWCASE_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(records)) return null;
    for (const record of records.slice(-25)) {
      if (!record || typeof record !== "object") continue;
      const candidate = record as Record<string, unknown>;
      if (candidate.id !== collectionId) continue;
      return parseShowcaseDocument(candidate);
    }
  } catch {
    return null;
  }
  return null;
}

function safeCollectionId(value: string): string | null {
  const normalized = value.trim().slice(0, MAX_COLLECTION_ID_LENGTH);
  return /^[a-zA-Z0-9_-]{1,96}$/u.test(normalized) ? normalized : null;
}

function ItemAction({ item }: { item: ShowcaseItem }) {
  if (!item.url) return <span className="workspace-ref-showcase-item-empty">No link supplied</span>;
  const label =
    item.type === "demo"
      ? "Open demo"
      : item.type === "video"
        ? "Watch video"
        : item.type === "pdf"
          ? "Open PDF"
          : "Open resource";
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="workspace-ref-primary">
      {label}
    </a>
  );
}

export function WorkspaceShowcaseViewer({ collectionId }: { collectionId: string }) {
  const [showcase, setShowcase] = useState<ShowcaseDocument | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = safeCollectionId(collectionId);
    setShowcase(id ? readShowcase(id) : null);
    setReady(true);
  }, [collectionId]);

  if (!ready) {
    return (
      <main className="workspace-ref-public-showcase">
        <p>Loading showcase…</p>
      </main>
    );
  }
  if (!showcase) {
    return (
      <main className="workspace-ref-public-showcase">
        <div className="workspace-ref-public-showcase-empty">
          <span className="workspace-ref-editor-kicker">Showcase</span>
          <h1>Showcase unavailable</h1>
          <p>This local showcase is not available in this browser anymore.</p>
          <a href="/showcases" className="workspace-ref-primary">
            Back to Showcases
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="workspace-ref-public-showcase">
      <header className="workspace-ref-public-showcase-header">
        <span className="home-logo-mark" aria-hidden="true">
          S
        </span>
        <div>
          <span className="workspace-ref-editor-kicker">Showcase</span>
          <h1>{showcase.title}</h1>
          {showcase.description ? <p>{showcase.description}</p> : null}
        </div>
      </header>
      <div className="workspace-ref-public-showcase-sections">
        {showcase.sections.map((section) => (
          <section key={section.id} className="workspace-ref-public-showcase-section">
            <h2>{section.title}</h2>
            {section.items.length === 0 ? (
              <p className="workspace-ref-showcase-item-empty">No resources yet.</p>
            ) : null}
            <div className="workspace-ref-public-showcase-grid">
              {section.items.map((item) => (
                <article key={item.id} className="workspace-ref-public-showcase-card">
                  <span className="workspace-ref-editor-kicker">{item.type}</span>
                  <h3>{item.title}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                  <ItemAction item={item} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
