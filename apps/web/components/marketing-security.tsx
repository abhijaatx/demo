"use client";

import { useState } from "react";

const tabs = ["Overview", "Resources", "Controls", "Media"] as const;

const controls = [
  [
    "Infrastructure security",
    [
      "Unique production database authentication enforced",
      "Encryption key access restricted",
      "Unique account authentication enforced"
    ]
  ],
  [
    "Organizational security",
    [
      "Asset disposal procedures utilized",
      "Production inventory maintained",
      "Portable media encrypted"
    ]
  ],
  [
    "Product security",
    [
      "Data encryption utilized",
      "Control self-assessments conducted",
      "Penetration testing performed"
    ]
  ],
  [
    "Internal security procedures",
    [
      "Continuity and Disaster Recovery plans established",
      "Continuity and Disaster Recovery plans tested",
      "Cybersecurity insurance maintained"
    ]
  ],
  [
    "Data and privacy",
    [
      "Data retention procedures established",
      "Customer data deleted upon leaving",
      "Data classification policy established"
    ]
  ]
] as const;

const resources = [
  ["SOC 2", "Supademo SOC 2 Type II - 2025"],
  ["Data Security", "Security Architecture Overview"],
  ["AI Policy", "Supademo AI Policy"]
] as const;

export function MarketingSecurityPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const visibleControls = activeTab === "Controls" ? controls : controls.slice(0, 3);

  return (
    <main className="security-trust-page" id="main">
      <header className="security-trust-header">
        <a className="security-trust-brand" href="/" aria-label="Supademo home">
          <span>S</span>
          <i aria-hidden="true" />
          Trust Center
        </a>
        <div className="security-trust-actions">
          <a href="mailto:support@supademo.com?subject=Supademo%20security%20question">
            ✧ Ask a question
          </a>
          <a className="security-trust-primary" href="/product-demo">
            Request access
          </a>
        </div>
      </header>
      <section className="security-trust-hero" aria-labelledby="security-trust-title">
        <h1 id="security-trust-title">Supademo</h1>
        <p>Supademo helps companies create elegant, conversion-focused product demos with AI.</p>
        <p>
          Trusted by 200,000+ professionals at leading companies, Supademo&apos;s demo automation
          <br className="security-trust-desktop-break" /> platform is used to close more deals,
          accelerate time-to-value, and support customers.
        </p>
        <div className="security-trust-contact">
          <a href="mailto:support@supademo.com">✉ support@supademo.com</a>
          <a href="/privacy-policy">⌁ Privacy Policy</a>
        </div>
      </section>
      <nav className="security-trust-tabs" aria-label="Trust Center sections">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <section className="security-trust-content">
        {activeTab === "Media" ? (
          <div className="security-trust-empty">
            <h2>Media</h2>
            <p>Security and compliance resources for Supademo customers.</p>
          </div>
        ) : activeTab === "Overview" ? (
          <div className="security-trust-overview-grid">
            <div className="security-trust-compliance-column">
              <h2>Compliance</h2>
              <a
                className="security-trust-soc-card"
                href="https://security.supademo.com/"
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">
                  SOC
                  <br />2
                </span>
                <strong>SOC 2</strong>
                <b aria-hidden="true">›</b>
              </a>
              <h2 className="security-trust-resources-title">Resources</h2>
              {resources.slice(1).map(([title, detail]) => (
                <a
                  className="security-trust-mini-resource"
                  href="https://security.supademo.com/"
                  target="_blank"
                  rel="noreferrer"
                  key={title}
                >
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </a>
              ))}
            </div>
            <div className="security-trust-controls-column">
              <div className="security-trust-section-heading">
                <div>
                  <h2>Controls</h2>
                  <span className="security-trust-updated">✓ Updated 44 minutes ago</span>
                </div>
                <a href="https://security.supademo.com/" target="_blank" rel="noreferrer">
                  View all
                </a>
              </div>
              <div className="security-trust-control-grid">
                {controls.slice(0, 4).map(([title, items]) => (
                  <article key={title}>
                    <a href="https://security.supademo.com/" target="_blank" rel="noreferrer">
                      <h3>{title}</h3>
                      <b aria-hidden="true">›</b>
                    </a>
                    {items.map((item) => (
                      <p key={item}>
                        <span aria-hidden="true">✓</span>
                        {item}
                      </p>
                    ))}
                    <a
                      className="security-trust-more"
                      href="https://security.supademo.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View more {title.toLowerCase()} controls
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="security-trust-section-heading">
              <h2>{activeTab === "Resources" ? "Resources" : "Compliance"}</h2>
              <a href="https://security.supademo.com/" target="_blank" rel="noreferrer">
                View all
              </a>
            </div>
            {activeTab === "Resources" ? (
              <div className="security-trust-resource-grid">
                {resources.map(([title, detail]) => (
                  <a
                    href="https://security.supademo.com/"
                    target="_blank"
                    rel="noreferrer"
                    key={title}
                  >
                    <span aria-hidden="true">◉</span>
                    <div>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </div>
                    <b aria-hidden="true">›</b>
                  </a>
                ))}
              </div>
            ) : (
              <div className="security-trust-control-grid">
                {visibleControls.map(([title, items]) => (
                  <article key={title}>
                    <a href="https://security.supademo.com/" target="_blank" rel="noreferrer">
                      <h3>{title}</h3>
                      <b aria-hidden="true">›</b>
                    </a>
                    {items.map((item) => (
                      <p key={item}>
                        <span aria-hidden="true">✓</span>
                        {item}
                      </p>
                    ))}
                    <a
                      className="security-trust-more"
                      href="https://security.supademo.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View more {title.toLowerCase()} controls
                    </a>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
