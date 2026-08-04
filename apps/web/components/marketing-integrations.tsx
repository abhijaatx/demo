"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

export type Integration = {
  name: string;
  description: string;
  slug: string;
};

type IntegrationGroup = {
  name: string;
  integrations: Integration[];
};

const integrationAsset = (path: string) => `https://supademo.com${path}`;

const integrationLogoSources: Record<string, string> = {
  Calendly: integrationAsset("/integrations/calendly.svg"),
  Cal: integrationAsset("/integrations/calcom.svg"),
  SurveyMonkey: integrationAsset("/integrations/surveymonkey.svg"),
  "HubSpot Forms": integrationAsset("/integrations/hubspot.svg"),
  Tally: integrationAsset("/integrations/tally.avif"),
  Typeform: integrationAsset("/integrations/typeform.svg"),
  Jotform: integrationAsset("/logos/jotform.svg"),
  "Google Forms": integrationAsset("/integrations/google.avif"),
  Zendesk: integrationAsset("/integrations/zendesk.svg"),
  Intercom: integrationAsset("/integrations/intercom.svg"),
  Gitbook: integrationAsset("/integrations/gitbook.svg"),
  Confluence: integrationAsset("/integrations/confluence.svg"),
  Freshdesk: integrationAsset("/integrations/freshdesk.svg"),
  Document360: integrationAsset("/integrations/document360.avif"),
  Guru: integrationAsset("/integrations/guru.svg"),
  HelpScout: integrationAsset("/integrations/help-scout.svg"),
  HelpJuice: integrationAsset("/integrations/helpjuice.svg"),
  Fernand: integrationAsset("/integrations/fernand-logo.avif"),
  Slite: integrationAsset("/integrations/slite-logo.avif"),
  Mintlify: integrationAsset("/integrations/mintlify.svg"),
  HubSpot: integrationAsset("/integrations/hubspot.svg"),
  Salesforce: integrationAsset("/integrations/salesforce.avif"),
  Slack: integrationAsset("/logos/slack.svg"),
  "Google Analytics": integrationAsset("/integrations/google_analytics.svg"),
  Zapier: integrationAsset("/logos/zapier.avif"),
  Marketo: integrationAsset("/integrations/marketo.svg"),
  Pipedrive: integrationAsset("/integrations/pipedrive.svg"),
  Segment: integrationAsset("/integrations/segment.svg"),
  Notion: integrationAsset("/integrations/notion.svg"),
  Coda: integrationAsset("/integrations/coda.svg"),
  ClickUp: integrationAsset("/integrations/clickup.avif"),
  Webflow: integrationAsset("/integrations/webflow.svg"),
  Bubble: integrationAsset("/integrations/bubble.svg"),
  Ghost: integrationAsset("/integrations/ghost.svg"),
  Squarespace: integrationAsset("/integrations/squarespace.svg"),
  Framer: integrationAsset("/integrations/framer.svg"),
  Medium: integrationAsset("/integrations/medium.svg"),
  "Mirror.xyz": integrationAsset("/integrations/mirror.avif"),
  Wix: integrationAsset("/integrations/wix.svg"),
  "Journey.io": integrationAsset("/integrations/journeyio.svg"),
  Flowla: integrationAsset("/integrations/flowla-logo.avif"),
  "Paage.io": integrationAsset("/integrations/paage.svg"),
  Distribute: integrationAsset("/logos/distribute.svg"),
  G2: integrationAsset("/integrations/g2.avif"),
  SourceForge: integrationAsset("/integrations/sourceforge.svg"),
  "Product Hunt": integrationAsset("/logos/product-hunt.svg"),
  Canva: integrationAsset("/integrations/canva.svg")
};

const referenceIntegrationDescriptions: Record<string, string> = {
  Calendly: "Embed Calendly links in Supademos to let viewers book meetings or demos.",
  Cal: "Embed Cal.com links in Supademos to let viewers book meetings or demos.",
  SurveyMonkey: "Embed SurveyMonkey surveys into Supademos, enabling viewers to provide feedback.",
  "HubSpot Forms":
    "Embed HubSpot Forms in Supademos to capture leads and feedback, boosting engagement.",
  Tally: "Embed Tally forms in Supademos to boost engagement and collect feedback, sign-ups.",
  Typeform: "Embed Typeform forms in Supademos for seamless surveys, feedback, or lead capture.",
  Jotform: "Embed Jotform forms in Supademos to boost engagement, collect data, and drive action.",
  "Google Forms":
    "Embed Google Forms in Supademos to boost engagement and streamline data collection.",
  Zendesk: "Place Supademo demos in Zendesk help center articles to resolve issues visually.",
  Intercom: "Embed interactive walkthroughs directly into Intercom help articles or chat replies.",
  Gitbook:
    "Boost onboarding and support content by embedding interactive walkthroughs into GitBook docs.",
  Confluence: "Integrate walkthroughs into Confluence pages to make documentation engaging.",
  Freshdesk: "Add interactive Supademo walkthroughs to Freshdesk KB articles.",
  Document360: "Embed Supademo tours into Document360 articles to enhance learning.",
  Guru: "Enrich Guru knowledge base pages with step-by-step interactive walkthroughs.",
  HelpScout: "Insert Supademo walkthroughs into HelpScout knowledge base articles.",
  HelpJuice: "Add interactive tutorials into HelpJuice articles to bolster self-service support.",
  Fernand: "Embed guides in Fernand that use visual walkthroughs to reduce tickets.",
  Slite: "Add step-by-step, hands-on Supademo walkthroughs inside Slite docs.",
  Mintlify:
    "Make documentation in Mintlify more engaging with embedded interactive Supademo demos.",
  HubSpot:
    "Capture high-intent leads by syncing demo completion and interaction data into HubSpot.",
  Salesforce: "Auto-sync Supademo viewer and engagement data to Salesforce.",
  Slack: "Receive instant Slack notifications about demo views, new leads, and top performers.",
  "Google Analytics":
    "Track Supademo performance via Google Analytics—monitoring demo views, CTA clicks.",
  Zapier: "Automate your workflows through Zapier—like updating CRM contacts.",
  Marketo: "Sync Supademo engagement data to Marketo to enable real-time tracking.",
  Pipedrive:
    "SoonEmbed Supademo walkthroughs in Pipedrive—placing interactive demos within your sales pipeline.",
  Segment: "SoonEmbed Supademo demos into Segment workflows—enhancing engagement directly.",
  Notion: "Transform Notion pages into interactive hubs for onboarding and product education.",
  Coda: "Embed Supademo in Coda docs to make onboarding, education, and collaboration immersive.",
  ClickUp: "Add interactive walkthroughs to ClickUp Docs to streamline onboarding and training.",
  Webflow: "Place Supademos into Webflow sites or landing pages for hands-on product engagement.",
  Bubble: "Embed walkthroughs into Bubble apps to let users explore features.",
  Ghost: "Add immersive Supademo demos to Ghost posts for better SEO and engagement.",
  Squarespace: "Enhance Squarespace sites with interactive, self-guided Supademo walkthroughs.",
  Framer: "Embed interactive tours in Framer sites to educate leads and showcase features.",
  Medium: "Enrich Medium posts with hands-on walkthroughs, helping readers engage with content.",
  "Mirror.xyz": "Add interactive Supademo walkthroughs to Mirror.xyz posts to enhance engagement.",
  Wix: "Embed Supademo walkthroughs into your Wix site so visitors can explore features.",
  "Journey.io":
    "Integrate personalized narrative-style tours in Journey.io to let stakeholders explore.",
  Flowla: "Place Supademo walkthroughs in Flowla's digital sales rooms to boost understanding.",
  "Paage.io": "Embed interactive demos into follow-up pages, enabling prospects to self-qualify.",
  Distribute:
    "Add Supademo experiences into digital sales rooms on Distribute to drive engagement.",
  G2: "Integrate Supademo into your G2 profile's Product Tour section.",
  SourceForge: "Embed self-guided Supademo walkthroughs in your SourceForge listings.",
  "Product Hunt": "Showcase your product's value interactively on Product Hunt launch pages.",
  Canva: "Add Supademo walkthroughs to Canva designs, making your presentations immersive."
};

const groups: IntegrationGroup[] = [
  {
    name: "Embed in Supademo",
    integrations: [
      {
        name: "Calendly",
        description: "Easily schedule meetings in Supademo with an interactive calendar.",
        slug: "calendly"
      },
      {
        name: "Cal",
        description: "Embed Cal.com links in Supademo so viewers can book time with you.",
        slug: "cal"
      },
      {
        name: "SurveyMonkey",
        description: "Collect thoughtful feedback with SurveyMonkey surveys inside Supademo.",
        slug: "surveymonkey"
      },
      {
        name: "HubSpot Forms",
        description:
          "Embed HubSpot forms to capture leads and qualify interest without leaving your demo.",
        slug: "hubspot-forms"
      },
      {
        name: "Tally",
        description: "Embed fully free forms in Supademo to collect feedback, sign-ups, and more.",
        slug: "tally"
      },
      {
        name: "Typeform",
        description:
          "Embed Typeform forms in Supademo to turn every walkthrough into a conversation.",
        slug: "typeform"
      },
      {
        name: "Jotform",
        description: "Add powerful forms to your demo and collect responses in one place.",
        slug: "jotform"
      },
      {
        name: "Google Forms",
        description: "Embed Google Forms in Supademo for simple, familiar data collection.",
        slug: "google-forms"
      }
    ]
  },
  {
    name: "Knowledge Base",
    integrations: [
      {
        name: "Zendesk",
        description: "Share Supademo demos in Zendesk to help customers solve issues quickly.",
        slug: "zendesk"
      },
      {
        name: "Intercom",
        description: "Embed interactive walkthroughs directly into Intercom conversations.",
        slug: "intercom"
      },
      {
        name: "Gitbook",
        description:
          "Boost onboarding and support content by embedding interactive demos in GitBook.",
        slug: "gitbook"
      },
      {
        name: "Confluence",
        description:
          "Integrate walkthroughs into Confluence pages for collaborative product knowledge.",
        slug: "confluence"
      },
      {
        name: "Freshdesk",
        description: "Add interactive Supademo walkthroughs to Freshdesk support articles.",
        slug: "freshdesk"
      },
      {
        name: "Document360",
        description:
          "Embed Supademo tours into Document360 knowledge bases for faster self-service.",
        slug: "document360"
      },
      {
        name: "Guru",
        description: "Bring timely product knowledge into Guru cards with interactive demos.",
        slug: "guru"
      },
      {
        name: "HelpScout",
        description: "Embed Supademo walkthroughs into Help Scout knowledge-base articles.",
        slug: "helpscout"
      },
      {
        name: "HelpJuice",
        description: "Make product education easier to follow with interactive demos in HelpJuice.",
        slug: "helpjuice"
      },
      {
        name: "Fernand",
        description: "Embed guided product education in Fernand help content and tutorials.",
        slug: "fernand"
      },
      {
        name: "Slite",
        description: "Add step-by-step product guidance to Slite docs and team notes.",
        slug: "slite"
      },
      {
        name: "Mintlify",
        description: "Make documentation clearer with interactive Supademo demos in Mintlify.",
        slug: "mintlify"
      }
    ]
  },
  {
    name: "Sales & CRM",
    integrations: [
      {
        name: "HubSpot",
        description: "Bring interactive demos into your HubSpot sales workflow.",
        slug: "hubspot"
      },
      {
        name: "Salesforce",
        description: "Share and track demos from the Salesforce workspace.",
        slug: "salesforce"
      },
      {
        name: "Slack",
        description: "Share new demos with your team and keep launches moving in Slack.",
        slug: "slack"
      },
      {
        name: "Google Analytics",
        description: "Connect demo engagement to the analytics you already use.",
        slug: "google-analytics"
      },
      {
        name: "Zapier",
        description: "Automate demo workflows by connecting Supademo to thousands of apps.",
        slug: "zapier"
      },
      {
        name: "Marketo",
        description: "Use interactive demos in campaigns and measure engaged prospects.",
        slug: "marketo"
      },
      {
        name: "Pipedrive",
        description: "Keep demo links close to every opportunity in Pipedrive.",
        slug: "pipedrive"
      },
      {
        name: "Segment",
        description: "Route demo engagement events into your customer data platform.",
        slug: "segment"
      }
    ]
  },
  {
    name: "Internal Documentation",
    integrations: [
      {
        name: "Notion",
        description: "Add interactive product knowledge to Notion workspaces.",
        slug: "notion"
      },
      {
        name: "Coda",
        description: "Embed walkthroughs in Coda docs for collaborative enablement.",
        slug: "coda"
      },
      {
        name: "ClickUp",
        description: "Keep product guidance next to tasks and project plans in ClickUp.",
        slug: "clickup"
      },
      {
        name: "Guru",
        description: "Help teams find and understand product knowledge faster.",
        slug: "guru-internal"
      }
    ]
  },
  {
    name: "Websites & Blogs",
    integrations: [
      {
        name: "Webflow",
        description: "Show product value with interactive demos on Webflow sites.",
        slug: "webflow"
      },
      {
        name: "Bubble",
        description: "Add no-code product walkthroughs to Bubble apps and pages.",
        slug: "bubble"
      },
      {
        name: "Ghost",
        description: "Share product updates and tutorials in Ghost publications.",
        slug: "ghost"
      },
      {
        name: "Squarespace",
        description: "Embed polished demos on Squarespace websites.",
        slug: "squarespace"
      },
      {
        name: "Framer",
        description: "Bring interactive storytelling to Framer pages.",
        slug: "framer"
      },
      {
        name: "Medium",
        description: "Make product stories more useful with embedded demos.",
        slug: "medium"
      },
      {
        name: "Mirror.xyz",
        description: "Add product experiences to Mirror posts and communities.",
        slug: "mirror"
      },
      {
        name: "Wix",
        description: "Embed Supademo walkthroughs into Wix sites in a few clicks.",
        slug: "wix"
      }
    ]
  },
  {
    name: "Digital Sales Rooms",
    integrations: [
      {
        name: "Journey.io",
        description: "Guide buyers through a shared, interactive sales experience.",
        slug: "journey-io"
      },
      {
        name: "Flowla",
        description: "Add engaging product stories to collaborative deal rooms.",
        slug: "flowla"
      },
      {
        name: "Paage.io",
        description: "Create a more useful sales page with interactive demos.",
        slug: "paage"
      },
      {
        name: "Distribute",
        description: "Turn product knowledge into a shareable sales experience.",
        slug: "distribute"
      }
    ]
  },
  {
    name: "Others",
    integrations: [
      {
        name: "G2",
        description: "Give buyers an interactive way to understand your product on G2.",
        slug: "g2"
      },
      {
        name: "SourceForge",
        description: "Help evaluators explore product workflows from SourceForge.",
        slug: "sourceforge"
      },
      {
        name: "Product Hunt",
        description: "Make launches memorable with a product demo buyers can try.",
        slug: "product-hunt"
      },
      {
        name: "Canva",
        description: "Add product walkthroughs to presentations and visual content.",
        slug: "canva"
      }
    ]
  }
];

function IntegrationMark({ name }: { name: string }) {
  return (
    <span className="integrations-card-mark" aria-hidden="true">
      <img
        src={
          integrationLogoSources[name] ??
          integrationAsset(`/integrations/${name.toLowerCase()}.svg`)
        }
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}

export function MarketingIntegrations() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const visibleGroups = useMemo(
    () => (activeCategory ? groups.filter((group) => group.name === activeCategory) : groups),
    [activeCategory]
  );

  return (
    <main className="integrations-page" id="main">
      <MarketingHeader />
      <section className="integrations-hero" aria-labelledby="integrations-title">
        <div className="integrations-hero-copy">
          <p className="integrations-eyebrow">Featured integrations</p>
          <h1 id="integrations-title">Supercharge your workflow with Supademo integrations</h1>
          <p>
            Leverage Supademo to add interactive engagement to the tools you already use, such as
            support docs, product blogs, websites, and more.
          </p>
          <div className="integrations-hero-actions">
            <a className="marketing-button" href="/signup">
              Create your first Supademo <span aria-hidden="true">→</span>
            </a>
            <a className="marketing-text-action" href="/product-demo">
              Request a demo
            </a>
          </div>
        </div>
        <div
          className="integrations-hero-art"
          aria-label="Supademo integration workflow"
          role="img"
        >
          <img
            src="https://supademo.com/images/hero-integrations.svg"
            alt="Supademo integrations"
            loading="eager"
          />
        </div>
      </section>

      <section
        className="integrations-library"
        id="integration-library"
        aria-labelledby="integration-library-title"
      >
        <h2 id="integration-library-title" className="sr-only">
          Integration library
        </h2>
        <aside className="integrations-filters" aria-label="Filter integrations">
          <strong>Filter by</strong>
          <button
            type="button"
            className="integrations-filter-heading"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((current) => !current)}
          >
            Categories <span aria-hidden="true">⌃</span>
          </button>
          {categoriesOpen ? (
            <fieldset>
              <legend className="sr-only">Integration categories</legend>
              {groups.map((group) => (
                <label key={group.name}>
                  <input
                    type="radio"
                    name="integration-category"
                    checked={activeCategory === group.name}
                    onChange={() => setActiveCategory(group.name)}
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
          {activeCategory ? (
            <button
              type="button"
              className="integrations-clear-filter"
              onClick={() => setActiveCategory(null)}
            >
              Clear filter
            </button>
          ) : null}
        </aside>
        <div className="integrations-groups" aria-live="polite">
          {visibleGroups.map((group) => (
            <section
              className="integrations-group"
              key={group.name}
              aria-labelledby={`integration-${group.name}`}
            >
              <div className="integrations-group-heading">
                <h2 id={`integration-${group.name}`}>{group.name}</h2>
                <span>{group.integrations.length} integrations</span>
              </div>
              <div className="integrations-grid">
                {group.integrations.map((integration) => (
                  <article className="integrations-card" key={integration.slug}>
                    <IntegrationMark name={integration.name} />
                    <h3>{integration.name}</h3>
                    <p>
                      {referenceIntegrationDescriptions[integration.name] ??
                        integration.description}
                    </p>
                    <a href={`/integrations/${integration.slug}`}>
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="integrations-cta" aria-labelledby="integrations-cta-title">
        <p className="integrations-eyebrow">Build better product experiences</p>
        <h2 id="integrations-cta-title">Amplify your tools and workflow</h2>
        <p className="integrations-cta-copy">
          Share and embed Supademos across your existing support docs, playbooks, or workflow.
        </p>
        <a className="marketing-button" href="/signup">
          Explore integrations <span aria-hidden="true">→</span>
        </a>
        <div className="integrations-cta-art" aria-hidden="true">
          <img
            src="https://supademo.com/_next/image?url=%2Fintegrations%2Fintegrations-min.avif&w=1920&q=75"
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

export function getIntegrationBySlug(slug: string) {
  return groups
    .flatMap((group) => group.integrations)
    .find((integration) => integration.slug === slug);
}

export function MarketingIntegrationDetail({ integration }: { integration: Integration }) {
  return (
    <main className="integration-detail-page" id="main">
      <MarketingHeader />
      <section className="integration-detail-hero" aria-labelledby="integration-detail-title">
        <a className="integration-detail-back" href="/integrations">
          ← Back to integrations
        </a>
        <div className="integration-detail-card">
          <IntegrationMark name={integration.name} />
          <p className="integrations-eyebrow">Supademo integration</p>
          <h1 id="integration-detail-title">{integration.name}</h1>
          <p>{referenceIntegrationDescriptions[integration.name] ?? integration.description}</p>
          <a className="marketing-button" href="/signup">
            Connect {integration.name} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

export function MarketingIntegrationDetailClient({ slug }: { slug: string }) {
  const integration = getIntegrationBySlug(slug);
  if (!integration) {
    return (
      <main className="integration-detail-page" id="main">
        <MarketingHeader />
        <section className="integration-detail-hero" aria-labelledby="integration-not-found-title">
          <div className="integration-detail-card">
            <p className="integrations-eyebrow">Supademo integration</p>
            <h1 id="integration-not-found-title">Integration not found</h1>
            <p>Choose a supported integration from the directory to continue.</p>
            <a className="marketing-button" href="/integrations">
              Browse integrations <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
        <MarketingFooter />
      </main>
    );
  }
  return <MarketingIntegrationDetail integration={integration} />;
}
