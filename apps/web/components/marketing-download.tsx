import { MarketingHeader } from "./marketing-chrome";

const extensionFeatures = [
  "Record browser tabs",
  "Multi-tab support",
  "Record interactive demos",
  "Snap screenshots",
  "Intuitive demo editor",
  "Blur tool",
  "AI and manual voiceovers"
] as const;

const desktopFeatures = [
  "Record entire desktop window",
  "Multi-app recording",
  "Record desktop and mobile apps",
  "Automatic text generation",
  "Intuitive demo editor",
  "Blur tool",
  "AI and manual voiceovers"
] as const;

function DownloadFeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="download-feature-list">
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

const downloadFooterColumns = [
  [
    "Product",
    [
      ["Demo Recorder", "/download"],
      ["Demo Editor", "/features/edit"],
      ["Screen Recorder", "/tools/screen-recorder"],
      ["Personalization", "/features/personalization"],
      ["Analytics", "/analytics"],
      ["Guided HTML Demos", "/features/guided-html-demos"],
      ["Guided Screenshot Demos", "/features/guided-screenshot-demos"],
      ["Sandbox HTML Demos", "/features/sandbox-html-demos"],
      ["RouteHub", "/routes"],
      ["In-App Demo Hub", "/hubs"],
      ["Desktop Recorder", "/download"],
      ["Figma Plugin", "/features/figma"],
      ["Supademo AI", "/ai"],
      ["AI Demo Agent", "/ai/demo-agents"],
      ["All Features", "/features"]
    ]
  ],
  [
    "Use Cases",
    [
      ["Sales & Enablement", "/use-cases/sales-enablement"],
      ["Customer Success", "/use-cases/customer-success"],
      ["Product Marketing", "/use-cases/product-marketing"],
      ["Onboarding", "/use-cases/onboarding"],
      ["Product", "/use-cases/product"],
      ["Internal Training", "/use-cases/internal-training"],
      ["Customer Support", "/use-cases/customer-support"],
      ["All Use Cases", "/use-cases"],
      ["Industries", "/industries/software"],
      ["Software", "/industries/software"],
      ["Healthcare", "/industries/healthcare"],
      ["Finance & Banking", "/industries/finance-banking"],
      ["Government & Non-Profit", "/industries/government"]
    ]
  ],
  [
    "Resources",
    [
      ["Supademo Academy", "/academy"],
      ["Knowledge Base", "/help"],
      ["Product Updates", "/blog/product-updates"],
      ["Demo Showcase", "/showcase"],
      ["Interactive Demo Tutorials", "/tutorials"],
      ["Integrations", "/integrations"],
      ["Compare Supademo", "/compare"],
      ["Book a Live Demo", "/product-demo"],
      ["Support", "/help"],
      ["Accessibility", "/accessibility"]
    ]
  ],
  [
    "Tools",
    [
      ["Interactive Demo Builder", "/tools/interactive-demo-builder"],
      ["Interactive Walkthrough Builder", "/tools/interactive-walkthrough-builder"],
      ["Product Demo Video Maker", "/tools/product-demo-video-maker"],
      ["Free Screen Recorder", "/tools/screen-recorder"],
      ["SOP Generator", "/tools/sop-generator"],
      ["Manual Maker", "/tools/manual-maker"],
      ["Free Screenshot Editor", "/tools/free-screenshot-editor"],
      ["Screenshot Link Generator", "/tools/screenshot-link-generator"],
      ["Annotation Generator", "/tools/annotation-generator"],
      ["All Free Tools", "/tools"]
    ]
  ],
  [
    "Company",
    [
      ["Careers", "/careers"],
      ["Pricing", "/pricing"],
      ["Enterprise", "/enterprise"],
      ["Blog", "/blog"],
      ["Customers", "/customers"],
      ["Orbitax", "/customers/orbitax"],
      ["Spare", "/customers/spare"],
      ["Easy Software", "/customers/easy-software"],
      ["beehiiv", "/customers/beehiiv"],
      ["Greenpeace", "/customers/greenpeace"],
      ["Rev.io", "/customers/revio"],
      ["Bullhorn", "/customers/bullhorn"],
      ["VRIFY", "/customers/vrify"],
      ["All Case Studies", "/customers"]
    ]
  ]
] as const;

export function MarketingReferenceFooter() {
  return (
    <footer className="download-reference-footer">
      <div className="download-footer-main">
        <div className="download-footer-brand">
          <a className="download-footer-logo" href="/" aria-label="Supademo home">
            supademo
          </a>
          <h2>Ask AI about Supademo</h2>
          <div className="download-footer-ai" aria-label="AI assistants">
            {["◎", "✦", "✺", "G", "◌"].map((icon) => (
              <span key={icon}>{icon}</span>
            ))}
          </div>
          <p>
            115 E 23rd Street, Floor 4<br />
            New York, New York, USA, 10010
          </p>
          <div className="download-footer-social" aria-label="Social links">
            <a href="https://www.linkedin.com/company/supademo-hq">in</a>
            <a href="https://www.x.com/supademohq">X</a>
            <a href="https://www.youtube.com/@supademohq">▶</a>
          </div>
        </div>
        <div className="download-footer-columns">
          {downloadFooterColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links.map(([label, href]) => (
                <a href={href} key={label}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="download-footer-bottom">
        <span>©2026 Supademo, Inc. All rights reserved.</span>
        <div>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/privacy-policy/ai">AI Policy</a>
          <a href="/dpa">DPA</a>
          <a href="https://security.supademo.com/">Trust Center</a>
          <a href="/privacy-policy#cookies">Manage Cookies</a>
        </div>
        <strong>G2 4.8/5</strong>
      </div>
    </footer>
  );
}

export function MarketingDownloadPage() {
  return (
    <main className="download-page" id="main">
      <MarketingHeader />
      <section className="download-choice" aria-labelledby="download-title">
        <h1 id="download-title">Choose your demo recorder</h1>
        <p className="download-subtitle">
          Most people start with the Chrome extension for simplicity and fast setup.
        </p>
        <div className="download-choice-grid">
          <article className="download-choice-card">
            <span className="download-choice-icon" aria-hidden="true">
              ▣
            </span>
            <h2>Chrome Extension</h2>
            <p>Record interactive demos and screenshots of browser tabs and windows.</p>
            <a
              className="download-install-button"
              href="https://chromewebstore.google.com/detail/supademo-ai-interactive-d/jblbcpkejogbghfdglhfjlplchcnmohm"
              target="_blank"
              rel="noreferrer"
            >
              Install
            </a>
            <DownloadFeatureList items={extensionFeatures} />
          </article>
          <article className="download-choice-card">
            <span className="download-choice-icon" aria-hidden="true">
              ▤
            </span>
            <h2>Desktop Recorder</h2>
            <p>Record your full window, desktop apps, and mobile apps in high quality.</p>
            <div className="download-platform-actions">
              <a href="/downloaded"> Download for Mac</a>
              <a href="https://www.microsoft.com/store/apps/9MW7WVDXWWFH">▦ Download for Windows</a>
            </div>
            <DownloadFeatureList items={desktopFeatures} />
          </article>
        </div>
        <div className="download-more-options">
          <h2>Need more recording options?</h2>
          <p>
            Download the <a href="/features/figma">Figma Plugin</a> or create a Supademo by{" "}
            <a href="https://docs.supademo.com/create/by-method/create-from-uploads">
              uploading videos and images
            </a>
            .
          </p>
        </div>
      </section>
      <section className="download-cta" aria-labelledby="download-cta-title">
        <div className="download-cta-art download-cta-art-left" aria-hidden="true">
          <span>Analytics</span>
          <strong>1,357</strong>
          <strong>2,147</strong>
          <strong>72.57%</strong>
        </div>
        <div className="download-cta-copy">
          <h2 id="download-cta-title">The fastest way to create interactive product demos</h2>
          <p>
            Close deals faster, drive enablement and scale product onboarding with engaging, AI
            interactive product demos.
          </p>
          <a href="/signup">Create your first Supademo</a>
        </div>
        <div className="download-cta-art download-cta-art-right" aria-hidden="true">
          <span>supademo</span>
          <strong>◉</strong>
          <small>5 steps recorded</small>
        </div>
      </section>
      <MarketingReferenceFooter />
    </main>
  );
}
