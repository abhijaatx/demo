"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const comparisonCategories = [
  "All",
  "AI Demo Agents",
  "Interactive Demos",
  "Video",
  "Documentation",
  "Digital Adoption"
] as const;

const comparisons = [
  [
    "Supademo vs. Navattic",
    "Interactive Demos",
    "navattic-alternative",
    "/compare/navattic-logo.png"
  ],
  ["Supademo vs. Arcade", "Interactive Demos", "arcade-alternative", "/compare/arcade-logo.png"],
  [
    "Supademo vs. Storylane",
    "Interactive Demos",
    "storylane-alternative",
    "/compare/storylane-logo.png"
  ],
  ["Supademo vs. Walnut", "Interactive Demos", "walnut-alternative", "/compare/walnut-logo.png"],
  [
    "Supademo vs. Guideflow",
    "Documentation",
    "guideflow-alternative",
    "/compare/guideflow-logo.png"
  ],
  ["Supademo vs. Reprise", "Digital Adoption", "reprise-alternative", "/compare/reprise-logo.png"],
  ["Supademo vs. Loom", "Video", "loom-alternative", "/compare/loom-logo.png"],
  ["Supademo vs. Scribe", "Documentation", "scribe-alternative", "/compare/scribe-logo.png"],
  [
    "Supademo vs. Consensus",
    "AI Demo Agents",
    "consensus-alternative",
    "/compare/consensus-logo.svg"
  ],
  [
    "Supademo vs. Demostack",
    "Interactive Demos",
    "demostack-alternative",
    "/compare/demostack-logo.png"
  ],
  ["Supademo vs. Tourial", "Interactive Demos", "tourial-alternative", "/compare/tourial-logo.png"],
  ["Supademo vs. TestBox", "AI Demo Agents", "testbox-alternative", "/compare/testbox-logo.png"],
  ["Supademo vs. Saleo", "AI Demo Agents", "saleo-alternative", "/compare/saleo-logo.png"],
  [
    "Supademo vs. Demoboost",
    "Interactive Demos",
    "demoboost-alternative",
    "/compare/demoboost-logo.png"
  ],
  [
    "Supademo vs. CloudShare",
    "Digital Adoption",
    "cloudshare-alternative",
    "/compare/cloudshare-logo.png"
  ],
  ["Supademo vs. HowdyGo", "Video", "howdygo-alternative", "/compare/howdygo-logo.png"]
] as const;

const compareLogoBase = "https://supademo.com";
const heroCompetitorLogos = [
  "/compare/navattic-logo.png",
  "/compare/walnut-logo.png",
  "/compare/arcade-logo.png",
  "/compare/loom-logo.png",
  "/compare/guideflow-logo.png",
  "/compare/consensus-logo.svg",
  "/compare/reprise-logo.png",
  "/compare/storylane-logo.png",
  "/compare/1mind-logo.png",
  "/compare/demostack-logo.png",
  "/compare/tourial-logo.png"
] as const;

const trustLogos = [
  ["Spare Logo", "/logos/spare.svg"],
  ["Jotform Logo", "/logos/jotform.svg"],
  ["Anvil Logo", "/logos/useanvil.svg"],
  ["Beehiiv Logo", "/logos/beehiiv.avif"],
  ["Ledger Logo", "/logos/ledger-logo.svg"],
  ["Visma Logo", "/logos/visma.avif"],
  ["Lightspeed Logo", "/logos/lightspeed.svg"],
  ["EngDB Logo", "/logos/engdb.svg"],
  ["Relevance AI Logo", "/logos/relevanceai.svg"],
  ["Easy Logo", "/logos/easy.svg"],
  ["VRIFY Logo", "/logos/vrify.svg"],
  ["Alibaba Logo", "/logos/alibaba.avif"],
  ["Bullhorn Logo", "/logos/bullhorn.svg"],
  ["Typeform Logo", "/logos/typeform.svg"],
  ["NetApp Logo", "/logos/netapp.svg"],
  ["RB2B Logo", "/logos/rb2b.svg"],
  ["Turo Logo", "/logos/turo.avif"],
  ["Concentrix Logo", "/logos/concentrix.svg"],
  ["VRIFY Logo", "/logos/vrify.svg"],
  ["Posh VIP Logo", "/logos/poshvip.svg"],
  ["Siemens Logo", "/logos/simens.svg"]
] as const;

const reasons = [
  {
    label: "Reason #1",
    title: "The most versatile interactive demo platform",
    body: "Create guided HTML demos, screenshot walkthroughs, sandbox environments, and screen recordings, all from one tool. Capture via the Chrome extension, desktop app, or Figma plugin. No stitching together multiple platforms.",
    action: "Explore demo types",
    href: "/features",
    art: "formats"
  },
  {
    label: "Reason #2",
    title: "Delightfully easy to use",
    body: "Supademo scores 9.3/10 for ease of use on G2. Most teams create their first demo in under 5 minutes. With AI at the heart of the workflow, from voiceovers and translation to data edits and audit, every demo feels polished without manual effort.",
    action: "Discover all features",
    href: "/features",
    art: "ease"
  },
  {
    label: "Reason #3",
    title: "Covers the entire customer journey",
    body: "Not just for sales or marketing. Teams use Supademo across the full lifecycle: landing page demos, sales outreach, onboarding walkthroughs, support docs, and training. One platform for every team.",
    action: "See use cases",
    href: "/use-cases",
    art: "journey"
  },
  {
    label: "Reason #4",
    title: "Built for team collaboration",
    body: "Your Supademo workspace is a hub of interactive demos, SOPs, walkthroughs, and tutorials for your entire team. Share externally on websites, in sales outreach, and support docs, or use internally for employee training, onboarding, and knowledge bases.",
    action: "See pricing",
    href: "/pricing",
    art: "team"
  }
] as const;

const productFeatures = [
  [
    "Record Interactive Demos",
    "Record demos in HTML, screenshot, video or in multi-demo formats.",
    "/images/scale-01.avif"
  ],
  [
    "Advanced Analytics",
    "Get deep insights into dropoff rates, conversion, engagement, and viewers.",
    "/images/scale-02.avif"
  ],
  [
    "Team Workspaces",
    "Asynchronously share, organize, and collaborate on Supademos as a team.",
    "/images/scale-03.avif"
  ],
  [
    "Trigger as In-App Tour",
    "Programmatically trigger in-app tours to better onboard and guide your users.",
    "/images/scale-04.avif"
  ],
  [
    "Auto-Translation",
    "Translate your product demos instantly in 15+ languages with the power of AI.",
    "/images/scale-05.avif"
  ],
  [
    "AI Voiceovers",
    "Elevate demos with AI voice narration for enhanced and better user engagement.",
    "/images/scale-06.avif"
  ],
  [
    "Guided HTML Demos",
    "Create guided demos by cloning and replicating your product in HTML.",
    "/images/scale-07.avif"
  ],
  [
    "Sandbox Demos",
    "Build free-exploration environments that fully emulate your product experience.",
    "/images/scale-09.avif"
  ]
] as const;

const caseStudies = [
  [
    "VRIFY",
    "VRIFY reduces enablement content production time by 75% while saving $100k+ on staff resourcing with Supademo.",
    "Nova Siegmann",
    "Sr. Manager, Product Enablement & Training",
    "/customers/vrify-case-study",
    "/logos/vrify.svg",
    "/case-studies/nova-headshot.avif"
  ],
  [
    "Bullhorn",
    "Bullhorn creates content 50% faster while increasing viewer engagement by 20% with Supademo.",
    "Robert Hoffmann",
    "Instructional Designer",
    "/customers/bullhorn-case-study",
    "/logos/bullhorn.svg",
    "/headshots/robert-headshot.avif"
  ],
  [
    "beehiiv",
    "beehiiv converts thousands of signups with 50% better conversion rates with Supademo.",
    "EJ White",
    "Head of Growth",
    "/customers/beehiiv-case-study",
    "/logos/beehiiv.avif",
    "/headshots/ej-headshot.avif"
  ],
  [
    "Easy",
    "Easy deploys interactive demos across departments and closes $100k+ in contracts with Supademo.",
    "Felix True",
    "Head of Presales",
    "/customers/easy-software-case-study",
    "/logos/easy.svg",
    "/headshots/felix-headshot.avif"
  ]
] as const;

const faqs = [
  [
    "What makes Supademo different from other interactive demo platforms?",
    "Supademo supports six demo formats in one platform: screenshots, HTML capture, video, desktop apps, Figma imports, and direct uploads. Most alternatives support one or two. Add AI voiceovers in 25+ languages, conditional branching, and step-level analytics, and you get a demo tool that covers the entire customer journey."
  ],
  [
    "How does Supademo pricing compare to alternatives?",
    "Supademo starts free with 5 demos and unlimited views. Paid plans begin at $38/mo per creator. Most direct competitors start at $500/mo or require custom enterprise contracts. See Supademo pricing for a full breakdown of what is included at every tier."
  ],
  [
    "Does Supademo support HTML-based interactive demos?",
    "Yes. Supademo supports HTML-based guided demos alongside five other formats. You can capture your live web app, edit it, add branching and CTAs, and embed it anywhere on your site or in outreach emails."
  ],
  [
    "Can Supademo replace video tools like Loom for demos?",
    "Supademo includes screen recording and video capture built in. But unlike passive video, Supademo demos are interactive: viewers click through each step at their own pace. Teams use Supademo for sales outreach, support docs, and onboarding where engagement matters more than playback."
  ],
  [
    "Why do teams switch from other demo platforms to Supademo?",
    "The most common reasons are broader format support, lower cost, faster setup, and AI features like voiceovers and translation on accessible tiers. Supademo is ranked #5 fastest-growing out of 125,000+ software products on G2."
  ],
  [
    "Does Supademo work for enterprise teams?",
    "Yes. Supademo supports SSO, audit logs, custom domains, team workspaces, and role-based permissions. Enterprise teams use it across marketing, sales, CS, and training with centralized analytics and governance. No mandatory annual contracts to get started."
  ],
  [
    "Is Supademo the right choice for non-technical teams?",
    "Supademo scores 9.3/10 for ease of use on G2. No code, no design skills, no technical setup required. Install the Chrome extension, capture your flow, and share a polished demo in minutes."
  ]
] as const;

function ReasonArt({ kind }: { kind: (typeof reasons)[number]["art"] }) {
  if (kind === "formats") {
    return (
      <div className="compare-reason-art compare-reason-art-formats" aria-hidden="true">
        <div className="compare-reason-format-grid">
          {["🌐|HTML", "🧪|Sandbox", "📸|Screenshots", "🎬|Video", "🖥️|Desktop", "🎨|Figma"].map(
            ([icon, label]) => (
              <span key={label}>
                <b>{icon}</b>
                {label}
              </span>
            )
          )}
        </div>
        <div className="compare-reason-art-footer">
          <strong>Supademo: 0/6</strong>
          <span>Others: 2/6</span>
        </div>
      </div>
    );
  }

  if (kind === "ease") {
    return (
      <div className="compare-reason-art compare-reason-art-ease" aria-hidden="true">
        <div className="compare-reason-score">
          <strong>9.3</strong>
          <span>Supademo</span>
          <small>G2 ease of use</small>
        </div>
        <div className="compare-reason-ai-list">
          <b>AI-powered</b>
          <span>🎤 Voiceovers</span>
          <span>🌍 Translation</span>
          <span>🗣️ Voice cloning</span>
          <span>📝 Text generation</span>
          <span>🔍 Audit</span>
          <span>✏️ Data edit</span>
        </div>
      </div>
    );
  }

  if (kind === "journey") {
    return (
      <div className="compare-reason-art compare-reason-art-journey" aria-hidden="true">
        <div className="compare-reason-journey-title">Customer journey coverage</div>
        {["Marketing", "Sales", "Onboarding", "Training", "Support"].map((item) => (
          <span key={item}>{item}</span>
        ))}
        <strong>Full customer journey</strong>
      </div>
    );
  }

  return (
    <div className="compare-reason-art compare-reason-art-team" aria-hidden="true">
      <div className="compare-reason-team-head">Supademo</div>
      <div className="compare-reason-art-bars">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <strong>Interactive = higher completion rates</strong>
    </div>
  );
}

export function MarketingCompare() {
  const [category, setCategory] = useState<(typeof comparisonCategories)[number]>("All");
  const [visibleComparisons, setVisibleComparisons] = useState(6);
  const [featureSlide, setFeatureSlide] = useState(0);
  const [trustCategory, setTrustCategory] = useState("Featured");
  const [trustPickerOpen, setTrustPickerOpen] = useState(false);
  const trustCategories = [
    "Featured",
    "Enterprise",
    "Software",
    "Finance & Banking",
    "Healthcare",
    "Government & Non-Profit"
  ] as const;

  const visibleCards = useMemo(
    () =>
      comparisons
        .filter(([, cardCategory]) => category === "All" || cardCategory === category)
        .slice(0, visibleComparisons),
    [category, visibleComparisons]
  );
  function chooseCategory(next: (typeof comparisonCategories)[number]) {
    setCategory(next);
    setVisibleComparisons(6);
  }

  return (
    <main className="compare-page" id="main">
      <MarketingHeader />
      <section className="compare-hero" aria-labelledby="compare-title">
        <div className="compare-hero-bubbles" aria-hidden="true">
          {heroCompetitorLogos.map((src, index) => (
            <span key={src} className={`compare-hero-logo compare-hero-logo-${index}`}>
              <img src={`${compareLogoBase}${src}`} alt="" referrerPolicy="no-referrer" />
            </span>
          ))}
        </div>
        <p className="compare-eyebrow">Compare</p>
        <h1 id="compare-title">Compare Supademo to every alternative</h1>
        <p>
          Supademo is a top-rated interactive demo platform on G2. See how it stacks up against demo
          automation, video, and process documentation tools.
        </p>
        <div className="compare-hero-actions">
          <a className="marketing-button" href="#comparisons">
            Compare Supademo <span aria-hidden="true">→</span>
          </a>
          <a className="marketing-button marketing-button-outline" href="/product-demo">
            Book a live demo
          </a>
        </div>
      </section>

      <section className="compare-trust" aria-labelledby="compare-trust-title">
        <div className="compare-trust-heading">
          <h2 id="compare-trust-title">
            Trusted by 200,000+ top operators and 3,000+ paying organizations
          </h2>
          <div className="compare-badges" aria-label="Awards and recognition">
            <img
              src="https://supademo.com/images/supademo-rating-03.webp"
              alt="Awards and trust badges from G2 and Google highlighting top rankings and leadership."
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <img
              src="https://supademo.com/images/supademo-rating-02.webp"
              alt="Awards and trust badges from G2 and Google highlighting high performance and user ratings."
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="compare-trust-chart" aria-label="Companies that trust Supademo">
          <div className="compare-trust-explore">
            Explore{" "}
            <span className="compare-trust-picker">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={trustPickerOpen}
                onClick={() => setTrustPickerOpen((open) => !open)}
              >
                {trustCategory}⌄
              </button>
              {trustPickerOpen ? (
                <span
                  className="compare-trust-picker-options"
                  role="listbox"
                  aria-label="Trust categories"
                >
                  {trustCategories.map((item) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={trustCategory === item}
                      key={item}
                      onClick={() => {
                        setTrustCategory(item);
                        setTrustPickerOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </span>
              ) : null}
            </span>{" "}
            companies that trust Supademo
          </div>
          <div className="compare-trust-logos">
            {trustLogos.map(([alt, src], index) => (
              <img
                key={`${src}-${index}`}
                src={`${compareLogoBase}${src}`}
                alt={alt}
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="compare-reasons" aria-labelledby="compare-reasons-title">
        <div className="compare-section-heading">
          <p className="compare-eyebrow">Why teams switch</p>
          <h2 id="compare-reasons-title">Key reasons why growing companies choose Supademo</h2>
          <p>
            From startups to Fortune 500 enterprises, teams pick Supademo for the breadth of
            interactive demo formats, speed of creation, and range of use cases it covers.
          </p>
        </div>
        <div className="compare-reason-grid">
          {reasons.map((reason) => (
            <article className="compare-reason-card" key={reason.label}>
              <span className="compare-reason-label">{reason.label}</span>
              <h3>{reason.title}</h3>
              <p>{reason.body}</p>
              <a href={reason.href}>{reason.action} →</a>
              <ReasonArt kind={reason.art} />
            </article>
          ))}
        </div>
      </section>

      <section className="compare-library" id="comparisons" aria-labelledby="compare-library-title">
        <div className="compare-section-heading">
          <p className="compare-eyebrow">Alternatives</p>
          <h2 id="compare-library-title">Supademo is G2&apos;s Grid Leader for a reason</h2>
          <p>
            Discover how Supademo compares to other demo automation, interactive demo, process
            documentation, and video tools.
          </p>
        </div>
        <div className="compare-category-tabs" role="tablist" aria-label="Comparison categories">
          {comparisonCategories.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={category === item}
              key={item}
              onClick={() => chooseCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="compare-card-grid" aria-live="polite">
          {visibleCards.map(([name, , slug, logo]) => (
            <a className="compare-card" href={`/compare/${slug}`} key={slug}>
              <div className="compare-card-compare-head">
                <div className="compare-card-side compare-card-side-primary">
                  <img
                    src={`${compareLogoBase}/apple-touch-icon.png`}
                    alt="Supademo"
                    referrerPolicy="no-referrer"
                  />
                  <div className="compare-card-checks" aria-hidden="true">
                    {[0, 1, 2, 3].map((index) => (
                      <span key={index}>
                        ✓ <i />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="compare-card-side compare-card-side-competitor">
                  <img
                    src={`${compareLogoBase}${logo}`}
                    alt={`${name.replace("Supademo vs. ", "")} logo`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="compare-card-checks" aria-hidden="true">
                    {[0, 1, 2, 3].map((index) => (
                      <span className="compare-card-cross" key={index}>
                        × <i />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="compare-card-title">{name}</span>
            </a>
          ))}
        </div>
        {visibleCards.length <
        comparisons.filter(([, itemCategory]) => category === "All" || itemCategory === category)
          .length ? (
          <button
            className="compare-show-more"
            type="button"
            onClick={() => setVisibleComparisons((current) => current + 3)}
          >
            Show more comparisons
          </button>
        ) : null}
      </section>

      <section className="compare-case-studies" aria-labelledby="compare-case-studies-title">
        <div className="compare-section-heading compare-case-studies-heading">
          <h2 id="compare-case-studies-title">Trusted by thousands of fast growing companies</h2>
        </div>
        <div className="compare-case-grid">
          {caseStudies.map(([company, quote, person, role, href, logo, headshot]) => (
            <a className="compare-case-card" href={href} key={company}>
              <img
                className="compare-case-logo"
                src={`${compareLogoBase}${logo}`}
                alt={`${person}'s logo`}
                referrerPolicy="no-referrer"
              />
              <p>{quote}</p>
              <span className="compare-case-person">
                <img
                  src={`${compareLogoBase}${headshot}`}
                  alt={`${person} headshot`}
                  referrerPolicy="no-referrer"
                />
                <strong>{person}</strong>
                <small>{role}</small>
              </span>
              <span className="compare-case-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
        <a className="compare-case-all" href="/customers">
          View all case studies <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="compare-feature-carousel" aria-labelledby="compare-feature-title">
        <div className="compare-section-heading">
          <p className="compare-eyebrow">One platform</p>
          <h2 id="compare-feature-title">Scale how your team demonstrates products</h2>
          <p>
            Drive conversions by personalizing your product demo with dynamic variables, branching,
            custom branding, and chapters.
          </p>
        </div>
        <div className="compare-feature-panel">
          <div className="compare-feature-viewport">
            <div
              className="compare-feature-track"
              style={{ transform: `translateX(calc(-${featureSlide} * (352px + 24px)))` }}
            >
              {productFeatures.map(([title, description, image]) => (
                <article className="compare-feature-card" key={title}>
                  <div className="compare-feature-card-image">
                    <img
                      src={`${compareLogoBase}${image}`}
                      alt={title}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="compare-feature-card-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="compare-carousel-controls">
          <button
            type="button"
            disabled={featureSlide === 0}
            onClick={() => setFeatureSlide((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span aria-live="polite">
            {featureSlide + 1} / {Math.max(1, productFeatures.length - 2)}
          </span>
          <button
            type="button"
            disabled={featureSlide === productFeatures.length - 3}
            onClick={() =>
              setFeatureSlide((current) => Math.min(productFeatures.length - 3, current + 1))
            }
          >
            Next
          </button>
        </div>
      </section>

      <section className="compare-faq" aria-labelledby="compare-faq-title">
        <div className="compare-faq-art" aria-hidden="true">
          <img
            src={`${compareLogoBase}/images/faq-section-illustration.avif`}
            alt=""
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="compare-section-heading">
          <p className="compare-eyebrow">FAQs</p>
          <h2 id="compare-faq-title">Frequently asked questions about Supademo</h2>
          <p>Common questions about how Supademo compares to alternative demo platforms.</p>
        </div>
        <div className="compare-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
