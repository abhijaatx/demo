type MarketingHeaderProps = {
  active?: "product" | "pricing";
  variant?: "default" | "sharing";
};

export function MarketingHeader({ active, variant = "default" }: MarketingHeaderProps) {
  const announcements = [
    {
      label: "Supademo MCP",
      copy: "Create, edit, and personalize demos with natural language via Claude, ChatGPT, and more",
      href: "/product"
    },
    {
      label: "Product Updates",
      copy: "New in June: Voiceovers 2.0 with expressive mode, Command K search, redesigned dashboard, and more",
      href: "/blog/product-updates"
    },
    {
      label: "Agentic Demos",
      copy: "Run 24/7 discovery, qualify buyers, and surface the right content in real time",
      href: "/ai/demo-agents"
    }
  ];

  return (
    <div className="marketing-public-chrome">
      <div className="marketing-announcement-strip" aria-label="Supademo updates">
        {announcements.map((announcement) => (
          <a href={announcement.href} key={announcement.label}>
            <strong>{announcement.label}</strong>
            <span>{announcement.copy}</span>
            <span className="marketing-announcement-arrow" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
      <header className="marketing-nav">
        <a className="marketing-logo" href="/" aria-label="Supademo home">
          <img
            src="https://supademo.com/images/supademo_logo.svg"
            alt="Supademo"
            width="148"
            height="32"
            referrerPolicy="no-referrer"
          />
        </a>
        <nav aria-label="Marketing navigation">
          <details className="marketing-menu">
            <summary>Platform</summary>
            <div className="marketing-menu-panel">
              <a href="/product">Product overview</a>
              <a href="/features">Features</a>
              <a href="/#workflows">How it works</a>
            </div>
          </details>
          <details className="marketing-menu">
            <summary>Solutions</summary>
            <div className="marketing-menu-panel">
              <a href="/use-cases">Use cases</a>
              <a href="/customers">Customer stories</a>
              <a href="/#workflows">Teams</a>
            </div>
          </details>
          <details className="marketing-menu">
            <summary>Resources</summary>
            <div className="marketing-menu-panel">
              <a href="/blog">Blog</a>
              <a href="/resources">Guides and templates</a>
              <a href="/tools">Free tools</a>
            </div>
          </details>
          <a href="/pricing" aria-current={active === "pricing" ? "page" : undefined}>
            Pricing
          </a>
          {variant === "sharing" ? <a href="/auth">Login</a> : null}
        </nav>
        <div className="marketing-nav-actions">
          {variant === "sharing" ? null : <a href="/auth">Login</a>}
          <a className="marketing-button marketing-button-outline" href="/product-demo">
            Request a demo
          </a>
          <a className="marketing-button marketing-button-small" href="/signup">
            Start for free <span aria-hidden="true">→</span>
          </a>
          <details className="marketing-mobile-menu">
            <summary aria-label="Open menu">☰</summary>
            <div className="marketing-mobile-menu-panel">
              <a href="/product">Platform</a>
              <a href="/use-cases">Solutions</a>
              <a href="/blog">Resources</a>
              <a href="/pricing">Pricing</a>
              <a href="/auth">Login</a>
              <a href="/signup">Start for free</a>
            </div>
          </details>
        </div>
      </header>
    </div>
  );
}

export function MarketingFooter({ variant }: { variant?: "showcase" } = {}) {
  const columns = [
    {
      title: "Product",
      links: [
        ["Features", "/features"],
        ["Pricing", "/pricing"],
        ["Integrations", "/integrations"],
        ["Security", "/security"]
      ]
    },
    {
      title: "Use Cases",
      links: [
        ["Sales & Enablement", "/use-cases/sales-enablement"],
        ["Product Marketing", "/use-cases/product-marketing"],
        ["Customer Success", "/use-cases/customer-success"],
        ["Training", "/use-cases/education-training"]
      ]
    },
    {
      title: "Industries",
      links: [
        ["Software", "/industries/software"],
        ["Healthcare", "/industries/healthcare"],
        ["Finance", "/industries/finance-banking"],
        ["Government", "/industries/government"]
      ]
    },
    {
      title: "Resources",
      links: [
        ["Blog", "/blog"],
        ["Academy", "/academy"],
        ["Tutorials", "/tutorials"],
        ["Help center", "/help"]
      ]
    },
    {
      title: "Tools",
      links: [
        ["Interactive demo builder", "/tools/interactive-demo-builder"],
        ["Screen recorder", "/tools/screen-recorder"],
        ["Screenshot editor", "/tools/free-screenshot-editor"],
        ["All tools", "/tools"]
      ]
    },
    {
      title: "Company",
      links: [
        ["Customers", "/customers"],
        ["Careers", "/careers"],
        ["Enterprise", "/enterprise"],
        ["Contact", "/product-demo"]
      ]
    }
  ] as const;

  const footerContent = (
    <>
      <div className="marketing-footer-primary">
        <a className="marketing-logo" href="/" aria-label="Supademo home">
          supademo
        </a>
        <p>Interactive product demos for people who would rather show than tell.</p>
        <div className="marketing-footer-primary-actions">
          <a href="/auth">Log in</a>
          <a className="marketing-button marketing-button-small" href="/signup">
            Start for free <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <div className="marketing-footer-grid">
        {columns.map((column) => (
          <div key={column.title}>
            <h2>{column.title}</h2>
            {column.links.map(([label, href]) => (
              <a href={href} key={label}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="marketing-footer-bottom">
        <span>© 2026 Supademo</span>
        <div>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms-of-service">Terms</a>
          <a href="/accessibility">Accessibility</a>
        </div>
      </div>
    </>
  );

  return (
    <footer
      className="marketing-footer marketing-footer-showcase"
      data-footer-variant={variant ?? "default"}
      id="resources"
    >
      <section className="showcase-footer-cta" aria-labelledby="showcase-footer-title">
        <div className="showcase-footer-cta-content">
          <h2 id="showcase-footer-title">The fastest way to create interactive product demos</h2>
          <p>
            Close deals faster, drive enablement and scale product onboarding with engaging, AI
            interactive product demos.
          </p>
          <a className="showcase-footer-cta-button" href="/signup">
            Create your first Supademo
          </a>
        </div>
        <img
          className="showcase-footer-cta-left"
          src="https://supademo.com/images/Frame-1321314117.svg"
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <img
          className="showcase-footer-cta-right"
          src="https://supademo.com/images/supademo-footer-image.svg"
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </section>
      <div className="marketing-footer-dark">{footerContent}</div>
    </footer>
  );
}
