"use client";

import { useEffect, useState } from "react";
import {
  readOfflineDownloads,
  removeOfflineDownload,
  type OfflineDownloadRecord
} from "../src/lib/offline-export";
import { DemoViewer } from "./demo-viewer";

export function OfflinePlayer() {
  const [downloads, setDownloads] = useState<readonly OfflineDownloadRecord[]>([]);
  const [selected, setSelected] = useState<OfflineDownloadRecord | null>(null);

  const refresh = (): void => {
    const next = readOfflineDownloads();
    setDownloads(next);
    setSelected((current) =>
      current ? (next.find((entry) => entry.demoId === current.demoId) ?? null) : null
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  if (selected) {
    return (
      <div className="offline-player-shell">
        <div className="offline-player-toolbar">
          <button type="button" className="offline-player-back" onClick={() => setSelected(null)}>
            ← Offline demos
          </button>
          <span>Available without a network connection</span>
        </div>
        <DemoViewer demoId={selected.demoId} initialDocument={selected.document} offlineOnly />
      </div>
    );
  }

  return (
    <main className="offline-player-page">
      <header className="offline-player-heading">
        <div>
          <a className="offline-player-brand" href="/home">
            <span aria-hidden="true">S</span> Supademo
          </a>
          <h1>Offline demos</h1>
          <p>Download a demo from Share → Download, then present it when you are offline.</p>
        </div>
        <button type="button" className="offline-player-refresh" onClick={refresh}>
          Refresh
        </button>
      </header>
      {downloads.length === 0 ? (
        <section className="offline-player-empty">
          <strong>No offline demos yet</strong>
          <p>Open a demo, choose Share, and download an Offline Demo package to see it here.</p>
          <a className="offline-player-primary" href="/demos">
            Browse demos
          </a>
        </section>
      ) : (
        <section className="offline-player-grid" aria-label="Downloaded demos">
          {downloads.map((download) => (
            <article className="offline-player-card" key={download.demoId}>
              <div>
                <span className="offline-player-badge">Offline ready</span>
                <h2>{download.title}</h2>
                <p>
                  {download.document.steps.length} steps · Downloaded{" "}
                  {new Date(download.downloadedAtIso).toLocaleString()}
                </p>
              </div>
              <div className="offline-player-card-actions">
                <button
                  type="button"
                  className="offline-player-primary"
                  onClick={() => setSelected(download)}
                >
                  Present
                </button>
                <button
                  type="button"
                  className="offline-player-remove"
                  onClick={() => {
                    removeOfflineDownload(download.demoId);
                    refresh();
                  }}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
