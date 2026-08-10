import { ApiStatusCard } from "../../components/api-status-card";
import { AppShell } from "../../components/app-shell";
import { SectionView, type SectionKind } from "../../components/section-views";

const journeyStages = [
  {
    label: "Record",
    description: "Start with a sample walkthrough while your recorder is being connected.",
    action: "Browse sample demos",
    href: "/demos",
    tone: "blue"
  },
  {
    label: "Edit",
    description: "Arrange steps and add only the guidance your viewer needs.",
    action: "Open a sample",
    href: "/demos/demo-product-tour/edit?sample=1",
    tone: "lilac"
  },
  {
    label: "Share",
    description: "Preview, publish, embed, or send a focused link to your audience.",
    action: "Find a template",
    href: "/demos?folder=templates",
    tone: "mint"
  }
];

const recentDemos = [
  {
    id: "demo-product-tour",
    title: "Product tour for new teams",
    status: "Draft",
    updated: "Edited 12 min ago",
    steps: 8
  },
  {
    id: "demo-campaign-launch",
    title: "How to launch a campaign",
    status: "Published",
    updated: "Viewed 2 hours ago",
    steps: 12
  },
  {
    id: "demo-support-handoff",
    title: "Support handoff walkthrough",
    status: "Needs update",
    updated: "Edited yesterday",
    steps: 6
  }
];

const validSections: readonly SectionKind[] = ["hubs", "analytics", "leads", "billing", "help"];

type WorkspaceHomeProps = {
  searchParams?: Promise<{ section?: string }> | { section?: string };
};

export default async function WorkspaceHomePage(props: WorkspaceHomeProps) {
  const resolvedParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  const section = validSections.find((item) => item === resolvedParams.section);
  const pageTitle = section
    ? section === "hubs"
      ? "Hubs"
      : section === "analytics"
        ? "Analytics"
        : section === "leads"
          ? "Leads"
          : section === "billing"
            ? "Billing & Plans"
            : "Help & Support"
    : "Home";

  return (
    <AppShell pageTitle={pageTitle}>
      {section ? (
        <SectionView section={section} />
      ) : (
        <div className="content-wrap">
          <section className="hero" aria-labelledby="welcome-heading">
            <div className="hero-copy">
              <h1 id="welcome-heading">Make your next demo easy to follow.</h1>
              <p className="hero-description">
                Pick up a draft, capture a new workflow, or turn the steps your team knows into a
                focused walkthrough.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="/demos">
                  Explore sample demos
                </a>
                <a className="button button-secondary" href="/demos">
                  View all demos
                </a>
              </div>
            </div>
            <div className="hero-progress" aria-label="Demo creation workflow">
              <span className="hero-progress-label">Your creation flow</span>
              <div className="hero-progress-steps">
                <span className="is-current">Record</span>
                <span>Edit</span>
                <span>Share</span>
              </div>
              <p>Start with a screen. The rest stays in reach.</p>
            </div>
          </section>

          <section className="journey-section" aria-labelledby="journey-heading">
            <div className="section-heading">
              <h2 id="journey-heading">A short path from screen to shareable demo.</h2>
              <span className="section-note">
                Advanced controls appear only when you need them.
              </span>
            </div>
            <div className="stage-grid">
              {journeyStages.map((stage) => (
                <article className={`stage-card ${stage.tone}`} key={stage.label}>
                  <div className="stage-top">
                    <span className="stage-dot" aria-hidden="true" />
                    <span className="stage-status">Ready when you are</span>
                  </div>
                  <h3>{stage.label}</h3>
                  <p>{stage.description}</p>
                  <a href={stage.href}>{stage.action}</a>
                </article>
              ))}
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel recent-panel" aria-labelledby="recent-heading">
              <div className="panel-heading">
                <h2 id="recent-heading">Recent demos</h2>
                <a className="text-link" href="/demos">
                  View all
                </a>
              </div>
              <div className="demo-list">
                {recentDemos.map((demo) => (
                  <a
                    className="demo-row"
                    href={`/demos/${encodeURIComponent(demo.id)}/edit?sample=1`}
                    key={demo.id}
                  >
                    <span className="demo-thumbnail" aria-hidden="true">
                      <span className="thumbnail-bar" />
                      <span className="thumbnail-block large" />
                      <span className="thumbnail-block" />
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
                  </a>
                ))}
              </div>
            </section>
            <ApiStatusCard />
          </div>
        </div>
      )}
    </AppShell>
  );
}
