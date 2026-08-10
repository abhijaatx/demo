"use client";

import { sanitizeCsvCell } from "@supademo/domain";
import { useMemo, useState } from "react";

type ViewerKind = "known" | "unidentified";
type Device = "Desktop" | "Mobile" | "Tablet";

type Session = {
  readonly id: string;
  readonly viewer: string;
  readonly email: string | null;
  readonly kind: ViewerKind;
  readonly demo: string;
  readonly started: string;
  readonly duration: string;
  readonly views: number;
  readonly device: Device;
  readonly locale: string;
  readonly completion: number;
  readonly events: readonly string[];
};

const sessions: readonly Session[] = [
  {
    id: "session-001",
    viewer: "Sarah Chen",
    email: "sarah.chen@techcorp.com",
    kind: "known",
    demo: "Customer onboarding",
    started: "2026-07-30 14:22",
    duration: "08:42",
    views: 5,
    device: "Desktop",
    locale: "US · en-US",
    completion: 100,
    events: ["Opened step 1", "Clicked hotspot: Invite teammate", "Completed demo"]
  },
  {
    id: "session-002",
    viewer: "Alex Martinez",
    email: "alex.martinez@acme.io",
    kind: "known",
    demo: "Product walkthrough",
    started: "2026-07-30 13:08",
    duration: "03:17",
    views: 3,
    device: "Mobile",
    locale: "CA · en-CA",
    completion: 72,
    events: ["Opened step 1", "Clicked hotspot: Reports", "Dropped on step 6"]
  },
  {
    id: "session-003",
    viewer: "Anonymous viewer",
    email: null,
    kind: "unidentified",
    demo: "Analytics overview",
    started: "2026-07-30 12:44",
    duration: "01:56",
    views: 2,
    device: "Tablet",
    locale: "GB · en-GB",
    completion: 38,
    events: ["Opened step 1", "Paused on step 3", "Dropped on step 4"]
  },
  {
    id: "session-004",
    viewer: "Kim Min-jun",
    email: "kim.minjun@koreatech.kr",
    kind: "known",
    demo: "Customer onboarding",
    started: "2026-07-29 17:02",
    duration: "06:09",
    views: 4,
    device: "Desktop",
    locale: "KR · ko-KR",
    completion: 84,
    events: ["Opened step 1", "Clicked hotspot: Integrations", "Returned to step 2"]
  },
  {
    id: "session-005",
    viewer: "Anonymous viewer",
    email: null,
    kind: "unidentified",
    demo: "Product walkthrough",
    started: "2026-07-29 09:31",
    duration: "00:48",
    views: 1,
    device: "Mobile",
    locale: "IN · en-IN",
    completion: 19,
    events: ["Opened step 1", "Dropped on step 2"]
  }
];

export function SessionMetricsWorkbench() {
  const [query, setQuery] = useState("");
  const [demoFilter, setDemoFilter] = useState("all");
  const [viewerFilter, setViewerFilter] = useState<ViewerKind | "all">("all");
  const [deviceFilter, setDeviceFilter] = useState<Device | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLeads, setShowLeads] = useState(false);
  const [message, setMessage] = useState(
    "Filter individual sessions to inspect engagement, drop-offs, devices, and captured leads."
  );

  const demos = useMemo(() => [...new Set(sessions.map((session) => session.demo))], []);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase().slice(0, 120);
    return sessions.filter((session) => {
      const matchesQuery =
        !normalized ||
        [session.viewer, session.email ?? "", session.demo, session.locale].some((value) =>
          value.toLowerCase().includes(normalized)
        );
      return (
        matchesQuery &&
        (demoFilter === "all" || session.demo === demoFilter) &&
        (viewerFilter === "all" || session.kind === viewerFilter) &&
        (deviceFilter === "all" || session.device === deviceFilter)
      );
    });
  }, [demoFilter, deviceFilter, query, viewerFilter]);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const knownCount = sessions.filter((session) => session.kind === "known").length;
  const averageCompletion = Math.round(
    sessions.reduce((sum, session) => sum + session.completion, 0) / sessions.length
  );

  const exportSessions = (): void => {
    const header = "viewer,demo,started,duration,views,device,locale,completion";
    const rows = filtered.map((session) =>
      [
        session.viewer,
        session.demo,
        session.started,
        session.duration,
        String(session.views),
        session.device,
        session.locale,
        `${String(session.completion)}%`
      ]
        .map((value) => sanitizeCsvCell(value))
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "supademo-session-metrics.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(
      `Exported ${String(filtered.length)} filtered session${filtered.length === 1 ? "" : "s"}.`
    );
  };

  return (
    <main className="motion-workbench-page session-metrics-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/analytics">
          ← Back to analytics
        </a>
        <span className="motion-workbench-kicker">Session Metrics · Viewer-level insights</span>
        <h1>See how every viewer engages</h1>
        <p>
          Inspect known and unidentified viewers, session length, individual views, drop-offs,
          device information, locale, hotspot activity, and captured lead context.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="session-metrics-workbench-local-badge">Preview analytics data</span>
      </div>

      <section className="session-metrics-workbench-summary" aria-label="Session summary">
        <article>
          <span>Total sessions</span>
          <strong>{sessions.length}</strong>
          <small>Across the selected workspace</small>
        </article>
        <article>
          <span>Known viewers</span>
          <strong>{knownCount}</strong>
          <small>Email identified</small>
        </article>
        <article>
          <span>Average completion</span>
          <strong>{averageCompletion}%</strong>
          <small>Across all sample sessions</small>
        </article>
        <article>
          <span>Leads captured</span>
          <strong>2</strong>
          <small>From gated demos</small>
        </article>
      </section>

      <section
        className="motion-workbench-panel session-metrics-workbench-filters"
        aria-label="Session filters"
      >
        <div className="motion-workbench-panel-heading">
          <div>
            <span className="motion-workbench-label">Filter and export</span>
            <h2>Viewer sessions</h2>
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary"
            onClick={exportSessions}
          >
            Export CSV
          </button>
        </div>
        <div className="session-metrics-workbench-filter-grid">
          <label className="motion-workbench-field">
            <span>Search viewers or demos</span>
            <input
              type="search"
              maxLength={120}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="name, email, or demo"
            />
          </label>
          <label className="motion-workbench-field">
            <span>Demo</span>
            <select
              value={demoFilter}
              onChange={(event) => setDemoFilter(event.currentTarget.value)}
            >
              <option value="all">All demos</option>
              {demos.map((demo) => (
                <option value={demo} key={demo}>
                  {demo}
                </option>
              ))}
            </select>
          </label>
          <label className="motion-workbench-field">
            <span>Viewer</span>
            <select
              value={viewerFilter}
              onChange={(event) => setViewerFilter(event.currentTarget.value as ViewerKind | "all")}
            >
              <option value="all">Known + unidentified</option>
              <option value="known">Known viewers</option>
              <option value="unidentified">Unidentified viewers</option>
            </select>
          </label>
          <label className="motion-workbench-field">
            <span>Device</span>
            <select
              value={deviceFilter}
              onChange={(event) => setDeviceFilter(event.currentTarget.value as Device | "all")}
            >
              <option value="all">All devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>
          </label>
        </div>
        <label className="session-metrics-workbench-check">
          <input
            type="checkbox"
            checked={showLeads}
            onChange={(event) => setShowLeads(event.currentTarget.checked)}
          />
          <span>Show lead-captured sessions first</span>
        </label>
      </section>

      <section
        className="motion-workbench-panel session-metrics-workbench-table-panel"
        aria-label="Session list"
      >
        <div className="session-metrics-workbench-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Viewer</th>
                <th>Demo</th>
                <th>Last viewed</th>
                <th>Session length</th>
                <th>Views</th>
                <th>Device / locale</th>
                <th>Completion</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...filtered]
                .sort((a, b) =>
                  showLeads ? Number(Boolean(b.email)) - Number(Boolean(a.email)) : 0
                )
                .map((session) => (
                  <tr key={session.id} className={session.id === selectedId ? "is-selected" : ""}>
                    <td>
                      <button
                        type="button"
                        className="session-metrics-workbench-viewer"
                        onClick={() => setSelectedId(session.id)}
                      >
                        <strong>{session.viewer}</strong>
                        <small>{session.email ?? "Unidentified viewer"}</small>
                      </button>
                    </td>
                    <td>{session.demo}</td>
                    <td>{session.started}</td>
                    <td>{session.duration}</td>
                    <td>{session.views}</td>
                    <td>
                      {session.device}
                      <small>{session.locale}</small>
                    </td>
                    <td>
                      <span className="session-metrics-workbench-progress">
                        <i style={{ width: `${String(session.completion)}%` }} />
                      </span>
                      <strong>{session.completion}%</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="session-metrics-workbench-arrow"
                        aria-label={`Open ${session.viewer} session`}
                        onClick={() => setSelectedId(session.id)}
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="session-metrics-workbench-empty">No sessions match these filters.</p>
          ) : null}
        </div>
      </section>

      {selected ? (
        <aside
          className="motion-workbench-panel session-metrics-workbench-detail"
          aria-label="Selected session details"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Session detail</span>
              <h2>{selected.viewer}</h2>
            </div>
            <button
              type="button"
              className="motion-workbench-button"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          <p>{selected.email ?? "This viewer is unidentified but has a unique session record."}</p>
          <div className="session-metrics-workbench-detail-grid">
            <span>
              <strong>Demo</strong>
              {selected.demo}
            </span>
            <span>
              <strong>Started</strong>
              {selected.started}
            </span>
            <span>
              <strong>Duration</strong>
              {selected.duration}
            </span>
            <span>
              <strong>Device</strong>
              {selected.device} · {selected.locale}
            </span>
            <span>
              <strong>Views</strong>
              {selected.views}
            </span>
            <span>
              <strong>Completion</strong>
              {selected.completion}%
            </span>
          </div>
          <h3>Timeline</h3>
          <ol>
            {selected.events.map((event, index) => (
              <li key={`${selected.id}-${event}`}>
                <span>{index + 1}</span>
                {event}
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
      <p className="session-metrics-workbench-disclaimer">
        This preview uses illustrative viewer records. Production analytics must separate anonymous
        telemetry from identified leads, enforce workspace permissions, redact personal data in
        exports, and apply retention controls.
      </p>
    </main>
  );
}
