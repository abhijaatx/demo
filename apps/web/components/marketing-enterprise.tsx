"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const capabilities = [
  {
    title: "Multiple workspaces",
    body: "Separate teams, brands, or business units into workspaces with their own settings.",
    icon: "▦",
    panel: "workspace"
  },
  {
    title: "Enterprise admin",
    body: "Manage permissions, audit logs, and governance from a single admin panel.",
    icon: "⌁",
    panel: "admin"
  },
  {
    title: "AI Demo Agents",
    body: "Deploy AI agents with workspace governance and audit logs built in.",
    icon: "✦",
    panel: "agents"
  }
] as const;

const enterpriseTrustLogos = [
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

const pillars = [
  {
    number: "01",
    title: "Built for scale across products, regions, and teams",
    body: "Multiple workspaces with workspace-level permissions, folders, and analytics. Custom branding per workspace. Centralized seat and content management.",
    metric: "One organization",
    values: [
      "EMEA Sales · 42 demos",
      "APAC Marketing · 37 demos",
      "US Customer Success · 61 demos",
      "Product Onboarding · 28 demos"
    ]
  },
  {
    number: "02",
    title: "Governance and access control without the workaround",
    body: "Role-based access control, workspace-level permissions, seat management, and SSO via SAML 2.0 for the identity provider your team already uses.",
    metric: "Role-based access control",
    values: [
      "Admin · View · Create · Edit",
      "Editor · View · Create · Share",
      "Viewer · View only",
      "SAML · Roles · Audit logs"
    ]
  },
  {
    number: "03",
    title: "Enterprise-grade security and compliance from day one",
    body: "AES-256 encryption at rest, TLS in transit, annual SOC 2 Type II audits, GDPR support, custom data residency, and configurable retention windows.",
    metric: "Verified controls",
    values: [
      "SOC 2 Type II · Audited annually",
      "GDPR · DPA available",
      "AES-256 + TLS · At rest & in transit",
      "SAML 2.0 SSO · Okta · Azure · Google"
    ]
  },
  {
    number: "04",
    title: "White-glove onboarding and ongoing partnership",
    body: "Dedicated customer success and support, unlimited training and demo audits, and a 99.99% uptime SLA for every rollout.",
    metric: "Implementation roadmap",
    values: [
      "Day 1 · Workspace setup",
      "Day 2–3 · SSO configuration",
      "Week 1–2 · Team training & demo audit",
      "Day 30+ · Ongoing partnership"
    ]
  }
] as const;

const faqs = [
  [
    "What's the difference between Supademo's lower tiers and Enterprise?",
    "Scale and Growth give teams unlimited demos, AI features, and custom branding. Enterprise adds SSO, multiple workspaces with governance, custom residency and retention, dedicated success, support, training, and an uptime SLA."
  ],
  [
    "How does Supademo handle our customer data in demos?",
    "Data is encrypted in transit with TLS and at rest with AES-256. Customer content stays inside your workspace, with enterprise residency and retention controls available."
  ],
  [
    "What security and compliance certifications do you have?",
    "Supademo is SOC 2 Type II audited annually and GDPR-compliant. SAML 2.0 SSO is available on Enterprise through Okta, Microsoft Azure, Google, and OneLogin."
  ],
  [
    "How does Supademo integrate with our existing tools?",
    "Connect HubSpot, Salesforce, Zapier, Slack, Marketo, analytics tools, help docs, and the wider integrations catalog without engineering lift."
  ],
  [
    "How does Supademo's AI work, and is our data used to train models?",
    "Supademo's AI features run with workspace governance and auditability. Customer content is not used to train third-party models, and enterprise controls keep data access scoped to your organization."
  ],
  [
    "What does enterprise onboarding look like?",
    "A dedicated team helps with workspace setup, SSO configuration, team training, demo audits, and an ongoing rollout plan tailored to your organization."
  ]
] as const;

function EnterpriseAdminArt({ active }: { active: (typeof capabilities)[number]["panel"] }) {
  const previewSrc =
    active === "workspace"
      ? "https://supademo.com/enterprise/multi-workspace.avif"
      : active === "agents"
        ? "https://supademo.com/enterprise/demo-agent.avif"
        : "https://supademo.com/enterprise/enterprise-admin.avif";

  return (
    <div className="enterprise-dashboard-art" aria-label={`${active} preview`} role="img">
      <img
        src={previewSrc}
        alt={`${active} preview`}
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export function MarketingEnterprise() {
  const [capability, setCapability] = useState(1);
  const [pillar, setPillar] = useState(0);
  const [trustCategory, setTrustCategory] = useState("Enterprise");
  const [trustPickerOpen, setTrustPickerOpen] = useState(false);
  const activeCapability = capabilities[capability];
  const activePillar = pillars[pillar];
  const trustCategories = [
    "Enterprise",
    "Featured",
    "Software",
    "Finance & Banking",
    "Healthcare",
    "Government & Non-Profit"
  ] as const;

  function moveCapability(direction: -1 | 1) {
    setCapability((current) => (current + direction + capabilities.length) % capabilities.length);
  }

  return (
    <main className="enterprise-page" id="main">
      <MarketingHeader />
      <section className="enterprise-hero" aria-labelledby="enterprise-title">
        <div className="enterprise-hero-copy">
          <p className="enterprise-eyebrow">
            <span aria-hidden="true">✓</span> Supademo for Enterprise
          </p>
          <h1 id="enterprise-title">
            Demos at enterprise scale, <br />
            <em>secured by default</em>
          </h1>
          <p>
            Built for sales, marketing, customer success, and product teams running AI-powered
            interactive demos and AI agents at scale, with the security, governance, and support
            large organizations need.
          </p>
          <div className="enterprise-hero-actions">
            <a className="marketing-button" href="/product-demo">
              Talk to sales <span aria-hidden="true">→</span>
            </a>
            <a
              className="marketing-button marketing-button-outline"
              href="https://security.supademo.com"
            >
              Visit Trust Center
            </a>
          </div>
        </div>
        <div className="enterprise-capability-row" aria-label="Enterprise capabilities">
          {capabilities.map((item, index) => (
            <button
              className={index === capability ? "is-active" : undefined}
              type="button"
              key={item.panel}
              aria-pressed={index === capability}
              onClick={() => setCapability(index)}
            >
              <span className="enterprise-capability-icon" aria-hidden="true">
                {item.icon}
              </span>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </button>
          ))}
        </div>
        <EnterpriseAdminArt active={activeCapability.panel} />
        <div className="enterprise-carousel-controls">
          <button type="button" onClick={() => moveCapability(-1)} aria-label="Previous capability">
            ← Previous
          </button>
          <span aria-live="polite">
            {capability + 1} / {capabilities.length}
          </span>
          <button type="button" onClick={() => moveCapability(1)} aria-label="Next capability">
            Next →
          </button>
        </div>
      </section>

      <section className="enterprise-trust" aria-labelledby="enterprise-trust-title">
        <div>
          <h2 id="enterprise-trust-title">
            Trusted by 3,000+ teams, from leading companies to the Fortune 500
          </h2>
          <p>Built for teams that need to show more, move faster, and keep governance simple.</p>
        </div>
        <div className="enterprise-award-row" aria-label="Awards and recognition">
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
        <div className="enterprise-trust-explore">
          Filter by{" "}
          <span className="enterprise-trust-picker">
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
                className="enterprise-trust-picker-options"
                role="listbox"
                aria-label="Enterprise customer categories"
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
          customers using Supademo at scale
        </div>
        <div className="enterprise-logo-cloud" aria-label="Enterprise customers">
          {enterpriseTrustLogos.map(([alt, src], index) => (
            <img
              key={`${src}-${index}`}
              src={`https://supademo.com${src}`}
              alt={alt}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </section>

      <section className="enterprise-pillars" aria-labelledby="enterprise-pillars-title">
        <div className="enterprise-section-heading">
          <p className="enterprise-eyebrow">Built for how enterprise actually buys</p>
          <h2 id="enterprise-pillars-title">Scale, governance, security, and partnership</h2>
          <p>
            The four things every enterprise procurement and IT review will ask about, ready out of
            the box.
          </p>
        </div>
        <div className="enterprise-pillar-layout">
          <div className="enterprise-pillar-tabs" role="tablist" aria-label="Enterprise pillars">
            {pillars.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === pillar}
                key={item.number}
                onClick={() => setPillar(index)}
              >
                <span>{item.number}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
          <article className="enterprise-pillar-detail" aria-live="polite">
            <p className="enterprise-pillar-number">{activePillar.number}</p>
            <h3>{activePillar.title}</h3>
            <p>{activePillar.body}</p>
            <div className="enterprise-pillar-metric">
              <strong>{activePillar.metric}</strong>
              <span>Supademo Enterprise</span>
            </div>
            <ul>
              {activePillar.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="enterprise-ready" aria-labelledby="enterprise-ready-title">
        <div className="enterprise-section-heading">
          <p className="enterprise-eyebrow">Built for procurement</p>
          <h2 id="enterprise-ready-title">Enterprise-ready by default</h2>
          <p>
            Security, governance, and support built for enterprise procurement, IT, and security
            teams.
          </p>
        </div>
        <div className="enterprise-ready-grid">
          {[
            [
              "Security & Compliance",
              "SOC 2 Type II",
              "Annual independent audits covering security, availability, and confidentiality."
            ],
            [
              "Identity & Access",
              "SSO via SAML 2.0",
              "Enforce single sign-on through Okta, Microsoft Azure, Google, or OneLogin."
            ],
            [
              "AI data governance",
              "Customer data stays yours",
              "Customer data is never used to train AI models or third-party systems."
            ],
            [
              "Support & partnership",
              "White-glove onboarding",
              "Dedicated success, unlimited training, and demo audits for every rollout."
            ]
          ].map(([category, title, body]) => (
            <article key={title}>
              <span>{category}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <a href="/product-demo">Learn more →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="enterprise-cta" aria-labelledby="enterprise-cta-title">
        <p className="enterprise-eyebrow">A better way to show the work</p>
        <h2 id="enterprise-cta-title">Ready to scale demos across your enterprise?</h2>
        <p>
          Schedule a 30-minute call with our enterprise sales team to walk through your needs,
          security review, and rollout plan.
        </p>
        <a className="marketing-button marketing-button-light" href="/product-demo">
          Talk to sales <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="enterprise-faq" aria-labelledby="enterprise-faq-title">
        <div className="enterprise-section-heading">
          <p className="enterprise-eyebrow">Questions, answered</p>
          <h2 id="enterprise-faq-title">FAQs about Supademo Enterprise</h2>
          <p>What enterprise teams ask us in security and procurement reviews.</p>
        </div>
        <div className="enterprise-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
