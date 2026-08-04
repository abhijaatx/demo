"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

type ReportView = "chart" | "table";

const heroArtwork = [
  {
    src: "https://supademo.com/images/explore-image-01.avif",
    alt: "Supademo demo editor preview"
  },
  {
    src: "https://supademo.com/images/explore-image-02.avif",
    alt: "Supademo sharing preview"
  },
  {
    src: "https://supademo.com/images/explore-image-03.avif",
    alt: "Supademo analytics preview"
  }
] as const;

const reportSections = [
  { id: "report-tldr", label: "TL;DR" },
  { id: "report-insights", label: "2026 insights at a glance" },
  { id: "report-findings", label: "Key findings" },
  { id: "report-why", label: "Why do interactive demos matter in 2026?" },
  { id: "report-introduction", label: "Introduction" },
  { id: "report-audience", label: "Who uses interactive demos in 2026?" },
  { id: "report-use-cases", label: "How are interactive demos used across teams?" },
  { id: "report-impact", label: "What is the impact of interactive demos?" },
  { id: "report-ai", label: "How do AI & personalization multiply impact?" },
  { id: "report-performance", label: "What do high-performing demos have in common?" },
  { id: "report-analytics", label: "How do teams use analytics?" },
  { id: "report-takeaways", label: "Key takeaways" }
] as const;

const reportDeepDiveSections = [
  {
    id: "report-departments",
    title: "Which departments use interactive demos?",
    eyebrow: "Department adoption",
    body: "Interactive demos are no longer owned by one team. Customer Success, Sales, Marketing, Product, Support, and HR/Ops all use the same format to make a workflow easier to understand.",
    items: ["Customer Success", "Sales", "Marketing", "Product", "Customer Support", "HR / Ops"]
  },
  {
    id: "report-adoption",
    title: "Is interactive demo adoption driven top-down or bottom-up?",
    eyebrow: "Adoption motion",
    body: "Mature programs combine executive sponsorship with a practical champion who can turn one successful workflow into a repeatable library.",
    items: ["Executive sponsorship", "Team champions", "Shared templates", "Visible outcomes"]
  },
  {
    id: "report-use-case-detail",
    title: "What are the use cases for interactive demos?",
    eyebrow: "Cross-functional use",
    body: "The most durable programs connect the same product truth to the moments where people ask for help: launches, enablement, onboarding, support, and internal training.",
    items: [
      "Sales enablement",
      "Customer onboarding",
      "Support docs",
      "Product launches",
      "Internal training"
    ]
  },
  {
    id: "report-cross-functional",
    title: "How is the cross-functional adoption of interactive demos?",
    eyebrow: "Shared language",
    body: "A shared demo library reduces duplicate explanations and gives every team a current, reviewable source of product context.",
    items: ["One source of truth", "Reusable chapters", "Clear ownership", "Consistent messaging"]
  },
  {
    id: "report-use-case-pairs",
    title: "What are common use case pairs?",
    eyebrow: "Program design",
    body: "The strongest pairings follow the journey: a launch demo becomes a sales follow-up, an onboarding path becomes a support answer, and a product update becomes internal enablement.",
    items: [
      "Sales + marketing",
      "Onboarding + support",
      "Product + enablement",
      "Training + operations"
    ]
  },
  {
    id: "report-adoption-drivers",
    title: "Why do teams adopt interactive demos?",
    eyebrow: "The motivation",
    body: "Teams adopt the format when the cost of repeating the same explanation becomes visible. A focused demo gives the audience control while returning time to the people who own the product.",
    items: ["Reduce meetings", "Increase clarity", "Scale expertise", "Measure the path"]
  },
  {
    id: "report-journey",
    title: "How do interactive demos shape the customer journey?",
    eyebrow: "From awareness to retention",
    body: "A demo can meet a person at the first product question and stay useful through evaluation, onboarding, adoption, and expansion.",
    items: ["Awareness", "Consideration", "Decision", "Onboarding", "Retention"]
  },
  {
    id: "report-impact-adoption",
    title: "How does the impact differ across multi-use adoption vs. single-use adoption?",
    eyebrow: "Compounding impact",
    body: "Using demos in more than one workflow compounds the value of the source capture. Teams learn which moments are useful and reuse that learning across the journey.",
    items: [
      "Single-use program",
      "Two use cases",
      "Three or more use cases",
      "Full journey coverage"
    ]
  },
  {
    id: "report-impact-journey",
    title: "How does the impact differ if demos are used more across the customer journey?",
    eyebrow: "Reach and repetition",
    body: "Programs that cover more journey stages create more opportunities for a viewer to find a clear answer without starting over.",
    items: ["More qualified views", "Shorter handoffs", "Faster onboarding", "Healthier retention"]
  },
  {
    id: "report-collaboration",
    title: "What is the impact of interactive demos on team collaboration?",
    eyebrow: "Alignment",
    body: "A shared interactive artifact gives cross-functional partners a concrete thing to review, improve, and reuse instead of passing around disconnected notes.",
    items: ["Review together", "Reuse the same proof", "Keep updates visible", "Share ownership"]
  },
  {
    id: "report-personalization",
    title: "How do teams use personalization in interactive demos?",
    eyebrow: "Relevant by default",
    body: "Light personalization makes a product story feel intentional: show the right role, the right workflow, and the right next action without duplicating production.",
    items: ["Role-based paths", "Named variables", "Industry context", "Trackable links"]
  },
  {
    id: "report-ai-detail",
    title: "How do teams use AI in interactive demos?",
    eyebrow: "Automation with guardrails",
    body: "The strongest programs use AI for repetition—voiceovers, concise copy, summaries, and routing—while keeping human judgment around claims, approvals, and publication.",
    items: ["AI voiceovers", "AI text", "Summaries", "Safe routing"]
  },
  {
    id: "report-performance-spectrum",
    title: "What is the performance spectrum of interactive demos?",
    eyebrow: "Performance patterns",
    body: "High-performing demos are not necessarily the longest. They make the promise clear, keep the path bounded, and use analytics to remove friction.",
    items: ["Clear promise", "Focused path", "Useful hotspots", "Measured outcome"]
  },
  {
    id: "report-hero-formula",
    title: "What is the ‘Hero Demo’ formula?",
    eyebrow: "A repeatable pattern",
    body: "A hero demo usually pairs 10–12 purposeful steps with concise hotspots, a strong first frame, and a next action that matches the viewer’s intent.",
    items: ["10–12 steps", "15–18 word hotspots", "80%+ completion", "3–4 channels"]
  },
  {
    id: "report-cadence",
    title: "How does the update cadence signal a mature interactive demo program?",
    eyebrow: "Freshness",
    body: "Monthly or weekly reviews keep product stories aligned with the interface and help teams learn from new questions before they become repeated support work.",
    items: ["Weekly checks", "Monthly refresh", "Named owner", "Retire stale paths"]
  },
  {
    id: "report-distribution",
    title: "How does multi-channel distribution drive demo views?",
    eyebrow: "Distribution",
    body: "The same focused path becomes more useful when it appears beside the question: on a product page, in a follow-up, inside documentation, or in onboarding.",
    items: ["Website", "Follow-up", "Docs", "Onboarding"]
  },
  {
    id: "report-analytics-detail",
    title: "What are the top ways teams use demo analytics?",
    eyebrow: "Learning loop",
    body: "Teams watch completion, meaningful step engagement, path selection, and the action after the demo to decide what to shorten, expand, or retire.",
    items: ["Completion", "Drop-off", "Path choice", "Next action"]
  }
] as const;

const reportNavigationSections = [
  ...reportSections,
  ...reportDeepDiveSections.map(({ id, title }) => ({ id, label: title }))
];

const teams = ["Overall", "Sales", "CS", "Support", "Product", "Marketing", "HR/Ops"] as const;
type Team = (typeof teams)[number];

const journeyData: Record<Team, readonly number[]> = {
  Overall: [72, 66, 58, 64, 47],
  Sales: [81, 78, 73, 46, 31],
  CS: [57, 62, 54, 83, 71],
  Support: [42, 49, 34, 78, 86],
  Product: [53, 61, 69, 56, 44],
  Marketing: [76, 71, 63, 42, 38],
  "HR/Ops": [44, 51, 38, 72, 65]
};

const journeyLabels = ["Awareness", "Consideration", "Decision", "Onboarding", "Retention"];

const impactData: ReadonlyArray<{ label: string; value: string; detail: string }> = [
  { label: "Sales cycle", value: "4.2", detail: "months saved" },
  { label: "Onboarding", value: "3.6", detail: "hours saved" },
  { label: "Support tickets", value: "2.8", detail: "fewer per account" },
  { label: "Marketing", value: "2.4", detail: "more qualified paths" },
  { label: "Internal enablement", value: "4.7", detail: "team alignment" }
];

function ReferenceImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function ReportChart({ team }: { team: Team }) {
  return (
    <div className="marketing-report-chart" aria-label={team + " customer journey chart"}>
      {journeyLabels.map((label, index) => {
        const value = journeyData[team][index] ?? 0;
        return (
          <div className="marketing-report-chart-row" key={label}>
            <span>{label}</span>
            <div className="marketing-report-chart-track" aria-hidden="true">
              <span style={{ width: value + "%" }} />
            </div>
            <strong>{value}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function ReportTable({ team }: { team: Team }) {
  return (
    <div className="marketing-report-table-wrap">
      <table className="marketing-report-table">
        <thead>
          <tr>
            <th scope="col">Journey stage</th>
            <th scope="col">Teams using demos</th>
            <th scope="col">Signal</th>
          </tr>
        </thead>
        <tbody>
          {journeyLabels.map((label, index) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{journeyData[team][index]}%</td>
              <td>{index < 2 ? "High adoption" : index === 3 ? "Growing" : "Established"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarketingReportPage() {
  const [activeTeam, setActiveTeam] = useState<Team>("Overall");
  const [view, setView] = useState<ReportView>("chart");
  const [activeSection, setActiveSection] = useState("report-tldr");

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="marketing-report-page" id="main">
      <MarketingHeader />
      <section className="marketing-report-hero" aria-labelledby="report-title">
        <div
          className="marketing-report-hero-art marketing-report-hero-art-left"
          aria-hidden="true"
        >
          <ReferenceImage src={heroArtwork[0].src} alt="" />
          <ReferenceImage src={heroArtwork[1].src} alt="" />
        </div>
        <div className="marketing-report-hero-copy">
          <p className="marketing-announcement">Interactive Research Report</p>
          <h1 id="report-title">State of Interactive Demos 2026</h1>
          <p>
            Explore data and insights from <strong>200+</strong> professionals and{" "}
            <strong>150,000+</strong> interactive demos on how to drive impact across sales,
            customer success, marketing, and more.
          </p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="#report-tldr">
              Read the report
            </a>
            <a className="marketing-button marketing-button-light" href="/signup">
              Create a Supademo
            </a>
          </div>
        </div>
        <div
          className="marketing-report-hero-art marketing-report-hero-art-right"
          aria-hidden="true"
        >
          <ReferenceImage src={heroArtwork[2].src} alt="" />
          <ReferenceImage src={heroArtwork[1].src} alt="" />
        </div>
      </section>

      <div className="marketing-report-layout">
        <aside className="marketing-report-nav" aria-label="Report navigation">
          <span className="marketing-report-nav-label">Navigation</span>
          <div className="marketing-report-nav-list">
            {reportNavigationSections.map((section) => (
              <button
                className={activeSection === section.id ? "is-active" : undefined}
                key={section.id}
                type="button"
                aria-current={activeSection === section.id ? "location" : undefined}
                onClick={() => jumpTo(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="marketing-report-content">
          <section className="marketing-report-card" id="report-tldr" aria-labelledby="tldr-title">
            <div className="marketing-report-card-heading">
              <p className="marketing-announcement">Summarize report with AI</p>
              <h2 id="tldr-title">TL;DR Overview</h2>
              <p>Explore the high-level research data from Supademo&apos;s 20-page whitepaper.</p>
            </div>
            <div id="report-insights" className="marketing-report-insights">
              <div className="marketing-report-section-heading">
                <p className="marketing-announcement">2026 insights at a glance</p>
                <h3>Insights at a glance</h3>
                <p>Switch views by team to see where interactive demos create momentum.</p>
              </div>
              <div className="marketing-report-tabs" role="tablist" aria-label="Team views">
                {teams.map((team) => (
                  <button
                    key={team}
                    type="button"
                    role="tab"
                    aria-selected={activeTeam === team}
                    onClick={() => setActiveTeam(team)}
                  >
                    {team}
                  </button>
                ))}
              </div>
              <div className="marketing-report-view-toggle" role="group" aria-label="Chart view">
                <button
                  type="button"
                  className={view === "table" ? "is-active" : undefined}
                  onClick={() => setView("table")}
                >
                  Table
                </button>
                <button
                  type="button"
                  className={view === "chart" ? "is-active" : undefined}
                  onClick={() => setView("chart")}
                >
                  Chart
                </button>
              </div>
              {view === "chart" ? (
                <ReportChart team={activeTeam} />
              ) : (
                <ReportTable team={activeTeam} />
              )}
            </div>
            <div className="marketing-report-stat-grid" aria-label="Report highlights">
              <article>
                <strong>78%</strong>
                <span>use demos in two or more use cases</span>
              </article>
              <article>
                <strong>29%</strong>
                <span>higher impact across three or more journey stages</span>
              </article>
              <article>
                <strong>7.11/10</strong>
                <span>average AI impact score across teams</span>
              </article>
            </div>
          </section>

          <section
            className="marketing-report-card marketing-report-findings"
            id="report-findings"
            aria-labelledby="findings-title"
          >
            <div className="marketing-report-section-heading">
              <p className="marketing-announcement">Key findings</p>
              <h2 id="findings-title">Key findings</h2>
            </div>
            <div className="marketing-report-finding-grid">
              {[
                [
                  "01",
                  "Interactive demos are now used across the entire organization.",
                  "78% of teams use demos in two or more use cases led by Customer Success, Product, Sales, and Marketing."
                ],
                [
                  "02",
                  "More use cases and journey stages increase impact.",
                  "Teams that use demos across three or more journey stages report up to 29% higher scores."
                ],
                [
                  "03",
                  "Top demos follow repeatable patterns.",
                  "Hero demos average 10–12 steps, clear hotspots, and simple linear flows with completion rates above 80%."
                ],
                [
                  "04",
                  "AI and personalization multiply performance.",
                  "Teams combine AI voiceovers, AI text, and light personalization to produce stronger engagement."
                ],
                [
                  "05",
                  "Cross-functional sharing improves alignment.",
                  "Shared demo libraries help Sales, CS, Product, and Support reuse the same product story."
                ],
                [
                  "06",
                  "Freshness, distribution, and analytics separate mature programs.",
                  "Teams that update monthly and optimize using analytics report higher overall impact."
                ]
              ].map(([number, title, body]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="marketing-report-card marketing-report-copy-card" id="report-why">
            <p className="marketing-announcement">Why interactive demos matter</p>
            <h2>Why do interactive demos matter in 2026?</h2>
            <p>
              Prospects, users, and buyers expect hands-on understanding fast. Traditional videos,
              screenshots, PDFs, and slide decks feel static and quickly go out of date. Interactive
              demos let people explore the useful path without waiting for another meeting.
            </p>
            <a className="marketing-text-action" href="/product-demo">
              Click to explore example interactive demos →
            </a>
          </section>

          <section
            className="marketing-report-card marketing-report-copy-card"
            id="report-introduction"
          >
            <p className="marketing-announcement">Introduction</p>
            <h2>What does a high-performing, scalable demo program look like?</h2>
            <p>
              This report combines a survey of 200+ verified professionals with performance analysis
              of thousands of demos created in 2025. Together, these datasets show how modern teams
              build, share, and improve interactive product education.
            </p>
            <div className="marketing-report-video-card">
              <span aria-hidden="true">▶</span>
              <div>
                <strong>Video recap: State of Interactive Demos 2026</strong>
                <p>A four-minute overview of the findings and the patterns to use next.</p>
              </div>
              <a href="https://www.youtube.com/watch?v=4IEfaVneZfU">Watch recap →</a>
            </div>
            <h3 className="marketing-report-inline-heading">
              Video Recap: State of Interactive Demos 2026
            </h3>
          </section>

          <section
            className="marketing-report-card marketing-report-data-card"
            id="report-audience"
          >
            <p className="marketing-announcement">Who uses interactive demos in 2026?</p>
            <h2>Who uses interactive demos in 2026?</h2>
            <h3 className="marketing-report-inline-heading">
              Which departments use interactive demos?
            </h3>
            <p>
              Adoption is broad, with Customer Success, Sales, and Marketing leading the way across
              the organizations represented in the study.
            </p>
            <div className="marketing-report-department-grid">
              {[
                ["Customer Success", "26%"],
                ["Sales", "19%"],
                ["Marketing", "17%"],
                ["Product", "14%"],
                ["Executive Leadership", "9%"],
                ["Customer Support", "8%"],
                ["HR / Ops", "7%"]
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section
            className="marketing-report-card marketing-report-copy-card"
            id="report-use-cases"
          >
            <p className="marketing-announcement">How demos are used across teams</p>
            <h2>How are interactive demos used across teams?</h2>
            <h3 className="marketing-report-inline-heading">
              What are the use cases for interactive demos?
            </h3>
            <p>
              About 78% of respondents use demos for two or more use cases, and 31% use them for
              four or more. The same clear product story can support launches, onboarding, support,
              sales, and internal enablement without starting from scratch.
            </p>
            <div className="marketing-report-use-case-pills" aria-label="Common use cases">
              {[
                "Sales enablement",
                "Customer onboarding",
                "Support docs",
                "Product launches",
                "Internal training"
              ].map((useCase) => (
                <span key={useCase}>{useCase}</span>
              ))}
            </div>
          </section>

          <section className="marketing-report-card marketing-report-data-card" id="report-impact">
            <p className="marketing-announcement">What is the impact of interactive demos?</p>
            <h2>What is the impact of interactive demos?</h2>
            <h3 className="marketing-report-inline-heading">
              How does the impact differ across multi-use adoption vs. single-use adoption?
            </h3>
            <div className="marketing-report-impact-grid">
              {impactData.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="marketing-report-card marketing-report-copy-card" id="report-ai">
            <p className="marketing-announcement">AI &amp; personalization</p>
            <h2>How do AI &amp; personalization multiply interactive demo impact?</h2>
            <h3 className="marketing-report-inline-heading">
              How do teams use AI in interactive demos?
            </h3>
            <p>
              Teams that combine AI voiceovers, AI text, and light personalization see faster
              production, more consistent messaging, and stronger engagement. The best programs use
              AI to remove repetition while keeping the human decision points clear.
            </p>
          </section>

          <section
            className="marketing-report-card marketing-report-copy-card"
            id="report-performance"
          >
            <p className="marketing-announcement">High-performing demos</p>
            <h2>What do high-performing interactive demos have in common?</h2>
            <h3 className="marketing-report-inline-heading">
              What is the &quot;Hero Demo&quot; formula?
            </h3>
            <div className="marketing-report-formula">
              <span>10–12 steps</span>
              <span>15–18 word hotspots</span>
              <span>80%+ completion</span>
              <span>3–4 distribution channels</span>
            </div>
          </section>

          <section
            className="marketing-report-card marketing-report-copy-card"
            id="report-analytics"
          >
            <p className="marketing-announcement">Measure and improve</p>
            <h2>How do teams use analytics to improve interactive demo performance?</h2>
            <h3 className="marketing-report-inline-heading">
              What are the top ways teams use demo analytics?
            </h3>
            <p>
              Mature teams watch views, completion, and the points where people drop off. They
              update demos weekly or monthly, distribute them across the channels where buyers
              already work, and use the signal to improve the next version.
            </p>
          </section>

          <section
            className="marketing-report-card marketing-report-takeaways"
            id="report-takeaways"
          >
            <p className="marketing-announcement">What to do next</p>
            <h2>What are the key takeaways of the State of Interactive Demos 2026?</h2>
            <p>
              Pick one repeatable story, keep the path focused, and share it with the team that asks
              the same question most often. The rest of the program can grow from there.
            </p>
            <a className="marketing-button" href="/signup">
              Create your first demo
            </a>
          </section>
          {reportDeepDiveSections.map((section) => (
            <section
              className="marketing-report-card marketing-report-deep-dive"
              id={section.id}
              key={section.id}
            >
              <p className="marketing-announcement">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              <div className="marketing-report-deep-dive-grid">
                {section.items.map((item, index) => (
                  <article key={item}>
                    <span>0{index + 1}</span>
                    <strong>{item}</strong>
                    <small>Interactive demo signal</small>
                  </article>
                ))}
              </div>
              <div className="marketing-report-deep-dive-note">
                <span aria-hidden="true">↗</span>
                <p>
                  The practical lesson: keep the product story focused, make the next action
                  obvious, and use the signal from real viewers to improve the next version.
                </p>
              </div>
            </section>
          ))}
          <section className="marketing-report-card marketing-report-thanks" id="report-thanks">
            <p className="marketing-announcement">Thank you for reading!</p>
            <h2>Build the next explanation your audience needs.</h2>
            <p>
              Start with one repeatable workflow, share it where the question appears, and let the
              evidence guide the next chapter of your demo program.
            </p>
            <a className="marketing-button" href="/signup">
              Create your first demo
            </a>
          </section>
        </div>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
