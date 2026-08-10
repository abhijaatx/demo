"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

export type IndustrySlug = "software" | "healthcare" | "finance-banking" | "government";

type WorkflowCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

type ShowcaseSlide = {
  name: string;
  title: string;
  src: string;
};

type IndustryConfig = {
  title: string;
  description: string;
  primaryLabel: string;
  workflowTitle: string;
  workflowCards: readonly WorkflowCard[];
  showcaseTitle: string;
  showcaseHref: string;
  showcaseSlides: readonly ShowcaseSlide[];
  modernTitle: string;
  modernDescription: string;
  faqQuestions: readonly string[];
};

const remoteAsset = (path: string) => `https://supademo.com${path}`;

const caseStudyHeader = remoteAsset("/case-studies/case-study-header.avif");
const badgeAssets = [
  remoteAsset("/images/supademo-rating-03.webp"),
  remoteAsset("/images/supademo-rating-02.webp")
] as const;

const trustLogoRows = [
  [
    ["Spare", "/logos/spare.svg"],
    ["Jotform", "/logos/jotform.svg"],
    ["Anvil", "/logos/useanvil.svg"],
    ["Beehiiv", "/logos/beehiiv.avif"],
    ["Ledger", "/logos/ledger-logo.svg"],
    ["Visma", "/logos/visma.avif"],
    ["Lightspeed", "/logos/lightspeed.svg"],
    ["Eng", "/logos/engdb.svg"],
    ["Relevance AI", "/logos/relevanceai.svg"],
    ["Easy", "/logos/easy.svg"]
  ],
  [
    ["Alibaba", "/logos/alibaba.avif"],
    ["Bullhorn", "/logos/bullhorn.svg"],
    ["Typeform", "/logos/typeform.svg"],
    ["NetApp", "/logos/netapp.svg"],
    ["RB2B", "/logos/rb2b.svg"],
    ["Turo", "/logos/turo.avif"],
    ["Concentrix", "/logos/concentrix.svg"],
    ["VRIFY", "/logos/vrify.svg"],
    ["Posh", "/logos/poshvip.svg"],
    ["Siemens", "/logos/simens.svg"]
  ]
] as const;

const featureCards = [
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

const customerStories = [
  [
    "VRIFY",
    "/logos/vrify.svg",
    "VRIFY reduces enablement content production time by 75% while saving $100k+ on staff resourcing with Supademo.",
    "Nova Siegmann",
    "Sr. Manager, Product Enablement & Training",
    "/case-studies/nova-headshot.avif",
    "/customers/vrify-case-study"
  ],
  [
    "Bullhorn",
    "/logos/bullhorn.svg",
    "Bullhorn creates content 50% faster while increasing viewer engagement by 20% with Supademo.",
    "Robert Hoffmann",
    "Instructional Designer",
    "/headshots/robert-headshot.avif",
    "/customers/bullhorn-case-study"
  ],
  [
    "beehiiv",
    "/logos/beehiiv.avif",
    "beehiiv converts thousands of signups with 50% better conversion rates with Supademo.",
    "EJ White",
    "Head of Growth",
    "/headshots/ej-headshot.avif",
    "/customers/beehiiv-case-study"
  ],
  [
    "Easy",
    "/logos/easy.svg",
    "Easy deploys interactive demos across departments and closes $100k+ in contracts with Supademo.",
    "Felix True",
    "Head of Presales",
    "/headshots/felix-headshot.avif",
    "/customers/easy-software-case-study"
  ]
] as const;

const industryConfig: Record<IndustrySlug, IndustryConfig> = {
  software: {
    title: "Accelerate Adoption and Growth Across Your Software Stack",
    description:
      "Supademo helps software teams simplify enablement, onboarding, product education, and training.",
    primaryLabel: "Book a live demo",
    workflowTitle: "How software teams use Supademo",
    workflowCards: [
      {
        title: "Product Onboarding",
        description:
          "Guide users through new features and workflows without engineering support. Replace long videos with step-by-step interactive walkthroughs that drive adoption.",
        href: "/use-cases/product-onboarding",
        icon: "♧"
      },
      {
        title: "Customer Education",
        description:
          "Turn documentation into interactive experiences that help users learn by doing — improving retention and reducing support volume.",
        href: "/use-cases/customer-success",
        icon: "▱"
      },
      {
        title: "Sales Enablement",
        description:
          "Equip GTM teams with personalized, interactive demos that convert 7x faster and showcase product value instantly.",
        href: "/use-cases/sales-enablement",
        icon: "▤"
      },
      {
        title: "Employee & Partner Training",
        description:
          "Create internal training flows that onboard new hires, partners, and customer-facing teams faster and more consistently.",
        href: "/use-cases/education-training",
        icon: "♧"
      }
    ],
    showcaseTitle: "See how leading software teams use Supademo",
    showcaseHref: "/showcase?industries=software",
    showcaseSlides: [
      {
        name: "Dropbox",
        title: "Dropbox Demo",
        src: "https://app.supademo.com/embed/cmha5llul0n4j6kifn9ylo0d7"
      },
      {
        name: "Intercom",
        title: "Intercom Demo",
        src: "https://app.supademo.com/embed/cmewzomb200ci0m0jgnfi4xgm"
      },
      {
        name: "Wise",
        title: "Wise Demo",
        src: "https://app.supademo.com/embed/cm7lzg1gc1mwqddum7swzvy4m"
      },
      {
        name: "Supademo",
        title: "Supademo Demo",
        src: "https://app.supademo.com/embed/cmhap0n0h09cf1i0h67bxwwzv"
      },
      {
        name: "Turo",
        title: "Turo Demo",
        src: "https://app.supademo.com/embed/clynlymwp014kbzaadcojd5jw"
      }
    ],
    modernTitle: "Built for Modern, Fast-Growing Software Teams",
    modernDescription:
      "Supademo helps software companies scale product education securely, across any audience or function.",
    faqQuestions: [
      "What is Supademo used for in software companies?",
      "How do SaaS and product-led teams use Supademo?",
      "Can Supademo integrate with our existing tools?",
      "Does Supademo support enterprise-grade security?"
    ]
  },
  healthcare: {
    title: "Interactive Healthcare Demos That Cut Training Time and Boost Adoption",
    description:
      "Simplify staff training, compliance, and patient onboarding with step-by-step interactive demos that scale across your organization.",
    primaryLabel: "Book a Personalized Walkthrough",
    workflowTitle: "How healthcare teams use Supademo",
    workflowCards: [
      [
        "Employee Onboarding",
        "Accelerate clinical and administrative onboarding with interactive walkthroughs that fit every role.",
        "/use-cases/education-training",
        "♧"
      ],
      [
        "Product Marketing & Education",
        "Show healthcare teams how your solution works with concise, self-serve training and education.",
        "/use-cases/product-marketing",
        "▱"
      ],
      [
        "Healthcare App Onboarding",
        "Help patients and providers discover the right workflows through intuitive guidance and support.",
        "/use-cases/product-onboarding",
        "▤"
      ],
      [
        "Standard Operating Procedures (SOPs)",
        "Make complex processes easy to follow with interactive demos that keep everyone in context.",
        "/tools/sop-generator",
        "♧"
      ]
    ].map(([title, description, href, icon]) => ({
      title,
      description,
      href,
      icon
    })) as WorkflowCard[],
    showcaseTitle: "Interactive demos for healthcare and patient care",
    showcaseHref: "/showcase",
    showcaseSlides: [],
    modernTitle: "Streamlined features for the healthcare industry",
    modernDescription: "Create secure, repeatable product education for every healthcare audience.",
    faqQuestions: [
      "How quickly can we create demos for new medical software or procedures?",
      "Is Supademo HIPAA-compliant and secure for healthcare environments?",
      "Can we integrate Supademo with our existing EHR and healthcare systems?",
      "How does Supademo reduce training time for healthcare staff?"
    ]
  },
  "finance-banking": {
    title: "Drive Financial Compliance and Customer Clarity with Interactive Demos",
    description:
      "From fintech startups to enterprise banks, Supademo helps teams onboard customers, train agents, and market products — faster and smarter.",
    primaryLabel: "Book a Personalized Walkthrough",
    workflowTitle: "How finance teams use Supademo",
    workflowCards: [
      [
        "Sales & Enablement",
        "Equip sales teams with interactive demos that clearly explain financial products, APIs, and integrations.",
        "/use-cases/sales-enablement",
        "♧"
      ],
      [
        "Employee & Agent Training",
        "Standardize training for new hires, branch staff, and call-center teams with interactive learning experiences.",
        "/use-cases/education-training",
        "▱"
      ],
      [
        "Customer Onboarding & Support",
        "Turn complex product journeys into guided, self-paced walkthroughs for customers and partners.",
        "/use-cases/customer-support",
        "▤"
      ],
      [
        "Product Marketing & Education",
        "Explain interactive demos to market and campaign audiences with a clear, accessible path.",
        "/use-cases/product-marketing",
        "♧"
      ]
    ].map(([title, description, href, icon]) => ({
      title,
      description,
      href,
      icon
    })) as WorkflowCard[],
    showcaseTitle: "Interactive demos for banking and finance",
    showcaseHref: "/showcase?industries=finance-banking",
    showcaseSlides: [],
    modernTitle: "Features built for fintech and finance",
    modernDescription: "Give financial teams a clear, secure way to explain every workflow.",
    faqQuestions: [
      "How quickly can we create demos for our banking products?",
      "Can Supademo integrate with our existing banking systems and training platforms?",
      "How does Supademo help reduce training costs for financial institutions?",
      "How do interactive demos help with banking compliance and security?"
    ]
  },
  government: {
    title: "Modernize Training and Public Service With Guided Demos and Tutorials",
    description:
      "Simplify how your teams, citizens, and partners use standard government services and processes with secure, interactive demos.",
    primaryLabel: "Book a Personalized Walkthrough",
    workflowTitle: "How government teams use Supademo",
    workflowCards: [
      [
        "Employee Training",
        "Create interactive walkthroughs to train staff on new tools, compliance workflows, or SOPs without long manuals.",
        "/use-cases/education-training",
        "♧"
      ],
      [
        "Citizen Onboarding",
        "Make complex public-service journeys clearer with guided, step-by-step experiences.",
        "/use-cases/product-onboarding",
        "▱"
      ],
      [
        "Policy & Process Rollouts",
        "Launch new policies, systems, or internal tools with guided experiences that reduce confusion and rework.",
        "/use-cases/product",
        "▤"
      ],
      [
        "Procurement & Vendor Enablement",
        "Explain supplier workflows and digital services clearly, including the right controls and next steps.",
        "/use-cases/customer-success",
        "♧"
      ]
    ].map(([title, description, href, icon]) => ({
      title,
      description,
      href,
      icon
    })) as WorkflowCard[],
    showcaseTitle: "Interactive demos for government and public services",
    showcaseHref: "/showcase",
    showcaseSlides: [],
    modernTitle: "Designed for the Public Sector",
    modernDescription: "Make public-service education clear, accessible, and easy to revisit.",
    faqQuestions: [
      "What is Supademo used for in government agencies or organizations?",
      "Can Supademo be used for citizen-facing tutorials and public service explainers?",
      "How secure is Supademo for government use?",
      "Does Supademo offer support for government onboarding and implementation?"
    ]
  }
};

function ImageWithFallback({
  src,
  alt,
  className,
  ...rest
}: {
  src: string;
  alt: string;
  className: string;
  width?: number;
  height?: number;
}) {
  return (
    <img
      {...rest}
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

export function MarketingIndustryPage({ slug }: { slug: IndustrySlug }) {
  const config = industryConfig[slug];
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [trustMode, setTrustMode] = useState("Featured");
  const [trustMenuOpen, setTrustMenuOpen] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const slides =
    config.showcaseSlides.length > 0
      ? config.showcaseSlides
      : industryConfig.software.showcaseSlides;

  return (
    <main
      className={`industry-marketing-page industry-exact-page industry-marketing-${slug}`}
      id="main"
    >
      <MarketingHeader />

      <section className="industry-exact-hero" aria-labelledby="industry-title">
        <div className="industry-exact-hero-copy">
          <h1 id="industry-title">{config.title}</h1>
          <p>{config.description}</p>
          <a className="marketing-button" href="/product-demo">
            {config.primaryLabel} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="industry-exact-hero-proof">
          <ImageWithFallback
            className="industry-exact-hero-proof-image"
            src={caseStudyHeader}
            alt="Supademo customer quote and G2 recognition badges"
            width={667}
            height={420}
          />
        </div>
      </section>

      <section className="industry-exact-trust" aria-label="Supademo customer trust">
        <div className="industry-exact-trust-inner">
          <h2>Trusted by 200,000+ top operators and 3,000+ paying organizations</h2>
          <div className="industry-exact-trust-badges" aria-label="Awards and ratings">
            {badgeAssets.map((src) => (
              <ImageWithFallback
                key={src}
                src={src}
                alt="Awards and trust badges from G2 and Google"
                className="industry-exact-badge"
              />
            ))}
          </div>
        </div>
        <div className="industry-exact-trust-explorer">
          <fieldset>
            <legend>
              <span>Explore</span>
              <span className="industry-exact-trust-picker">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={trustMenuOpen}
                  onClick={() => setTrustMenuOpen((open) => !open)}
                >
                  {trustMode} <span aria-hidden="true">⌄</span>
                </button>
                {trustMenuOpen ? (
                  <span
                    className="industry-exact-trust-menu"
                    role="listbox"
                    aria-label="Trust filter"
                  >
                    {["Featured", "Customer stories", "All companies"].map((mode) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={trustMode === mode}
                        key={mode}
                        onClick={() => {
                          setTrustMode(mode);
                          setTrustMenuOpen(false);
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>
              <span>companies that trust Supademo</span>
            </legend>
            <div className="industry-exact-trust-logo-grid">
              {trustLogoRows.flat().map(([name, path]) => (
                <span className="industry-exact-trust-logo" key={name} title={name}>
                  <ImageWithFallback
                    src={remoteAsset(path)}
                    alt={`${name} Logo`}
                    className="industry-exact-logo-image"
                  />
                  <b>{name}</b>
                </span>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="industry-exact-workflows" aria-labelledby="industry-workflows-title">
        <h2 id="industry-workflows-title">{config.workflowTitle}</h2>
        <div className="industry-exact-workflow-grid">
          {config.workflowCards.map((card) => (
            <article className="industry-exact-workflow-card" key={card.title}>
              <span className="industry-exact-workflow-icon" aria-hidden="true">
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <a href={card.href}>
                Explore <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="industry-exact-showcase" aria-labelledby="industry-showcase-title">
        <div className="industry-exact-showcase-inner">
          <h2 id="industry-showcase-title">{config.showcaseTitle}</h2>
          <div className="industry-exact-embed-shell">
            {slides.map((slide, index) => (
              <div
                className="industry-exact-embed-slide"
                key={slide.name}
                hidden={index !== showcaseIndex}
              >
                <div className="industry-exact-embed-frame">
                  <iframe
                    title={slide.title}
                    loading={index === 0 ? "eager" : "lazy"}
                    src={slide.src}
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            className="industry-exact-showcase-tabs industry-showcase-tabs"
            role="tablist"
            aria-label="Industry examples"
          >
            {slides.map((slide, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={showcaseIndex === index}
                key={slide.name}
                onClick={() => setShowcaseIndex(index)}
              >
                {slide.name}
              </button>
            ))}
          </div>
          <a className="industry-exact-outline-button" href={config.showcaseHref}>
            More {slug === "software" ? "software" : "industry"} examples
          </a>
        </div>
      </section>

      <section
        className="industry-exact-productivity"
        aria-labelledby="industry-productivity-title"
      >
        <div className="industry-exact-productivity-inner">
          <h2 id="industry-productivity-title">Drive productivity across the entire team</h2>
          <div className="industry-exact-metrics">
            {[
              ["7", "x", "Conversion vs. traditional demo videos"],
              ["85", "%", "Average time saved on demo creation"],
              ["28", "%", "Reduction in customer acquisition cost"]
            ].map(([value, suffix, label]) => (
              <div key={label}>
                <strong>
                  {value}
                  <sup>{suffix}</sup>
                </strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="industry-exact-modern" aria-labelledby="industry-modern-title">
        <div className="industry-exact-modern-illustration" aria-hidden="true" />
        <div className="industry-exact-modern-inner">
          <div className="industry-exact-modern-heading">
            <h2 id="industry-modern-title">{config.modernTitle}</h2>
            <p>{config.modernDescription}</p>
          </div>
          <div className="industry-exact-feature-window" aria-live="polite">
            <div
              className="industry-exact-feature-track"
              style={{ transform: `translateX(-${featureIndex * 376}px)` }}
            >
              {featureCards.map(([title, description, image]) => (
                <article className="industry-exact-feature-card" key={title}>
                  <div className="industry-exact-feature-image-wrap">
                    <ImageWithFallback
                      src={remoteAsset(image)}
                      alt={title}
                      className="industry-exact-feature-image"
                    />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="industry-exact-feature-controls">
            <button
              type="button"
              aria-label="Previous feature"
              disabled={featureIndex === 0}
              onClick={() => setFeatureIndex((index) => Math.max(0, index - 1))}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next feature"
              disabled={featureIndex >= featureCards.length - 3}
              onClick={() =>
                setFeatureIndex((index) => Math.min(featureCards.length - 3, index + 1))
              }
            >
              →
            </button>
          </div>
        </div>
      </section>

      <section
        className="industry-exact-testimonials"
        aria-labelledby="industry-testimonials-title"
      >
        <div className="industry-exact-testimonials-inner">
          <h2 id="industry-testimonials-title">Trusted by thousands of fast growing companies</h2>
          <div className="industry-exact-testimonial-grid">
            {customerStories.map(([name, logo, quote, person, role, headshot, href]) => (
              <a className="industry-exact-testimonial-card" href={href} key={name}>
                <ImageWithFallback
                  src={remoteAsset(logo)}
                  alt={`${name} logo`}
                  className="industry-exact-story-logo"
                />
                <p>{quote}</p>
                <span className="industry-exact-story-person">
                  <ImageWithFallback
                    src={remoteAsset(headshot)}
                    alt={`${person} headshot`}
                    className="industry-exact-story-headshot"
                  />
                  <span>
                    <b>{person}</b>
                    <small>{role}</small>
                  </span>
                </span>
                <span className="industry-exact-story-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </div>
          <a className="industry-exact-outline-button" href="/customers">
            View all case studies <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="industry-exact-faq" aria-labelledby="industry-faq-title">
        <div className="industry-exact-faq-art" aria-hidden="true">
          <ImageWithFallback
            className="industry-exact-faq-art-image"
            src={remoteAsset("/images/faq-section-illustration.avif")}
            alt=""
            width={320}
            height={275}
          />
        </div>
        <div className="industry-exact-faq-copy">
          <h2 id="industry-faq-title">FAQs</h2>
          <p>
            Commonly asked questions about Supademo. Have other questions? Reach out and our team
            will be happy to help.
          </p>
        </div>
        <div className="industry-exact-faq-list">
          {config.faqQuestions.map((question, index) => (
            <details key={question} open={index === 0}>
              <summary>
                <span>{question}</span>
                <b aria-hidden="true">{index === 0 ? "−" : "+"}</b>
              </summary>
              <p>
                Supademo helps teams create interactive, no-code product demos for onboarding,
                sales, and customer education. It&apos;s designed to replace videos and slides with
                engaging, step-by-step experiences that users can click through.
              </p>
            </details>
          ))}
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

export function isIndustrySlug(value: string): value is IndustrySlug {
  return Object.prototype.hasOwnProperty.call(industryConfig, value);
}

export function getIndustryConfig(slug: IndustrySlug) {
  return industryConfig[slug];
}
