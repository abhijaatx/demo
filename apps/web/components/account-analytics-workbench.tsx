"use client";

import { useMemo, useState } from "react";

type Activity = {
  readonly demo: string;
  readonly viewedAt: string;
  readonly views: number;
  readonly engagement: number;
  readonly intent: "High" | "Medium" | "Low";
};

type Viewer = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly accountId: string;
  readonly account: string;
  readonly role: string;
  readonly activity: readonly Activity[];
};

type Account = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly viewers: readonly string[];
};

const accounts: readonly Account[] = [
  {
    id: "account-techcorp",
    name: "TechCorp",
    domain: "techcorp.com",
    viewers: ["viewer-sarah", "viewer-maya"]
  },
  { id: "account-acme", name: "Acme", domain: "acme.io", viewers: ["viewer-alex"] },
  { id: "account-koreatech", name: "KoreaTech", domain: "koreatech.kr", viewers: ["viewer-kim"] }
];

const viewers: readonly Viewer[] = [
  {
    id: "viewer-sarah",
    name: "Sarah Chen",
    email: "sarah.chen@techcorp.com",
    accountId: "account-techcorp",
    account: "TechCorp",
    role: "VP Product",
    activity: [
      {
        demo: "Customer onboarding",
        viewedAt: "Jul 30, 2026 · 14:22",
        views: 5,
        engagement: 82,
        intent: "High"
      },
      {
        demo: "Product walkthrough",
        viewedAt: "Jul 28, 2026 · 09:11",
        views: 3,
        engagement: 64,
        intent: "High"
      },
      {
        demo: "Analytics overview",
        viewedAt: "Jul 24, 2026 · 16:03",
        views: 2,
        engagement: 38,
        intent: "Medium"
      }
    ]
  },
  {
    id: "viewer-maya",
    name: "Maya Patel",
    email: "maya.patel@techcorp.com",
    accountId: "account-techcorp",
    account: "TechCorp",
    role: "RevOps Manager",
    activity: [
      {
        demo: "How to create your first report",
        viewedAt: "Jul 29, 2026 · 11:42",
        views: 4,
        engagement: 79,
        intent: "High"
      },
      {
        demo: "Customer onboarding",
        viewedAt: "Jul 21, 2026 · 13:20",
        views: 2,
        engagement: 52,
        intent: "Medium"
      }
    ]
  },
  {
    id: "viewer-alex",
    name: "Alex Martinez",
    email: "alex.martinez@acme.io",
    accountId: "account-acme",
    account: "Acme",
    role: "Product Marketing",
    activity: [
      {
        demo: "Product walkthrough",
        viewedAt: "Jul 30, 2026 · 13:08",
        views: 3,
        engagement: 72,
        intent: "High"
      },
      {
        demo: "Homepage demo · Product features",
        viewedAt: "Jul 19, 2026 · 10:32",
        views: 1,
        engagement: 34,
        intent: "Low"
      }
    ]
  },
  {
    id: "viewer-kim",
    name: "Kim Min-jun",
    email: "kim.minjun@koreatech.kr",
    accountId: "account-koreatech",
    account: "KoreaTech",
    role: "Engineering Lead",
    activity: [
      {
        demo: "Customer onboarding",
        viewedAt: "Jul 29, 2026 · 17:02",
        views: 4,
        engagement: 84,
        intent: "High"
      },
      {
        demo: "Analytics overview",
        viewedAt: "Jul 18, 2026 · 07:44",
        views: 1,
        engagement: 27,
        intent: "Low"
      }
    ]
  }
];

export function AccountAnalyticsWorkbench() {
  const [scope, setScope] = useState<"viewers" | "accounts">("viewers");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("30d");
  const [selectedViewerId, setSelectedViewerId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Select a viewer or account to trace engagement across every demo."
  );

  const normalizedQuery = query.trim().toLowerCase().slice(0, 120);
  const filteredViewers = useMemo(
    () =>
      viewers.filter((viewer) => {
        if (!normalizedQuery) return true;
        return [
          viewer.name,
          viewer.email,
          viewer.account,
          ...viewer.activity.map((item) => item.demo)
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [normalizedQuery]
  );
  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          !normalizedQuery ||
          [account.name, account.domain].some((value) =>
            value.toLowerCase().includes(normalizedQuery)
          )
      ),
    [normalizedQuery]
  );
  const selectedViewer = viewers.find((viewer) => viewer.id === selectedViewerId) ?? null;
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;
  const accountViewers = selectedAccount
    ? viewers.filter((viewer) => selectedAccount.viewers.includes(viewer.id))
    : [];
  const accountActivities = accountViewers.flatMap((viewer) =>
    viewer.activity.map((activity) => ({ ...activity, viewer: viewer.name }))
  );

  const clearSelection = (): void => {
    setSelectedViewerId(null);
    setSelectedAccountId(null);
  };

  return (
    <main className="motion-workbench-page account-analytics-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/analytics">
          ← Back to analytics
        </a>
        <span className="motion-workbench-kicker">Analytics · Leads and accounts</span>
        <h1>Follow the whole buying journey</h1>
        <p>
          See every demo a lead or account has viewed, spot high-intent activity, and give sales and
          success teams the context to follow up.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="account-analytics-workbench-local-badge">Preview viewer data</span>
      </div>

      <section
        className="motion-workbench-panel account-analytics-workbench-controls"
        aria-label="Lead and account filters"
      >
        <div
          className="account-analytics-workbench-scope-tabs"
          role="tablist"
          aria-label="Analytics scope"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "viewers"}
            className={scope === "viewers" ? "is-active" : ""}
            onClick={() => {
              setScope("viewers");
              clearSelection();
            }}
          >
            Recent viewers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "accounts"}
            className={scope === "accounts" ? "is-active" : ""}
            onClick={() => {
              setScope("accounts");
              clearSelection();
            }}
          >
            Recent accounts
          </button>
        </div>
        <label className="motion-workbench-field">
          <span>Search viewer, account, or demo</span>
          <input
            type="search"
            maxLength={120}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="name, company, or demo"
          />
        </label>
        <label className="motion-workbench-field">
          <span>Activity range</span>
          <select value={range} onChange={(event) => setRange(event.currentTarget.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </label>
      </section>

      {scope === "viewers" ? (
        <section className="account-analytics-workbench-list" aria-label="Recent viewers">
          {filteredViewers.map((viewer) => {
            const latest = viewer.activity[0]!;
            return (
              <button
                type="button"
                className={`account-analytics-workbench-card ${selectedViewerId === viewer.id ? "is-selected" : ""}`}
                key={viewer.id}
                onClick={() => {
                  setSelectedViewerId(viewer.id);
                  setSelectedAccountId(null);
                  setMessage(
                    `${viewer.name} selected. Their full Supademo journey is shown on the right.`
                  );
                }}
              >
                <span className="account-analytics-workbench-avatar">
                  {viewer.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="account-analytics-workbench-card-copy">
                  <strong>{viewer.name}</strong>
                  <small>{viewer.email}</small>
                  <em>
                    {viewer.account} · {viewer.role}
                  </em>
                </span>
                <span className="account-analytics-workbench-card-stat">
                  <strong>{viewer.activity.length}</strong>
                  <small>demos viewed</small>
                </span>
                <span className="account-analytics-workbench-card-latest">
                  <small>Last viewed</small>
                  <strong>{latest.demo}</strong>
                  <em>{latest.viewedAt}</em>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            );
          })}
          {filteredViewers.length === 0 ? (
            <p className="account-analytics-workbench-empty">
              No viewer activity matches that search.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="account-analytics-workbench-list" aria-label="Recent accounts">
          {filteredAccounts.map((account) => {
            const activity = viewers
              .filter((viewer) => account.viewers.includes(viewer.id))
              .flatMap((viewer) => viewer.activity);
            return (
              <button
                type="button"
                className={`account-analytics-workbench-card account-analytics-workbench-account-card ${selectedAccountId === account.id ? "is-selected" : ""}`}
                key={account.id}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setSelectedViewerId(null);
                  setMessage(
                    `${account.name} selected. All engaged leads and demos are shown on the right.`
                  );
                }}
              >
                <span className="account-analytics-workbench-account-mark">
                  {account.name.slice(0, 1)}
                </span>
                <span className="account-analytics-workbench-card-copy">
                  <strong>{account.name}</strong>
                  <small>{account.domain}</small>
                  <em>{account.viewers.length} known viewers</em>
                </span>
                <span className="account-analytics-workbench-card-stat">
                  <strong>{activity.length}</strong>
                  <small>demo sessions</small>
                </span>
                <span className="account-analytics-workbench-card-latest">
                  <small>Top activity</small>
                  <strong>{activity[0]?.demo ?? "No activity"}</strong>
                  <em>{activity[0]?.viewedAt ?? "—"}</em>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            );
          })}
          {filteredAccounts.length === 0 ? (
            <p className="account-analytics-workbench-empty">
              No account activity matches that search.
            </p>
          ) : null}
        </section>
      )}

      {selectedViewer ? (
        <aside className="account-analytics-workbench-detail" aria-label="Viewer journey">
          <div className="account-analytics-workbench-detail-header">
            <div>
              <span className="motion-workbench-label">Viewer journey</span>
              <h2>{selectedViewer.name}</h2>
              <p>
                {selectedViewer.email} · {selectedViewer.role}
              </p>
            </div>
            <button type="button" className="motion-workbench-button" onClick={clearSelection}>
              Close
            </button>
          </div>
          <div className="account-analytics-workbench-detail-actions">
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={() => {
                setScope("accounts");
                setSelectedViewerId(null);
                setSelectedAccountId(selectedViewer.accountId);
                setMessage(`Opened ${selectedViewer.account} account analytics.`);
              }}
            >
              Go to account
            </button>
            <span>{selectedViewer.account}</span>
          </div>
          <div className="account-analytics-workbench-activity-list">
            {selectedViewer.activity.map((activity) => (
              <article key={`${selectedViewer.id}-${activity.demo}`}>
                <span className="account-analytics-workbench-activity-dot" />
                <div>
                  <strong>{activity.demo}</strong>
                  <small>
                    {activity.viewedAt} · {activity.views} views
                  </small>
                </div>
                <span
                  className={`account-analytics-workbench-intent is-${activity.intent.toLowerCase()}`}
                >
                  {activity.intent} intent
                </span>
                <b>{activity.engagement}%</b>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
      {selectedAccount ? (
        <aside className="account-analytics-workbench-detail" aria-label="Account journey">
          <div className="account-analytics-workbench-detail-header">
            <div>
              <span className="motion-workbench-label">Account journey</span>
              <h2>{selectedAccount.name}</h2>
              <p>
                {selectedAccount.domain} · {accountViewers.length} known viewers
              </p>
            </div>
            <button type="button" className="motion-workbench-button" onClick={clearSelection}>
              Close
            </button>
          </div>
          <div className="account-analytics-workbench-account-people">
            <span className="motion-workbench-label">People from this account</span>
            {accountViewers.map((viewer) => (
              <button
                type="button"
                key={viewer.id}
                onClick={() => {
                  setScope("viewers");
                  setSelectedAccountId(null);
                  setSelectedViewerId(viewer.id);
                  setMessage(`${viewer.name} selected from ${selectedAccount.name}.`);
                }}
              >
                <strong>{viewer.name}</strong>
                <small>
                  {viewer.email} · {viewer.role}
                </small>
                <span>→</span>
              </button>
            ))}
          </div>
          <div className="account-analytics-workbench-activity-list">
            {accountActivities.map((activity) => (
              <article key={`${activity.viewer}-${activity.demo}`}>
                <span className="account-analytics-workbench-activity-dot" />
                <div>
                  <strong>{activity.demo}</strong>
                  <small>
                    {activity.viewer} · {activity.viewedAt}
                  </small>
                </div>
                <span
                  className={`account-analytics-workbench-intent is-${activity.intent.toLowerCase()}`}
                >
                  {activity.intent}
                </span>
                <b>{activity.engagement}%</b>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
      <p className="account-analytics-workbench-disclaimer">
        This local preview uses illustrative identified viewer data. Production account analytics
        must enforce tenant-scoped access, consent, retention, and export auditing.
      </p>
    </main>
  );
}
