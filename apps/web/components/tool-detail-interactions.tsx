"use client";

import { useState } from "react";

type ToolDetailInteractionsProps = {
  showTrust?: boolean;
  useCaseItems?: readonly string[];
  useCaseTitle?: string;
};

const teamTabs = [
  "Sales & Enablement",
  "Marketing & Growth",
  "Customer Success",
  "Support",
  "Product",
  "Training"
] as const;

const trustCategories = [
  "Featured",
  "Software",
  "Finance & Banking",
  "Healthcare",
  "Government"
] as const;

export function ToolDetailInteractions({
  showTrust = true,
  useCaseItems,
  useCaseTitle
}: ToolDetailInteractionsProps) {
  const [teamTab, setTeamTab] = useState(0);
  const [trustCategory, setTrustCategory] = useState("Featured");
  const [trustOpen, setTrustOpen] = useState(false);
  const resolvedUseCaseItems =
    useCaseItems && useCaseItems.length > 0
      ? useCaseItems
      : [
          "Replace live demos with self-serve product experiences",
          "Explain launches and new features",
          "Help customers learn by doing",
          "Give support a visual answer",
          "Train employees and partners",
          "Make product marketing more concrete"
        ];

  return (
    <>
      {showTrust ? (
        <section className="tool-detail-trust" aria-labelledby="tool-detail-trust-title">
          <div className="tool-detail-trust-inner">
            <h2 id="tool-detail-trust-title">
              Trusted by 200,000+ top operators and 3,000+ paying organizations
            </h2>
            <div className="tool-detail-rating-row" aria-label="Ratings and awards">
              <span>
                G2
                <br />
                <b>Top 100</b>
              </span>
              <span>
                G2
                <br />
                <b>Top 50</b>
              </span>
              <span>Leader</span>
              <span>High Performer</span>
            </div>
            <div className="tool-detail-trust-explore">
              Explore{" "}
              <span className="tool-detail-trust-picker">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={trustOpen}
                  onClick={() => setTrustOpen((open) => !open)}
                >
                  {trustCategory}⌄
                </button>
                {trustOpen ? (
                  <span role="listbox" aria-label="Tool customer categories">
                    {trustCategories.map((category) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={trustCategory === category}
                        key={category}
                        onClick={() => {
                          setTrustCategory(category);
                          setTrustOpen(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>{" "}
              companies that trust Supademo
            </div>
            <div className="tool-detail-logo-row">
              <span>spare</span>
              <span>Jotform</span>
              <span>beehiiv</span>
              <span>processmaker</span>
              <span>RBC</span>
              <span>easy</span>
              <span>Vanta</span>
            </div>
          </div>
        </section>
      ) : null}

      {useCaseItems ? (
        <section className="tool-detail-use-cases" aria-labelledby="tool-detail-use-cases-title">
          <div className="tool-detail-section-inner">
            <h2 id="tool-detail-use-cases-title">
              {useCaseTitle ?? "How teams use Supademo's tool"}
            </h2>
            <div className="tool-detail-team-tabs" role="tablist" aria-label="Tool use cases">
              {teamTabs.map((tab, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={teamTab === index}
                  key={tab}
                  onClick={() => setTeamTab(index)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <article className="tool-detail-use-case-card" aria-live="polite">
              <div>
                <h3>{resolvedUseCaseItems[teamTab % resolvedUseCaseItems.length]}</h3>
                <p>
                  Send interactive demos before and after the moment of need so each audience can
                  explore the product on its own time.
                </p>
                <a href="/use-cases">Supademo for {teamTabs[teamTab]} →</a>
              </div>
              <div className="tool-detail-use-case-art" aria-hidden="true" />
            </article>
          </div>
        </section>
      ) : null}
    </>
  );
}
