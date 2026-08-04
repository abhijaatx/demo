"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const demoSteps = [
  { title: "Welcome to your workspace", body: "Give every new teammate a clear starting point." },
  {
    title: "Create a focused walkthrough",
    body: "Turn the clicks that matter into a guided story."
  },
  { title: "Share it where work happens", body: "Publish one link, embed it, and see what lands." }
];

const capabilities = [
  [
    "Sales & Enablement",
    "Close more deals with personalized interactive demos for enablement, demo leave-behinds, prospecting, and more."
  ],
  [
    "Growth & Product Marketing",
    "Qualify more leads and drive revenue with high-converting, self-paced product tours that accelerate the aha moment."
  ],
  [
    "Customer Success",
    "Drive adoption and feature discovery with modular, interactive product tutorials within onboarding, user guides, or support docs."
  ]
] as const;

const trustLogos = [
  "spare",
  "Jotform",
  "Anvil",
  "beehiv",
  "LEDGER",
  "VISMA",
  "lightspeed",
  "eng",
  "Alibaba",
  "Bullhorn",
  "Typeform",
  "NetApp",
  "RB2B",
  "TURO",
  "concentrix",
  "VRIFY",
  "POSH",
  "SIEMENS"
];

const trustLogoAssets = [
  { name: "Spare", src: "https://supademo.com/logos/spare.svg" },
  { name: "Jotform", src: "https://supademo.com/logos/jotform.svg" },
  { name: "Anvil", src: "https://supademo.com/logos/useanvil.svg" },
  { name: "Beehiiv", src: "https://supademo.com/logos/beehiiv.avif" },
  { name: "Ledger", src: "https://supademo.com/logos/ledger-logo.svg" },
  { name: "Visma", src: "https://supademo.com/logos/visma.avif" },
  { name: "Lightspeed", src: "https://supademo.com/logos/lightspeed.svg" },
  { name: "EngDB", src: "https://supademo.com/logos/engdb.svg" },
  { name: "Easy", src: "https://supademo.com/logos/easy.svg" },
  { name: "Alibaba", src: "https://supademo.com/logos/alibaba.avif" },
  { name: "Bullhorn", src: "https://supademo.com/logos/bullhorn.svg" },
  { name: "Typeform", src: "https://supademo.com/logos/typeform.svg" },
  { name: "NetApp", src: "https://supademo.com/logos/netapp.svg" },
  { name: "RB2B", src: "https://supademo.com/logos/rb2b.svg" },
  { name: "Turo", src: "https://supademo.com/logos/turo.avif" },
  { name: "Concentrix", src: "https://supademo.com/logos/concentrix.svg" },
  { name: "VRIFY", src: "https://supademo.com/logos/vrify.svg" },
  { name: "Posh VIP", src: "https://supademo.com/logos/poshvip.svg" },
  { name: "Siemens", src: "https://supademo.com/logos/simens.svg" }
] as const;

const mobileTrustLogoAssets = [
  trustLogoAssets[0],
  trustLogoAssets[3],
  trustLogoAssets[6],
  trustLogoAssets[8],
  trustLogoAssets[10],
  trustLogoAssets[13],
  trustLogoAssets[16],
  trustLogoAssets[1],
  trustLogoAssets[2],
  trustLogoAssets[4]
] as const;

const painPoints = [
  ["Static screenshots", "A screenshot shows where someone is, not what to do next."],
  ["Long recordings", "A thirty-minute recording hides the moment that actually matters."],
  ["Live walkthroughs", "Every repeated explanation costs the team another meeting."]
] as const;

const blogCards = [
  [
    "The fastest way to create interactive product demos",
    "Product",
    "/blog/product-update-mcp-server"
  ],
  ["How to build an AI Demo Agent that qualifies buyers 24/7", "AI", "/blog/ai-demo-agent-guide"],
  [
    "New in June: voiceovers, advanced search, and more",
    "Product update",
    "/blog/product-update-june-recap"
  ]
] as const;

const homepageFaq = [
  [
    "What is an interactive product demo?",
    "An interactive product demo lets a viewer explore a product story at their own pace while guidance keeps the next step clear."
  ],
  [
    "How do you make an interactive product demo?",
    "Start with a screen, recording, or workflow, then add focused steps, hotspots, and a shareable link."
  ],
  [
    "Can I use Supademo as product tour inside my application?",
    "Yes. Supademo demos can be shared as links, embedded, or placed inside the product experience."
  ],
  [
    "What makes a successful interactive product demo?",
    "A clear first action, short chapters, useful context, and a next step that feels obvious."
  ],
  [
    "Does Supademo support both HTML and screenshot/video-based demo creation?",
    "Yes. Build guided HTML demos, sandbox environments, video walkthroughs, and beautiful screenshots."
  ],
  [
    "What are the most popular use cases for interactive product demos?",
    "Sales enablement, product marketing, onboarding, customer success, support, and training."
  ],
  [
    "What are the key features I should consider for my interactive product demo?",
    "Look for capture, editing, personalization, routing, analytics, and safe sharing controls."
  ],
  [
    "Do you offer support, training or assistance?",
    "Our team can help you plan your first demo and build a repeatable workflow."
  ]
] as const;

const showcaseModes = [
  {
    label: "Guided Interactive Demos",
    title: "Turn clicks into a path people can finish.",
    description:
      "Record a workflow, add context where it matters, and let the viewer move at their own pace.",
    points: [
      "Step-by-step chapters",
      "Hotspots and clear next actions",
      "Preview before you share"
    ],
    action: "Build a guided demo",
    visual: "guided"
  },
  {
    label: "Sandbox Demo Environments",
    title: "Let people try the product safely.",
    description:
      "Give buyers and teammates a realistic place to explore without exposing production data or a live workspace.",
    points: ["Controlled sample data", "Personalized paths", "Safe, repeatable exploration"],
    action: "Create a sandbox",
    visual: "sandbox"
  },
  {
    label: "AI Demo Agent",
    title: "Make the useful parts easier to write.",
    description:
      "Draft step copy, voiceover, and follow-up while keeping every suggestion editable and reviewable.",
    points: ["Editable suggestions", "Voiceover-ready scripts", "Human approval at every step"],
    action: "Try AI assistance",
    visual: "assist"
  },
  {
    label: "Route Hub",
    title: "Send each viewer to the right story.",
    description:
      "Collect a little context, then route people to the demo, resource, or next step that fits their intent.",
    points: [
      "Simple qualification questions",
      "Purposeful branching",
      "One shareable starting link"
    ],
    action: "Design a route",
    visual: "route"
  },
  {
    label: "In-App Demo Hub",
    title: "Put help where the work already happens.",
    description:
      "Give customers and teammates guidance they can revisit inside the product, without interruptive tours.",
    points: ["Contextual guidance", "Reusable collections", "On-demand support"],
    action: "Plan an in-app hub",
    visual: "hub"
  },
  {
    label: "Video Demos & Beautiful Screenshots",
    title: "Capture the moment in the format it deserves.",
    description:
      "Start with a screen, a short video, or one beautiful screenshot and turn it into something people can use.",
    points: ["Screen and video capture", "Chapters and hotspots", "Shareable links"],
    action: "Start a capture",
    visual: "capture"
  }
] as const;

const useCases = [
  {
    label: "Sales & enablement",
    title: "Leave behind the right next step.",
    description:
      "Give a prospect a focused product story they can explore before the next conversation.",
    action: "Prepare a sales demo"
  },
  {
    label: "Product & growth",
    title: "Make the aha moment easier to reach.",
    description:
      "Show the workflow, explain the value, and learn where people pause before they convert.",
    action: "Plan a product tour"
  },
  {
    label: "Customer success",
    title: "Turn support into something people can follow.",
    description:
      "Replace repeated explanations with modular walkthroughs that stay useful as the product changes.",
    action: "Create a support guide"
  }
] as const;

const homepageFormats = [
  {
    label: "Guided Interactive Demo",
    title: "Guided Interactive Demos",
    description:
      "Create polished product walkthroughs with HTML clones, screenshots, or video demos that make complex workflows easy to understand.",
    image: "https://supademo.com/images/guided-demo.webp",
    action: "Explore HTML Demos",
    href: "/features/guided-html-demo"
  },
  {
    label: "Sandbox",
    title: "Sandbox Demo Environments",
    description:
      "Clone realistic staging environments and showcase your product with personalized data, all in a safe, controlled space built for hands-on exploration.",
    image: "https://supademo.com/images/hero-sandbox-demos.avif",
    action: "Explore Sandbox Demos",
    href: "/features/sandbox-demos"
  },
  {
    label: "AI Demo Agent",
    title: "AI Demo Agent",
    description:
      "Launch a 24/7 AI agent trained on your content, guardrailed for accuracy, and ready to surface interactive demos, videos, and presentations on demand.",
    image: "https://supademo.com/images/hero-ai-demo-agents.avif",
    action: "Explore AI Demo Agents",
    href: "/ai/demo-agents"
  },
  {
    label: "Route Hub",
    title: "Route Hub",
    description:
      "Turn one link into personalized buyer journeys. Qualify visitors with smart intake forms, then automatically route each prospect to the right demos, decks, and resources based on their role, company size, and priorities.",
    image: "https://supademo.com/images/hero-route-hub.avif",
    action: "Explore Route Hub",
    href: "/features/route-hub"
  },
  {
    label: "In-App Demo Hub",
    title: "In-App Demo Hub",
    description:
      "Deliver in-context guidance and best practices inside your product so users get help when they need it, without having to dismiss intrusive popup tours.",
    image: "https://supademo.com/images/hero-demo-hubs.avif",
    action: "Explore In-App Tours",
    href: "/features/demo-hub"
  },
  {
    label: "Video & Screenshot",
    title: "Video Demos & Beautiful Screenshots",
    description:
      "Create shareable video demos and instant screenshot links to showcase any workflow, no editing skills required.",
    image: "https://supademo.com/images/hero-video-demos.avif",
    action: "Explore Video Demos",
    href: "/features/screen-recorder"
  }
] as const;

const homepageScaleCards = [
  ["Sales", "Create personalized leave-behinds in minutes.", "35%", "more closed-won deals"],
  ["Product marketing", "Give every launch a story people can try.", "2.4×", "higher activation"],
  [
    "Customer success",
    "Turn repeat questions into self-serve guidance.",
    "50%",
    "faster onboarding"
  ],
  [
    "Enablement",
    "Keep the team aligned on the latest workflow.",
    "4 hrs",
    "saved per rep each week"
  ]
] as const;

const homepageStories = [
  ["beehiiv", "50%", "better conversion rates", "/customers/beehiiv"],
  ["Easy Software", "$100k+", "contracts closed", "/customers/easy-software"],
  ["Bullhorn", "3×", "faster time to value", "/customers/bullhorn"]
] as const;

const homepageBlogCards = [
  [
    "New in June 2026: Voiceovers 2.0, Advanced Search, UI Redesign & Seismic Integration",
    "Product updates",
    "/blog/product-update-june-recap",
    "https://cdn.sanity.io/images/eyuvl764/production/68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png"
  ],
  [
    "Supademo vs. Claude Code: Should You Vibe-Code Product Demos or Build Them on a Platform?",
    "Product strategy",
    "/blog/supademo-vs-claude-code",
    "https://cdn.sanity.io/images/eyuvl764/production/b21ab88b3aa4433bf754e58a9a794cb7a24c9814-2880x1620.jpg"
  ],
  [
    "No, Seriously. SaaS Is About To Change Forever.",
    "Product strategy",
    "/blog/no-seriously-saas-is-about-to-change-forever",
    "https://cdn.sanity.io/images/eyuvl764/production/bc711d1ad784fed2fda5df05088c1a0ad5b24820-1672x941.png"
  ]
] as const;

const homepageUseCaseCards = [
  [
    "Sales & Enablement",
    "Close more deals with personalized interactive demos for enablement, demo leave-behinds, prospecting, and more.",
    "Explore Sales & Enablement",
    "/use-cases/sales-enablement"
  ],
  [
    "Growth & Product Marketing",
    'Qualify more leads and drive revenue with high-converting, self-paced product tours that accelerate the "aha" moment.',
    "Explore Growth & Product Marketing",
    "/use-cases/product-marketing"
  ],
  [
    "Customer Success",
    "Drive adoption and feature discovery with modular, interactive product tutorials within onboarding, user guides, or support docs.",
    "Explore Customer Success",
    "/use-cases/customer-success"
  ]
] as const;

function ShowcaseVisual({ mode }: { mode: (typeof showcaseModes)[number] }) {
  return (
    <div
      className={`marketing-mode-visual marketing-mode-visual-${mode.visual}`}
      aria-hidden="true"
    >
      <div className="marketing-mode-window-bar">
        <span />
        <span />
        <span />
      </div>
      {mode.visual === "guided" ? (
        <div className="marketing-mode-guided">
          <div>
            <span className="is-active">01</span>
            <span>02</span>
            <span>03</span>
          </div>
          <section>
            <small>Step 01 of 05</small>
            <strong>Choose the path that fits your team.</strong>
            <i />
          </section>
        </div>
      ) : null}
      {mode.visual === "sandbox" ? (
        <div className="marketing-mode-sandbox">
          <nav>
            <span>Home</span>
            <span className="is-active">Projects</span>
            <span>Team</span>
          </nav>
          <section>
            <strong>New campaign</strong>
            <small>Explore a safe sample workspace.</small>
            <i />
            <i />
          </section>
        </div>
      ) : null}
      {mode.visual === "assist" ? (
        <div className="marketing-mode-assist">
          <span>Draft a step description</span>
          <section>
            <small>Suggested copy</small>
            <strong>Show the selector first, then compare the options.</strong>
            <div>
              <i>Edit</i>
              <i>Use suggestion</i>
            </div>
          </section>
        </div>
      ) : null}
      {mode.visual === "route" ? (
        <div className="marketing-mode-route">
          <span>Start here</span>
          <div>
            <i>Sales</i>
            <i>Product</i>
            <i>Support</i>
          </div>
          <small>One link, three useful paths.</small>
        </div>
      ) : null}
      {mode.visual === "hub" ? (
        <div className="marketing-mode-hub">
          <aside>
            <span>Demo hub</span>
            <i />
            <i />
            <i />
          </aside>
          <section>
            <strong>Getting started</strong>
            <small>Pick a guide when you need it.</small>
            <i />
            <i />
          </section>
        </div>
      ) : null}
      {mode.visual === "capture" ? (
        <div className="marketing-mode-capture">
          <section>
            <small>Recording</small>
            <strong>5 screens captured</strong>
            <i />
            <i />
          </section>
          <span>● REC</span>
        </div>
      ) : null}
    </div>
  );
}

export function MarketingHome() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeFormat, setActiveFormat] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const [activeScaleCard, setActiveScaleCard] = useState(0);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const format = homepageFormats[activeFormat];
  const visibleScaleCards = [0, 1, 2].map(
    (offset) => homepageScaleCards[(activeScaleCard + offset) % homepageScaleCards.length]
  );

  return (
    <main className="marketing-home" id="main">
      <MarketingHeader />

      <section className="marketing-hero marketing-hero-centered" aria-labelledby="marketing-title">
        <div className="marketing-hero-copy">
          <p className="marketing-hero-badge">
            <span className="marketing-hero-badge-mark" aria-hidden="true">
              G2
            </span>
            G2&apos;s #5 Fastest Growing &amp; Top 50 Sales Product
          </p>
          <h1 id="marketing-title">Exceptional product demos in minutes, not days</h1>
          <p>
            <strong>AI Agents</strong> and <strong>AI interactive demos</strong> that accelerate
            deals, scale onboarding, and drive product adoption.
          </p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/signup">
              Start for free <span aria-hidden="true">→</span>
            </a>
            <a className="marketing-button marketing-button-outline" href="/product-demo">
              Talk to a human
            </a>
          </div>
        </div>
        <section
          className="marketing-demo-frame marketing-home-hero-frame"
          aria-label="Interactive demo preview"
        >
          <div className="marketing-home-hero-media">
            <a
              className="marketing-home-hero-link"
              href="https://app.supademo.com/embed/cmhutgsfx07vf17y0yg82vqgg"
              aria-label="Supademo Demo Preview - Click to view"
            >
              <picture>
                <source
                  media="(min-width: 761px)"
                  srcSet="https://supademo.com/images/hero-ai-demo-agent.avif"
                />
                <img
                  src="https://supademo.com/images/supa-hero-mobile.avif"
                  data-fallback-src="https://supademo.com/images/hero-ai-demo-agent.avif"
                  alt="Supademo Demo Preview - Click to view"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </a>
            <button
              type="button"
              className="marketing-home-ai-button"
              onClick={() => setActiveStep((current) => (current + 1) % demoSteps.length)}
            >
              <span aria-hidden="true">ϟ</span> Try Instant AI Agent Demo
            </button>
          </div>
          <div
            className="marketing-demo-progress"
            aria-label={`Step ${activeStep + 1} of ${demoSteps.length}`}
          >
            {demoSteps.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Open ${item.title}`}
                aria-pressed={index === activeStep}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </div>
        </section>
      </section>

      <section className="marketing-home-trust" aria-labelledby="home-trust-heading">
        <div className="marketing-home-trust-copy">
          <h2 id="home-trust-heading">
            Trusted by 200,000+ professionals at leading organizations
          </h2>
        </div>
        <div className="marketing-home-awards" aria-label="Industry awards">
          <img
            src="https://supademo.com/images/supademo-rating-03.webp"
            alt="G2 momentum leader"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <img
            src="https://supademo.com/images/supademo-rating-02.webp"
            alt="G2 best software"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="marketing-home-featured" aria-label="Explore featured companies">
          <span>Explore by</span>
          <button
            type="button"
            aria-expanded={featuredOpen}
            aria-haspopup="menu"
            onClick={() => setFeaturedOpen((current) => !current)}
          >
            Featured <span aria-hidden="true">⌄</span>
          </button>
          <span>companies that scale with Supademo</span>
          {featuredOpen ? (
            <div className="marketing-home-featured-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => setFeaturedOpen(false)}>
                Featured
              </button>
              <button type="button" role="menuitem" onClick={() => setFeaturedOpen(false)}>
                Fast growing teams
              </button>
              <button type="button" role="menuitem" onClick={() => setFeaturedOpen(false)}>
                Customer success
              </button>
            </div>
          ) : null}
        </div>
        <div className="marketing-home-logo-row" aria-label="Customer logos">
          {trustLogoAssets.map((logo) => (
            <span key={logo.name}>
              <img
                src={logo.src}
                alt={`${logo.name} Logo`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </span>
          ))}
        </div>
        <div
          className="marketing-home-logo-row marketing-home-logo-row-mobile"
          aria-label="Customer logos"
        >
          {mobileTrustLogoAssets.map((logo) => (
            <span key={logo.name}>
              <img
                src={logo.src}
                alt={`${logo.name} Logo`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </span>
          ))}
        </div>
      </section>

      <section className="marketing-home-pain" aria-labelledby="home-pain-heading">
        <div className="marketing-home-section-intro">
          <h2 id="home-pain-heading">
            Creating product demos
            <span>doesn&apos;t have to be painful</span>
          </h2>
        </div>
        <div className="marketing-home-compare">
          <article className="marketing-home-compare-card is-muted">
            <div className="marketing-home-compare-heading">
              <span aria-hidden="true">×</span>
              <h3>Traditional product demos</h3>
            </div>
            <img
              src="https://supademo.com/images/traditional-demo.svg"
              alt="Traditional product demo process"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <ul>
              <li>Days of scripting and re-recording</li>
              <li>Passive, one-way monologue</li>
              <li>Constantly out of date</li>
              <li>No tracking &amp; insights</li>
              <li>Hours to create</li>
            </ul>
          </article>
          <article className="marketing-home-compare-card is-primary">
            <div className="marketing-home-compare-heading">
              <span aria-hidden="true">✓</span>
              <h3>Interactive product demos</h3>
            </div>
            <img
              src="https://supademo.com/images/guided-demo.webp"
              alt="Interactive guided product demo"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <ul>
              <li>AI text and voiceover generation</li>
              <li>Interactive, guided demos</li>
              <li>Modular, maintainable content</li>
              <li>Track sessions, dropoffs, viewers</li>
              <li>Create in seconds</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="marketing-home-process" aria-labelledby="home-process-heading">
        <div className="marketing-home-section-intro">
          <p className="marketing-eyebrow">Simple by design</p>
          <h2 id="home-process-heading">World-class product demos, the fast and easy way</h2>
          <p>From recording to sharing, make product demos the fast and easy way.</p>
          <span className="marketing-sr-only">
            World-class product demos, the fast and easy way.
          </span>
        </div>
        <div className="marketing-home-process-grid">
          {[
            [
              "01",
              "Record",
              "Click through any product and Supademo magically transforms it into a step-by-step, interactive demo.",
              "https://supademo.com/images/record-demo.avif"
            ],
            [
              "02",
              "Edit & Personalize",
              "Easily make edits to each slide and personalize content with AI, chapters, voiceovers, custom branding, CTAs, and more.",
              "https://supademo.com/images/edit-personalize-demo.avif"
            ],
            [
              "03",
              "Share & Track",
              "Share and embed your Supademo anywhere online — across email, knowledge bases, websites, in-app, or as a trackable share link.",
              "https://supademo.com/images/share-track-demo.avif"
            ]
          ].map(([number, title, body, image]) => (
            <article key={number} className="marketing-home-process-card">
              <div className="marketing-home-process-art">
                <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="marketing-mode-section marketing-home-formats"
        id="build-any-demo"
        aria-labelledby="mode-heading"
      >
        <div className="marketing-home-section-intro marketing-home-section-intro-light">
          <p className="marketing-eyebrow">One platform, every format</p>
          <h2 id="mode-heading">Build any type of demo.</h2>
          <p>Choose the format that fits the moment, then share it wherever your audience works.</p>
        </div>
        <div className="marketing-home-format-shell">
          <div className="marketing-home-format-tabs" role="tablist" aria-label="Demo formats">
            {homepageFormats.map((item, index) => (
              <button
                type="button"
                role="tab"
                key={item.label}
                aria-selected={index === activeFormat}
                className={index === activeFormat ? "is-active" : undefined}
                onClick={() => setActiveFormat(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="marketing-home-format-panel" role="tabpanel" aria-live="polite">
            <div className="marketing-home-format-copy">
              <p className="marketing-eyebrow">{String(activeFormat + 1).padStart(2, "0")} / 06</p>
              <h3>{format.title}</h3>
              <p>{format.description}</p>
              <a className="marketing-button marketing-button-light" href={format.href}>
                {format.action} <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="marketing-home-format-art">
              <img
                src={format.image}
                alt={`${format.label} preview`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
        <div className="marketing-home-format-rows" aria-label="Demo format examples">
          {homepageFormats.slice(0, 3).map((item, index) => (
            <article
              className={`marketing-home-format-row ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={`row-${item.label}`}
            >
              <div className="marketing-home-format-row-copy">
                <p className="marketing-eyebrow">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a className="marketing-text-action" href={item.href}>
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="marketing-home-format-row-art">
                <img
                  src={item.image}
                  alt={`${item.label} example`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-home-metrics" aria-label="Supademo outcomes">
        <h2>Drive productivity across the entire team</h2>
        <div className="marketing-home-metric-grid">
          <div>
            <strong>0x</strong>
            <span>Conversion vs. traditional demo videos</span>
          </div>
          <div>
            <strong>0%</strong>
            <span>Average time saved on demo creation</span>
          </div>
          <div>
            <strong>0%</strong>
            <span>Reduction in customer acquisition cost</span>
          </div>
        </div>
      </section>

      <section
        className="marketing-use-case-section marketing-home-use-cases"
        aria-labelledby="use-case-heading"
      >
        <h2 id="use-case-heading" className="marketing-sr-only">
          Use cases for every team
        </h2>
        <div className="marketing-home-live-use-case-shell">
          <div className="marketing-home-live-use-case-list" role="tablist" aria-label="Use cases">
            {homepageUseCaseCards.map(([label, description, action, href], index) => {
              const isActive = index === activeUseCase;
              return (
                <article
                  className={`marketing-home-live-use-case-card${isActive ? " is-active" : ""}`}
                  key={label}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-expanded={isActive}
                    onClick={() => setActiveUseCase(index)}
                  >
                    <span className="marketing-home-live-use-case-label">{label}</span>
                    {isActive ? (
                      <span className="marketing-home-live-use-case-copy">{description}</span>
                    ) : null}
                  </button>
                  {isActive ? (
                    <a className="marketing-home-live-use-case-action" href={href}>
                      {action} <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="marketing-home-live-use-case-art" aria-hidden="true" />
        </div>
        <div className="marketing-home-live-use-case-hint" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="marketing-home-scale" aria-labelledby="scale-heading">
        <div className="marketing-home-section-intro marketing-home-section-intro-light">
          <p className="marketing-eyebrow">Scale what works</p>
          <h2 id="scale-heading">Turn every great explanation into a growth engine.</h2>
          <p>Keep the story consistent while making every conversation feel personal.</p>
        </div>
        <div className="marketing-home-scale-grid">
          {visibleScaleCards.map(([label, title, stat, result]) => (
            <article key={label} className="marketing-home-scale-card">
              <span>{label}</span>
              <h3>{title}</h3>
              <div>
                <strong>{stat}</strong>
                <small>{result}</small>
              </div>
              <a href="/customers">
                Read customer stories <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
        <div className="marketing-home-carousel-controls">
          <button
            type="button"
            aria-label="Previous outcome"
            onClick={() =>
              setActiveScaleCard(
                (current) => (current - 1 + homepageScaleCards.length) % homepageScaleCards.length
              )
            }
          >
            ←
          </button>
          <span>
            {activeScaleCard + 1} / {homepageScaleCards.length}
          </span>
          <button
            type="button"
            aria-label="Next outcome"
            onClick={() =>
              setActiveScaleCard((current) => (current + 1) % homepageScaleCards.length)
            }
          >
            →
          </button>
        </div>
      </section>

      <section className="marketing-home-testimonial" aria-label="Customer quote">
        <p>
          “Supademo has become the fastest way for our teams to explain a product, align on the
          details, and keep the conversation moving.”
        </p>
        <div>
          <strong>Felix True</strong>
          <span>Head of Presales, Easy Software</span>
        </div>
      </section>

      <section className="marketing-home-stories" aria-labelledby="stories-heading">
        <div className="marketing-home-section-intro">
          <p className="marketing-eyebrow">Customer stories</p>
          <h2 id="stories-heading">The teams doing more with less.</h2>
        </div>
        <div className="marketing-home-story-grid">
          {homepageStories.map(([company, stat, result, href]) => (
            <a className="marketing-home-story-card" href={href} key={company}>
              <div className="marketing-home-story-company">
                <span aria-hidden="true">S</span>
                <strong>{company}</strong>
              </div>
              <p>
                “Supademo gives us a clear way to show the value before the meeting even starts.”
              </p>
              <div className="marketing-home-story-stat">
                <strong>{stat}</strong>
                <span>{result}</span>
                <span aria-hidden="true">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="marketing-faq-section marketing-home-faq" aria-labelledby="faq-heading">
        <div className="marketing-home-faq-copy">
          <p className="marketing-eyebrow">Questions, answered</p>
          <h2 id="faq-heading">Frequently asked questions.</h2>
          <p>Everything you need to get from first capture to a polished, measurable demo.</p>
          <img
            src="https://supademo.com/images/faq-section-illustration.avif"
            alt="Illustration of an interactive demo"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="marketing-home-faq-list">
          {homepageFaq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="marketing-blog-section marketing-home-blog"
        aria-labelledby="blog-heading"
      >
        <div className="marketing-section-heading">
          <div>
            <p className="marketing-eyebrow">From the blog</p>
            <h2 id="blog-heading">Ideas for showing, not telling.</h2>
          </div>
          <a className="marketing-text-action" href="/blog">
            View all articles <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="marketing-home-blog-grid">
          {homepageBlogCards.map(([title, tag, href, image]) => (
            <a className="marketing-home-blog-card" href={href} key={title}>
              <div className="marketing-home-blog-image">
                <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <span>{tag}</span>
              <h3>{title}</h3>
              <strong>
                Read article <span aria-hidden="true">→</span>
              </strong>
            </a>
          ))}
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

export function LegacyMarketingHome() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeMode, setActiveMode] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const mode = showcaseModes[activeMode];
  const useCase = useCases[activeUseCase];

  return (
    <main className="marketing-home" id="main">
      <MarketingHeader />

      <section className="marketing-hero marketing-hero-centered" aria-labelledby="marketing-title">
        <div className="marketing-hero-copy">
          <p className="marketing-hero-badge">
            <span className="marketing-hero-badge-mark" aria-hidden="true">
              G2
            </span>
            G2&apos;s #5 Fastest Growing &amp; Top 50 Sales Product
          </p>
          <h1 id="marketing-title">Exceptional product demos in minutes, not days</h1>
          <p>
            <strong>AI Agents</strong> and <strong>AI interactive demos</strong> that accelerate
            deals, scale onboarding, and drive product adoption.
          </p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/signup">
              Start for free <span aria-hidden="true">→</span>
            </a>
            <a className="marketing-button marketing-button-outline" href="/product-demo">
              Talk to a human
            </a>
          </div>
        </div>
        <section
          className="marketing-demo-frame marketing-home-hero-frame"
          aria-label="Interactive demo preview"
        >
          <div className="marketing-home-hero-media">
            <img
              src="https://supademo.com/images/hero-ai-demo-agent.avif"
              alt="AI Demo Agent preview"
              loading="eager"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              className="marketing-home-ai-button"
              onClick={() => setActiveStep((current) => (current + 1) % demoSteps.length)}
            >
              <span aria-hidden="true">ϟ</span> Try Instant AI Agent Demo
            </button>
          </div>
          <div
            className="marketing-demo-progress"
            aria-label={`Step ${activeStep + 1} of ${demoSteps.length}`}
          >
            {demoSteps.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Open ${item.title}`}
                aria-pressed={index === activeStep}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </div>
        </section>
      </section>

      <section className="marketing-trust-strip" aria-labelledby="trust-heading">
        <h2 id="trust-heading">Trusted by 200,000+ professionals at leading organizations</h2>
        <div className="marketing-trust-logos" aria-label="Customer logos">
          {trustLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="marketing-pain-section" aria-labelledby="pain-heading">
        <div className="marketing-section-heading">
          <h2 id="pain-heading">Creating product demos doesn&apos;t have to be painful</h2>
          <p>
            Replace the slow, repeatable parts of explaining software with one clear, reusable
            experience.
          </p>
        </div>
        <div className="marketing-pain-grid">
          {painPoints.map(([title, description]) => (
            <article key={title}>
              <span aria-hidden="true">×</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="marketing-mode-section"
        id="build-any-demo"
        aria-labelledby="mode-heading"
      >
        <div className="marketing-mode-heading">
          <h2 id="mode-heading">World-class product demos, the fast and easy way.</h2>
          <p>
            <strong>Build any type of demo.</strong> Start with the format that fits the moment,
            then share it wherever your audience works.
          </p>
        </div>
        <div className="marketing-mode-shell">
          <div className="marketing-mode-tabs" role="tablist" aria-label="Demo formats">
            {showcaseModes.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === activeMode}
                className={index === activeMode ? "is-active" : undefined}
                key={item.label}
                onClick={() => setActiveMode(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="marketing-mode-content" role="tabpanel" aria-live="polite">
            <div className="marketing-mode-copy">
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
              <ul>
                {mode.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <a className="marketing-button marketing-button-small" href="/auth">
                {mode.action}
              </a>
            </div>
            <ShowcaseVisual mode={mode} />
          </div>
        </div>
      </section>

      <section className="marketing-product" id="product" aria-labelledby="product-heading">
        <div className="marketing-section-heading">
          <h2 id="product-heading">Drive productivity across the entire team.</h2>
          <p>
            Give every team a faster way to explain the product, answer questions, and keep work
            moving.
          </p>
        </div>
        <div className="marketing-capability-list">
          {capabilities.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <a href="/auth">Explore {title}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-workflows" id="workflows" aria-labelledby="workflows-heading">
        <div>
          <h2 id="workflows-heading">From first click to useful follow-up.</h2>
          <p>Capture the workflow once. Keep the story current, personal, and easy to measure.</p>
        </div>
        <ol>
          <li>
            <strong>Capture the moment</strong>
            <span>Record a screen or start from a template.</span>
          </li>
          <li>
            <strong>Make the path clear</strong>
            <span>Add guidance where it helps and leave the rest out.</span>
          </li>
          <li>
            <strong>Put it in front of people</strong>
            <span>Publish a link, embed it, or bring it into your product.</span>
          </li>
        </ol>
      </section>

      <section className="marketing-use-case-section" aria-labelledby="use-case-heading">
        <div className="marketing-use-case-intro">
          <h2 id="use-case-heading">Scale how your team demonstrates products.</h2>
          <p>
            Make the same product knowledge work for the teams who sell, explain, launch, and
            support it.
          </p>
        </div>
        <div className="marketing-use-case-shell">
          <div className="marketing-use-case-tabs" role="tablist" aria-label="Use cases">
            {useCases.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === activeUseCase}
                className={index === activeUseCase ? "is-active" : undefined}
                key={item.label}
                onClick={() => setActiveUseCase(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="marketing-use-case-content" role="tabpanel" aria-live="polite">
            <h3>{useCase.title}</h3>
            <p>{useCase.description}</p>
            <a href="/auth">{useCase.action}</a>
          </div>
        </div>
      </section>

      <section className="marketing-customers" id="customers" aria-labelledby="customers-heading">
        <h2 id="customers-heading">Trusted by thousands of fast growing companies.</h2>
        <p>
          From first click to next renewal, Supademo helps modern teams make the product easier to
          experience.
        </p>
        <div className="marketing-scale-logos" aria-label="Trusted companies">
          {trustLogos.slice(0, 6).map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
        <a className="marketing-button marketing-button-light" href="/auth">
          Start creating for free <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="marketing-faq-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">FAQs</h2>
        <div>
          {homepageFaq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="marketing-blog-section" aria-labelledby="blog-heading">
        <div className="marketing-section-heading">
          <h2 id="blog-heading">Latest from the blog</h2>
          <a className="marketing-text-action" href="/blog">
            View all articles →
          </a>
        </div>
        <div className="marketing-blog-grid">
          {blogCards.map(([title, tag, href]) => (
            <a className="marketing-blog-card" href={href} key={title}>
              <span>{tag}</span>
              <h3>{title}</h3>
              <strong>Read article →</strong>
            </a>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
