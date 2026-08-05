"use client";

import {
  buildShareLinkUrl,
  calculateShareLinkExpiry,
  sanitizeShareLabel,
  type ShareLinkExpiryPreset
} from "@supademo/domain";
import { useMemo, useState } from "react";

type SharedFolder = {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly demoCount: number;
  readonly updatedAt: string;
};

const folders: readonly SharedFolder[] = [
  {
    id: "folder-product",
    name: "Product education",
    parentId: null,
    demoCount: 8,
    updatedAt: "Today"
  },
  {
    id: "folder-getting-started",
    name: "Getting started",
    parentId: "folder-product",
    demoCount: 3,
    updatedAt: "Today"
  },
  {
    id: "folder-feature-guides",
    name: "Feature guides",
    parentId: "folder-product",
    demoCount: 5,
    updatedAt: "Yesterday"
  },
  {
    id: "folder-sales",
    name: "Sales library",
    parentId: null,
    demoCount: 6,
    updatedAt: "3 days ago"
  },
  {
    id: "folder-competitive",
    name: "Competitive enablement",
    parentId: "folder-sales",
    demoCount: 2,
    updatedAt: "3 days ago"
  }
];

const expiryOptions: readonly { value: ShareLinkExpiryPreset; label: string }[] = [
  { value: "none", label: "No expiration" },
  { value: "7d", label: "Expires in 7 days" },
  { value: "30d", label: "Expires in 30 days" }
];

const demoNames = [
  "Customer onboarding",
  "Product walkthrough",
  "Analytics overview",
  "How to set up your CRM",
  "Feature release highlights",
  "Competitive battlecard"
] as const;

function createLocalShareToken(): string | null {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) return null;
  const uuid = cryptoApi.randomUUID?.();
  if (uuid) return `sl_${uuid.replace(/[^a-zA-Z0-9]/gu, "").slice(0, 32)}`;
  if (!cryptoApi.getRandomValues) return null;
  try {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    const entropy = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `sl_${entropy}`;
  } catch {
    return null;
  }
}

function descendants(folderId: string): readonly SharedFolder[] {
  const direct = folders.filter((folder) => folder.parentId === folderId);
  return direct.flatMap((folder) => [folder, ...descendants(folder.id)]);
}

function folderPath(folderId: string): readonly SharedFolder[] {
  const path: SharedFolder[] = [];
  let current = folders.find((folder) => folder.id === folderId) ?? null;
  while (current) {
    path.unshift(current);
    current = current.parentId
      ? (folders.find((folder) => folder.id === current?.parentId) ?? null)
      : null;
  }
  return path;
}

function totalDemos(folder: SharedFolder, nested: readonly SharedFolder[]): number {
  return folder.demoCount + nested.reduce((sum, child) => sum + child.demoCount, 0);
}

export function FolderSharingWorkbench() {
  const [selectedFolderId, setSelectedFolderId] = useState("folder-product");
  const [publicAccess, setPublicAccess] = useState(false);
  const [includeNested, setIncludeNested] = useState(true);
  const [trackingLabel, setTrackingLabel] = useState("product-library");
  const [expiry, setExpiry] = useState<ShareLinkExpiryPreset>("none");
  const [shareLink, setShareLink] = useState("");
  const [status, setStatus] = useState("Choose a folder to configure a public library link.");
  const [error, setError] = useState("");

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? folders[0]!;
  const nestedFolders = useMemo(
    () => (includeNested ? descendants(selectedFolder.id) : []),
    [includeNested, selectedFolder.id]
  );
  const path = useMemo(() => folderPath(selectedFolder.id), [selectedFolder.id]);
  const demoCount = totalDemos(selectedFolder, nestedFolders);
  const visibleFolders = folders.filter(
    (folder) =>
      folder.parentId === null ||
      folder.id === selectedFolder.id ||
      nestedFolders.some((child) => child.id === folder.id)
  );

  const createLink = (): void => {
    setError("");
    const token = createLocalShareToken();
    if (!token) {
      setError("Secure link generation is unavailable in this browser.");
      setStatus("Public access stayed off because a secure token could not be created.");
      return;
    }
    const safeLabel = sanitizeShareLabel(trackingLabel);
    const expiresAtMs = calculateShareLinkExpiry(expiry);
    const url = buildShareLinkUrl(`https://app.supademo.com/folder/${selectedFolder.id}`, {
      trackingLabel: safeLabel || undefined,
      token,
      expiresAtMs
    });
    setShareLink(url);
    setPublicAccess(true);
    setStatus(`Public access enabled for ${selectedFolder.name}.`);
  };

  const revokeLink = (): void => {
    setPublicAccess(false);
    setShareLink("");
    setStatus(`Public access revoked for ${selectedFolder.name}.`);
  };

  const copyLink = async (): Promise<void> => {
    if (!shareLink) return;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shareLink);
      setStatus("Folder link copied to the clipboard.");
    } catch {
      setStatus("Clipboard access was unavailable; select the link and copy it manually.");
    }
  };

  const selectFolder = (folderId: string): void => {
    setSelectedFolderId(folderId);
    setShareLink("");
    setPublicAccess(false);
    setStatus("Folder selected. Review the sharing settings before publishing.");
    setError("");
  };

  return (
    <main className="motion-workbench-page folder-sharing-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Share · Folder sharing</span>
        <h1>Share a demo library with one link</h1>
        <p>
          Publish an entire folder of Supademos and nested folders as a self-paced destination for
          onboarding, training, or sales enablement.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{status}</span>
        <span className="folder-sharing-workbench-local-badge">Local preview</span>
      </div>
      {error ? (
        <p className="folder-sharing-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="folder-sharing-workbench-layout">
        <section className="motion-workbench-panel folder-sharing-workbench-tree-panel">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Your workspace</span>
              <h2>Folders</h2>
            </div>
            <span className="motion-workbench-count">{folders.length}</span>
          </div>
          <div className="folder-sharing-workbench-tree" role="tree" aria-label="Folders">
            {visibleFolders.map((folder) => {
              const depth = folder.parentId ? 1 : 0;
              return (
                <button
                  type="button"
                  role="treeitem"
                  aria-selected={selectedFolder.id === folder.id}
                  className={`folder-sharing-workbench-tree-item ${selectedFolder.id === folder.id ? "is-selected" : ""}`}
                  style={{ paddingLeft: `${14 + depth * 20}px` }}
                  key={folder.id}
                  onClick={() => selectFolder(folder.id)}
                >
                  <span className="folder-sharing-workbench-folder-icon" aria-hidden="true" />
                  <span>
                    <strong>{folder.name}</strong>
                    <small>
                      {folder.demoCount} demos · {folder.updatedAt}
                    </small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="motion-workbench-button folder-sharing-workbench-new-folder"
            onClick={() =>
              setStatus("Create-folder flow is ready for the connected workspace API.")
            }
          >
            + New folder
          </button>
        </section>

        <section className="motion-workbench-panel folder-sharing-workbench-settings">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Selected folder</span>
              <h2>{selectedFolder.name}</h2>
            </div>
            <span
              className={`folder-sharing-workbench-access-pill ${publicAccess ? "is-public" : ""}`}
            >
              {publicAccess ? "Public" : "Private"}
            </span>
          </div>
          <div className="folder-sharing-workbench-breadcrumb" aria-label="Folder path">
            {path.map((item, index) => (
              <span key={item.id}>
                {index ? " / " : ""}
                {item.name}
              </span>
            ))}
          </div>
          <div className="folder-sharing-workbench-stat-grid">
            <article>
              <strong>{demoCount}</strong>
              <span>Supademos shared</span>
            </article>
            <article>
              <strong>{nestedFolders.length}</strong>
              <span>Nested folders</span>
            </article>
            <article>
              <strong>{publicAccess ? "On" : "Off"}</strong>
              <span>Public access</span>
            </article>
          </div>

          <label className="folder-sharing-workbench-toggle">
            <input
              type="checkbox"
              checked={publicAccess}
              onChange={(event) => {
                if (event.currentTarget.checked) createLink();
                else revokeLink();
              }}
            />
            <span>
              <strong>Enable Public Access</strong>
              <small>Anyone with the link can browse this folder and its shared content.</small>
            </span>
          </label>
          <label className="folder-sharing-workbench-toggle">
            <input
              type="checkbox"
              checked={includeNested}
              onChange={(event) => setIncludeNested(event.currentTarget.checked)}
            />
            <span>
              <strong>Include nested folders</strong>
              <small>
                Keep subfolders in the public library so viewers can browse by category.
              </small>
            </span>
          </label>

          <div className="folder-sharing-workbench-two-column">
            <label className="motion-workbench-field">
              <span>Tracking label</span>
              <input
                value={trackingLabel}
                maxLength={64}
                onChange={(event) => setTrackingLabel(event.currentTarget.value)}
                placeholder="sales-library"
              />
            </label>
            <label className="motion-workbench-field">
              <span>Link expiration</span>
              <select
                value={expiry}
                onChange={(event) => setExpiry(event.currentTarget.value as ShareLinkExpiryPreset)}
              >
                {expiryOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="folder-sharing-workbench-actions">
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={createLink}
            >
              {shareLink ? "Regenerate public link" : "Create public link"}
            </button>
            {shareLink ? (
              <button type="button" className="motion-workbench-button" onClick={revokeLink}>
                Revoke access
              </button>
            ) : null}
          </div>

          {shareLink ? (
            <div className="folder-sharing-workbench-generated">
              <span>Shareable folder link</span>
              <input aria-label="Shareable folder link" readOnly value={shareLink} />
              <button
                type="button"
                className="motion-workbench-button"
                onClick={() => void copyLink()}
              >
                Copy link
              </button>
            </div>
          ) : null}
        </section>

        <aside
          className="motion-workbench-panel folder-sharing-workbench-preview"
          aria-label="Folder preview"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Viewer preview</span>
              <h2>{selectedFolder.name}</h2>
            </div>
            <span className="folder-sharing-workbench-preview-lock" aria-hidden="true">
              {publicAccess ? "↗" : "•"}
            </span>
          </div>
          <p>
            {publicAccess
              ? "This is the public library viewers will browse from the generated link."
              : "Enable Public Access to preview the shareable library."}
          </p>
          <div className="folder-sharing-workbench-preview-card">
            <div className="folder-sharing-workbench-preview-cover">
              <span>S</span>
              <strong>{selectedFolder.name}</strong>
              <small>{demoCount} interactive demos</small>
            </div>
            <div className="folder-sharing-workbench-preview-list">
              {demoNames.slice(0, Math.min(demoCount, 4)).map((name, index) => (
                <div key={name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{name}</strong>
                  <i aria-hidden="true">→</i>
                </div>
              ))}
            </div>
          </div>
          {nestedFolders.length ? (
            <p className="folder-sharing-workbench-nested-note">
              Includes {nestedFolders.length} nested folder{nestedFolders.length === 1 ? "" : "s"}:{" "}
              {nestedFolders.map((folder) => folder.name).join(", ")}.
            </p>
          ) : null}
        </aside>
      </div>
      <p className="folder-sharing-workbench-disclaimer">
        Local preview only: production link creation, folder membership, revocation, expiry, and
        viewer authorization must be enforced by the workspace API.
      </p>
    </main>
  );
}
