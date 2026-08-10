"use client";

import { sanitizeCsvCell } from "@supademo/domain";
import { useMemo, useState } from "react";

type ViewerFilter = "all" | "internal" | "external";
type SourceFilter = "all" | "embed" | "share_link" | "social";
type DateRange = "7d" | "30d" | "90d";

type AnalyticsRow = {
  readonly demo: string;
  readonly owner: string;
  readonly views: number;
  readonly uniqueViewers: number;
  readonly engagement: number;
  readonly trend: number;
  readonly viewer: Exclude<ViewerFilter, "all">;
  readonly source: Exclude<SourceFilter, "all">;
};

const rows: readonly AnalyticsRow[] = [
  {
    demo: "How to set up your CRM in 5 minutes",
    owner: "Sarah Chen",
    views: 22300,
    uniqueViewers: 19500,
    engagement: 24.27,
    trend: 40,
    viewer: "external",
    source: "share_link"
  },
  {
    demo: "Homepage demo · Product features",
    owner: "Alex Martinez",
    views: 1100,
    uniqueViewers: 1000,
    engagement: 13.79,
    trend: 15,
    viewer: "external",
    source: "embed"
  },
  {
    demo: "Onboarding flow for new users",
    owner: "Kim Min-jun",
    views: 945,
    uniqueViewers: 938,
    engagement: 6.56,
    trend: 8,
    viewer: "internal",
    source: "social"
  },
  {
    demo: "How to create your first report",
    owner: "Maya Patel",
    views: 737,
    uniqueViewers: 726,
    engagement: 78.97,
    trend: 40,
    viewer: "external",
    source: "share_link"
  },
  {
    demo: "Product walkthrough demo",
    owner: "Hiroshi Tanaka",
    views: 665,
    uniqueViewers: 661,
    engagement: 3.16,
    trend: 19,
    viewer: "internal",
    source: "embed"
  },
  {
    demo: "Analytics overview",
    owner: "Jordan Lee",
    views: 520,
    uniqueViewers: 412,
    engagement: 38.45,
    trend: 12,
    viewer: "external",
    source: "social"
  }
];

const chartValues = [18, 44, 38, 62, 51, 75, 64, 82, 68, 88, 71, 96];

function downloadAnalyticsCsv(filtered: readonly AnalyticsRow[]): void {
  const header = "demo,owner,views,unique_viewers,engagement,viewer_type,source";
  const body = filtered.map((row) =>
    [
      row.demo,
      row.owner,
      String(row.views),
      String(row.uniqueViewers),
      `${String(row.engagement)}%`,
      row.viewer,
      row.source
    ]
      .map((cell) => sanitizeCsvCell(cell))
      .join(",")
  );
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "supademo-analytics.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsDashboardWorkbench() {
  const [viewerFilter, setViewerFilter] = useState<ViewerFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [metric, setMetric] = useState<"views" | "engagement">("views");
  const [tab, setTab] = useState<"supademo" | "showcase">("supademo");
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [message, setMessage] = useState("Preview analytics data is ready to explore.");

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (viewerFilter === "all" || row.viewer === viewerFilter) &&
          (sourceFilter === "all" || row.source === sourceFilter)
      ),
    [sourceFilter, viewerFilter]
  );
  const totalViews = filteredRows.reduce((sum, row) => sum + row.views, 0);
  const totalUnique = filteredRows.reduce((sum, row) => sum + row.uniqueViewers, 0);
  const averageEngagement = filteredRows.length
    ? filteredRows.reduce((sum, row) => sum + row.engagement, 0) / filteredRows.length
    : 0;
  const selected = filteredRows.find((row) => row.demo === selectedDemo) ?? null;
  const rangeLabel =
    dateRange === "7d"
      ? "Jul 24–30, 2026"
      : dateRange === "90d"
        ? "May 2–Jul 30, 2026"
        : "Jul 1–30, 2026";

  return (
    <main className="motion-workbench-page analytics-dashboard-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/analytics">
          ← Back to analytics
        </a>
        <span className="motion-workbench-kicker">Analytics · Workspace performance</span>
        <h1>See what moves viewers to action</h1>
        <p>
          Track views, engagement, drop-offs, and sharing sources across your Supademos and Showcase
          content.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="analytics-dashboard-workbench-local-badge">Preview analytics data</span>
      </div>

      <div className="analytics-dashboard-workbench-toolbar">
        <div
          className="analytics-dashboard-workbench-tabs"
          role="tablist"
          aria-label="Analytics scope"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "supademo"}
            className={tab === "supademo" ? "is-active" : ""}
            onClick={() => setTab("supademo")}
          >
            Supademo Analytics
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "showcase"}
            className={tab === "showcase" ? "is-active" : ""}
            onClick={() => setTab("showcase")}
          >
            Showcase Analytics
          </button>
        </div>
        <div className="analytics-dashboard-workbench-toolbar-actions">
          <label>
            <span>Viewer</span>
            <select
              value={viewerFilter}
              onChange={(event) => setViewerFilter(event.currentTarget.value as ViewerFilter)}
            >
              <option value="all">All viewers</option>
              <option value="internal">Internal users</option>
              <option value="external">External users</option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.currentTarget.value as SourceFilter)}
            >
              <option value="all">All sources</option>
              <option value="embed">Embedded</option>
              <option value="share_link">Share links</option>
              <option value="social">Social</option>
            </select>
          </label>
          <label>
            <span>Date range</span>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.currentTarget.value as DateRange)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <button
            type="button"
            className="motion-workbench-button"
            onClick={() => {
              downloadAnalyticsCsv(filteredRows);
              setMessage(`Exported ${String(filteredRows.length)} analytics rows.`);
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {tab === "showcase" ? (
        <p className="analytics-dashboard-workbench-info" role="note">
          Showcase-level analytics are shown as a preview. Individual demo activity remains
          available from Supademo Analytics.
        </p>
      ) : null}

      <section className="analytics-dashboard-workbench-summary" aria-label="Analytics summary">
        <article>
          <span>Total viewers</span>
          <strong>{(totalUnique / 1000).toFixed(1)}K</strong>
          <small className="is-positive">↑ 1.18%</small>
        </article>
        <article>
          <span>Total views</span>
          <strong>{(totalViews / 1000).toFixed(1)}K</strong>
          <small className="is-positive">↑ 8.40%</small>
        </article>
        <article>
          <span>Average engagement</span>
          <strong>{averageEngagement.toFixed(2)}%</strong>
          <small className="is-negative">↓ 0.81%</small>
        </article>
        <article>
          <span>Active demos</span>
          <strong>{filteredRows.length}</strong>
          <small>In this filtered view</small>
        </article>
      </section>

      <section
        className="motion-workbench-panel analytics-dashboard-workbench-chart-panel"
        aria-label="Views and engagement chart"
      >
        <div className="motion-workbench-panel-heading">
          <div>
            <span className="motion-workbench-label">{rangeLabel}</span>
            <h2>{metric === "views" ? "Viewer activity" : "Engagement rate"}</h2>
          </div>
          <fieldset className="analytics-dashboard-workbench-metric-toggle">
            <legend>Chart metric</legend>
            <label>
              <input
                type="radio"
                name="metric"
                checked={metric === "views"}
                onChange={() => setMetric("views")}
              />{" "}
              Viewers
            </label>
            <label>
              <input
                type="radio"
                name="metric"
                checked={metric === "engagement"}
                onChange={() => setMetric("engagement")}
              />{" "}
              Engagement
            </label>
          </fieldset>
        </div>
        <div
          className="analytics-dashboard-workbench-chart"
          role="img"
          aria-label={`${metric === "views" ? "Viewer" : "Engagement"} trend chart`}
        >
          {chartValues.map((value, index) => (
            <button
              type="button"
              key={index}
              title={`${rangeLabel} · ${value}${metric === "views" ? "K viewers" : "% engagement"}`}
              style={{ height: `${value}%` }}
              onClick={() =>
                setMessage(
                  `Selected ${rangeLabel} point ${String(index + 1)}: ${String(value)}${metric === "views" ? "K viewers" : "% engagement"}.`
                )
              }
            >
              <span>{value}</span>
            </button>
          ))}
        </div>
        <div className="analytics-dashboard-workbench-chart-axis">
          <span>Jul 1</span>
          <span>Jul 8</span>
          <span>Jul 15</span>
          <span>Jul 22</span>
          <span>Jul 30</span>
        </div>
      </section>

      <section
        className="motion-workbench-panel analytics-dashboard-workbench-table-panel"
        aria-label="Most viewed demos"
      >
        <div className="motion-workbench-panel-heading">
          <div>
            <span className="motion-workbench-label">Ranked content</span>
            <h2>Most viewed</h2>
          </div>
          <span className="analytics-dashboard-workbench-help">
            Views count after 3 seconds in the viewport.
          </span>
        </div>
        <div className="analytics-dashboard-workbench-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supademo</th>
                <th>Views</th>
                <th>Unique viewers</th>
                <th>Engagement</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.demo} className={selectedDemo === row.demo ? "is-selected" : ""}>
                  <td>
                    <button
                      type="button"
                      className="analytics-dashboard-workbench-demo-button"
                      onClick={() => setSelectedDemo(row.demo)}
                    >
                      <strong>{row.demo}</strong>
                      <small>{row.owner}</small>
                    </button>
                  </td>
                  <td>
                    {(row.views / 1000).toFixed(row.views >= 1000 ? 1 : 0)}K{" "}
                    <span className="is-positive">↑ {row.trend}%</span>
                  </td>
                  <td>{(row.uniqueViewers / 1000).toFixed(row.uniqueViewers >= 1000 ? 1 : 0)}K</td>
                  <td>{row.engagement.toFixed(2)}%</td>
                  <td>
                    <span className="analytics-dashboard-workbench-source">
                      {row.source === "share_link"
                        ? "Share link"
                        : row.source === "embed"
                          ? "Embed"
                          : "Social"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="analytics-dashboard-workbench-row-action"
                      onClick={() => setSelectedDemo(row.demo)}
                      aria-label={`View ${row.demo} details`}
                    >
                      →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 ? (
            <p className="analytics-dashboard-workbench-empty">
              No demos match these filters. Try a broader viewer or source filter.
            </p>
          ) : null}
        </div>
      </section>

      {selected ? (
        <aside className="analytics-dashboard-workbench-detail" aria-label="Selected demo details">
          <div>
            <span className="motion-workbench-label">Selected demo</span>
            <h2>{selected.demo}</h2>
            <p>
              Owner: {selected.owner} ·{" "}
              {selected.source === "share_link"
                ? "Share link"
                : selected.source === "embed"
                  ? "Embed"
                  : "Social"}
            </p>
          </div>
          <dl>
            <div>
              <dt>Views</dt>
              <dd>{selected.views.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Unique viewers</dt>
              <dd>{selected.uniqueViewers.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Engagement</dt>
              <dd>{selected.engagement.toFixed(2)}%</dd>
            </div>
          </dl>
          <button
            type="button"
            className="motion-workbench-button"
            onClick={() => setSelectedDemo(null)}
          >
            Close details
          </button>
        </aside>
      ) : null}
      <p className="analytics-dashboard-workbench-disclaimer">
        This local view uses illustrative analytics. Production dashboards must enforce
        workspace-scoped authorization, retention, and export auditing.
      </p>
    </main>
  );
}
