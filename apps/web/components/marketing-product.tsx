import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const productAreas = [
  {
    title: "Guide the next click",
    description:
      "Turn a recording into a focused path with clear steps, hotspots, chapters, and simple choices.",
    detail: "A viewer always knows where they are and what to do next.",
    className: "guided"
  },
  {
    title: "Let people try the product",
    description:
      "Build a safe sandbox for the moment a buyer or customer needs more than a video can show.",
    detail: "Keep the real workspace private while the useful interaction stays available.",
    className: "sandbox"
  },
  {
    title: "Keep the story moving",
    description:
      "Use editable AI assistance for copy, voiceover, and follow-up so the final call still belongs to your team.",
    detail: "Every suggestion stays visible, reviewable, and ready to make your own.",
    className: "assist"
  }
] as const;

function WorkflowBench() {
  return (
    <div className="product-workflow-bench" aria-label="From capture to guided product demo">
      <div className="product-bench-rail" aria-hidden="true">
        <span>Capture</span>
        <span>Guide</span>
        <span>Deliver</span>
      </div>
      <div className="product-bench-stage product-bench-capture">
        <div className="product-bench-window-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="product-bench-capture-copy">
          <strong>New pricing workflow</strong>
          <small>5 screens ready to guide</small>
        </div>
        <div className="product-bench-screen-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="product-bench-stage product-bench-guide">
        <div className="product-bench-step-list">
          <span className="is-active">01</span>
          <span>02</span>
          <span>03</span>
        </div>
        <div>
          <small>Step 01 of 05</small>
          <strong>Start with the plan your team needs.</strong>
          <p>One clear message. One visible next action.</p>
        </div>
      </div>
      <div className="product-bench-stage product-bench-deliver">
        <span className="product-bench-live">Live</span>
        <strong>Ready to share</strong>
        <p>One link, an embed, or a presentation view.</p>
        <div aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function ProductSurface({ area }: { area: (typeof productAreas)[number] }) {
  if (area.className === "guided") {
    return (
      <div
        className="product-feature-surface product-guided-surface"
        aria-label="Guided demo editor preview"
      >
        <div className="product-guided-steps" aria-hidden="true">
          <span className="is-current">1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
        <div className="product-guided-canvas">
          <small>Invite teammates</small>
          <strong>Bring the right people into the workspace.</strong>
          <span className="product-guided-button">Continue</span>
        </div>
      </div>
    );
  }

  if (area.className === "sandbox") {
    return (
      <div
        className="product-feature-surface product-sandbox-surface"
        aria-label="Product sandbox preview"
      >
        <div className="product-sandbox-nav" aria-hidden="true">
          <span>Workspace</span>
          <span className="is-active">Projects</span>
          <span>Team</span>
        </div>
        <div className="product-sandbox-content">
          <strong>New campaign</strong>
          <p>Try a realistic workflow without touching production data.</p>
          <div aria-hidden="true">
            <i />
            <i />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="product-feature-surface product-assist-surface"
      aria-label="Editable assistant preview"
    >
      <div className="product-assist-prompt">
        <span>Draft a concise step description</span>
      </div>
      <div className="product-assist-result">
        <small>Suggested copy</small>
        <p>Show the plan selector first, then let the viewer compare options at their pace.</p>
        <div>
          <span>Edit</span>
          <span>Use suggestion</span>
        </div>
      </div>
    </div>
  );
}

export function MarketingProduct() {
  return (
    <main className="marketing-home marketing-product-page" id="main">
      <MarketingHeader active="product" />

      <section className="product-page-hero" aria-labelledby="product-page-title">
        <div className="product-page-hero-copy">
          <h1 id="product-page-title">Every useful product story starts with a real moment.</h1>
          <p>
            Capture the experience people need to understand, shape it into a path, and deliver it
            where the next decision happens.
          </p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/auth">
              Start creating
            </a>
            <a className="marketing-text-action" href="#guided-demos">
              Explore the product
            </a>
          </div>
        </div>
        <WorkflowBench />
      </section>

      <section className="product-page-statement" aria-labelledby="product-statement-heading">
        <h2 id="product-statement-heading">
          A product demo should feel like the product—not a presentation about it.
        </h2>
        <p>
          Bring the work together in one calm flow: Record the moment, make the path clear, and
          share it without rebuilding the story for every audience.
        </p>
      </section>

      <section className="product-area-list" aria-label="Product capabilities">
        {productAreas.map((area, index) => (
          <article
            className={`product-area product-area-${area.className}`}
            id={`${area.className}-demos`}
            key={area.title}
          >
            <div className="product-area-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2>{area.title}</h2>
              <p>{area.description}</p>
              <small>{area.detail}</small>
              <a href="/auth">Try it in your workspace</a>
            </div>
            <ProductSurface area={area} />
          </article>
        ))}
      </section>

      <section className="product-page-close" aria-labelledby="product-close-heading">
        <div>
          <h2 id="product-close-heading">
            Make the next explanation the last one you need to give.
          </h2>
          <p>Start with one workflow. The rest gets easier to show from there.</p>
        </div>
        <a className="marketing-button marketing-button-light" href="/auth">
          Create your first demo
        </a>
      </section>

      <MarketingFooter />
    </main>
  );
}
