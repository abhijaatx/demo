import { ApiStatusCard } from "../components/api-status-card";
import { AppShell } from "../components/app-shell";

const journeyStages = [
  {
    number: "01",
    label: "Record",
    description: "Capture a screen, import a flow, or start from a clean template.",
    action: "Choose a starting point",
    tone: "blue"
  },
  {
    number: "02",
    label: "Edit",
    description: "Arrange steps and add only the guidance your viewer needs.",
    action: "Open the editor",
    tone: "lilac"
  },
  {
    number: "03",
    label: "Share",
    description: "Preview, publish, embed, or send a focused link to your audience.",
    action: "Prepare to share",
    tone: "mint"
  }
];

const recentDemos = [
  { title: "Product tour for new teams", status: "Draft", updated: "Edited 12 min ago", steps: 8 },
  {
    title: "How to launch a campaign",
    status: "Published",
    updated: "Viewed 2 hours ago",
    steps: 12
  },
  {
    title: "Support handoff walkthrough",
    status: "Needs update",
    updated: "Edited yesterday",
    steps: 6
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="content-wrap">
        <section className="hero" aria-labelledby="welcome-heading">
          <div className="hero-copy">
            <p className="eyebrow">Workspace home</p>
            <h1 id="welcome-heading">Turn a workflow into a demo people can understand.</h1>
            <p className="hero-description">
              Capture the important moments, add a little context, and share the story without
              another meeting.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/demos?new=1">
                Create demo <span aria-hidden="true">→</span>
              </a>
              <a className="button button-secondary" href="/demos">
                Browse demos
              </a>
            </div>
          </div>
          <div className="hero-note" aria-label="Product principle">
            <span className="note-kicker">A simple path</span>
            <span className="note-line">One clear story</span>
            <span className="note-line muted">for every viewer.</span>
            <span className="note-rule" />
            <span className="note-caption">Built for the five-minute first demo.</span>
          </div>
        </section>

        <section className="journey-section" id="record" aria-labelledby="journey-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The workflow</p>
              <h2 id="journey-heading">Record → Edit → Share</h2>
            </div>
            <span className="section-note">Start simple. Add detail when it helps.</span>
          </div>
          <div className="stage-grid">
            {journeyStages.map((stage) => (
              <article className={`stage-card ${stage.tone}`} key={stage.label}>
                <div className="stage-top">
                  <span className="stage-number">{stage.number}</span>
                  <span className="stage-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <h3>{stage.label}</h3>
                <p>{stage.description}</p>
                <a href={`#${stage.label.toLowerCase()}`}>
                  {stage.action}
                  <span aria-hidden="true"> →</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel recent-panel" id="recent" aria-labelledby="recent-heading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Keep moving</p>
                <h2 id="recent-heading">Recent demos</h2>
              </div>
              <a className="text-link" href="/demos">
                View all <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="demo-list">
              {recentDemos.map((demo) => (
                <a className="demo-row" href="#demo" key={demo.title}>
                  <span className="demo-thumbnail" aria-hidden="true">
                    <span className="thumbnail-bar" />
                    <span className="thumbnail-block large" />
                    <span className="thumbnail-block" />
                    <span className="thumbnail-block short" />
                  </span>
                  <span className="demo-info">
                    <strong>{demo.title}</strong>
                    <span>
                      {demo.updated} · {demo.steps} steps
                    </span>
                  </span>
                  <span className={`status-pill ${demo.status.toLowerCase().replace(" ", "-")}`}>
                    {demo.status}
                  </span>
                  <span className="row-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </div>
          </section>
          <ApiStatusCard />
        </div>
      </div>
    </AppShell>
  );
}
