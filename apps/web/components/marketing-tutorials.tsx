"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const tools = [
  "All",
  "Ahrefs",
  "Airtable",
  "Apollo",
  "Asana",
  "Attio",
  "Brevo",
  "Calendly",
  "Canva",
  "ChatGPT",
  "Clearbit",
  "ClickUp",
  "Customer.io",
  "DocuSign",
  "Dover",
  "Dripify",
  "ElevenLabs",
  "Fathom",
  "Figma",
  "Freshdesk",
  "Gainsight",
  "GitHub",
  "Gmail",
  "Google Analytics",
  "Google Calendar",
  "Google Chrome",
  "Google Docs",
  "Google Drive",
  "Google Forms",
  "Google Sheets",
  "Google Slides",
  "Gorgias",
  "Help Scout",
  "HubSpot",
  "Jira",
  "Journey.io",
  "LastPass",
  "LinkedIn",
  "Livestorm",
  "Loom",
  "Mailchimp",
  "MailerLite",
  "Microsoft Excel",
  "Microsoft PowerPoint",
  "Microsoft Teams",
  "Microsoft Word",
  "Miro",
  "Mirror.xyz",
  "Mixpanel",
  "Monday.com",
  "NotebookLM",
  "Notion",
  "Pendo",
  "Perplexity",
  "Pipedrive",
  "Reddit",
  "Semrush",
  "Shopify",
  "Slack",
  "Smartsheet",
  "Supademo",
  "Totango",
  "Trello",
  "Typeform",
  "Webflow",
  "Wistia",
  "WordPress",
  "Zapier",
  "Zendesk",
  "Zoom",
  "ZoomInfo"
] as const;

const tutorials = [
  [
    "How to Check Website Traffic in Ahrefs",
    "Ahrefs",
    "See traffic, keywords, and the pages that bring visitors to your site.",
    "cmn70gsog0loh13avy470k6ml",
    "check-website-traffic-in-ahrefs"
  ],
  [
    "How to Check Domain Rating of Referring Domains in Ahrefs",
    "Ahrefs",
    "Compare the authority of referring domains and keep your SEO research moving.",
    "cmncpuisq0tl2xtguq6c1bhiu",
    "check-domain-rating-of-referring-domains-in-ahrefs"
  ],
  [
    "How to Use Ahrefs Keyword Explorer",
    "Ahrefs",
    "Find promising keywords and turn research into a practical content plan.",
    "cmncqe8ez0tx4xtgu6myzgsoq",
    "use-ahrefs-keyword-explorer"
  ],
  [
    "How to Rank Check One Time in Ahrefs",
    "Ahrefs",
    "Run a focused rank check and review how your pages perform in search.",
    "cmncqxiiv0vmsxtguj7gke7p4",
    "rank-check-one-time-in-ahrefs"
  ],
  [
    "How to Find Your Domain Rating (DR) in Ahrefs",
    "Ahrefs",
    "Locate the domain rating that helps you benchmark your SEO presence.",
    "cmncr7na302rxwk0j9a06vghl",
    "find-your-domain-rating-dr-in-ahrefs"
  ],
  [
    "How to Find a Site's Domain Authority on Ahrefs",
    "Ahrefs",
    "Use Ahrefs to inspect authority signals for any site you are researching.",
    "cmncrbkyv02mezw0kh2nqodrx",
    "find-a-sites-domain-authority-on-ahrefs"
  ],
  [
    "How to Disavow Backlinks in Ahrefs",
    "Ahrefs",
    "Review suspicious backlinks and prepare a clean disavow workflow.",
    "cmncrfl7i0w27xtguhoant3dz",
    "disavow-backlinks-in-ahrefs"
  ],
  [
    "How to Delete a List on Ahrefs",
    "Ahrefs",
    "Keep your Ahrefs workspace organized by removing lists you no longer need.",
    "cmncs6bnb0x1qxtguwc1fsk27",
    "delete-a-list-on-ahrefs"
  ],
  [
    "How to Export Keyword Data in Ahrefs",
    "Ahrefs",
    "Export keyword research for reporting and downstream analysis.",
    "cmncskobb0xjaxtguehiu023n",
    "export-keyword-data-in-ahrefs"
  ],
  [
    "How To Export Data From Airtable To Excel",
    "Airtable",
    "Export a view from Airtable and continue your analysis in Excel.",
    "DGn9J4k4I1b-b1yGLTrrz",
    "how-to-export-data-from-airtable-to-excel"
  ],
  [
    "How to create a project tracker in Airtable",
    "Airtable",
    "Build a simple project tracker with views, filters, and owners.",
    "_SO14lYN58YrG7zR3ofgm",
    "how-to-create-a-project-tracker-in-airtable"
  ],
  [
    "How to freeze columns in Airtable",
    "Airtable",
    "Keep important fields visible while you work through a wide table.",
    "Bvh4v29t_ToRV9u1FQEkB",
    "how-to-freeze-columns-in-airtable"
  ],
  [
    "How to set up and embed a kanban board in Airtable",
    "Airtable",
    "Turn a table into a shareable kanban workflow.",
    "E4Otvv5_7ouH6RXVQ8k78",
    "how-to-create-and-embed-a-kanban-board-in-airtable"
  ],
  [
    "How to create a form in Airtable",
    "Airtable",
    "Collect structured responses with a lightweight Airtable form.",
    "nZ0e5KzkL6EVdOVJzk3hS",
    "how-to-create-a-form-in-airtable"
  ],
  [
    "How to create a Gantt view chart in Airtable",
    "Airtable",
    "Visualize dates and dependencies with a Gantt view.",
    "nbnMfOchNZGLLt8eSZQaU",
    "how-to-create-a-gantt-view-chart-in-airtable"
  ],
  [
    "How to add formulas to fields in Airtable",
    "Airtable",
    "Use formulas to calculate and enrich records automatically.",
    "ZB8BqVuw0gCZ4vZJY1yRz",
    "how-to-add-formulas-to-fields-in-airtable"
  ],
  [
    "How to Change the Primary Field in Airtable",
    "Airtable",
    "Update the primary field without losing the structure of your base.",
    "u51mD3mDrXiatKgW1-uoV",
    "how-to-change-the-primary-field-in-airtable"
  ],
  [
    "How to create a chart view in Airtable",
    "Airtable",
    "Turn your records into a clear chart view for quick reporting.",
    "Hb_Ei_o1IGrVr0jk0qDaV",
    "how-to-create-a-chart-view-in-airtable"
  ],
  [
    "How to delete fields and teams in Airtable",
    "Airtable",
    "Clean up unused fields and keep your base easy to manage.",
    "IDNBPSmnlo5JTIjsKesUk",
    "how-to-delete-fields-and-teams-in-airtable"
  ],
  [
    "How to filter records in Airtable",
    "Airtable",
    "Filter records to focus each view on the work that matters.",
    null,
    "how-to-filter-records-in-airtable"
  ]
] as const;

export function MarketingTutorials() {
  const [tool, setTool] = useState<(typeof tools)[number]>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageCount = 34;
  const normalizedQuery = query.trim().slice(0, 80).toLowerCase();
  const filtered = useMemo(
    () =>
      tutorials.filter(([title, itemTool, description]) => {
        const matchesTool = tool === "All" || itemTool === tool;
        const matchesQuery =
          !normalizedQuery ||
          `${title} ${itemTool} ${description}`.toLowerCase().includes(normalizedQuery);
        return matchesTool && matchesQuery;
      }),
    [normalizedQuery, tool]
  );

  return (
    <main className="tutorials-page" id="main">
      <MarketingHeader />
      <section className="tutorials-hero" aria-labelledby="tutorials-title">
        <h1 id="tutorials-title">
          Explore step-by-step, interactive tutorials of the tools you use
        </h1>
        <p>
          Learn with interactive guides built with Supademo. Click through real workflows at your
          own pace, with no video scrubbing or blurry screenshots.
        </p>
        <label className="tutorials-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search tutorials</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value.slice(0, 80));
              setPage(1);
            }}
            placeholder="Search tutorials..."
          />
        </label>
      </section>
      <section className="tutorials-library" aria-labelledby="tutorials-library-title">
        <h2 id="tutorials-library-title" className="sr-only">
          Browse tutorials by tool
        </h2>
        <div className="tutorials-tool-chips" role="tablist" aria-label="Tutorial tools">
          {tools.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={tool === item}
              key={item}
              onClick={() => {
                setTool(item);
                setPage(1);
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="tutorials-results-heading" aria-live="polite">
          <h2>All tutorials</h2>
          <span>{filtered.length} guides</span>
        </div>
        <div className="tutorials-grid" aria-live="polite">
          {filtered.map(([title, itemTool, description, imageId, slug], index) => (
            <a
              className="tutorial-card"
              href={`/tutorials/${itemTool.toLowerCase().replaceAll(" ", "-")}/${slug}`}
              key={title}
            >
              <div className={`tutorial-card-art tutorial-card-art-${index % 4}`}>
                {imageId ? (
                  <img
                    src={`https://app.supademo.com/api/demo/${imageId}/image`}
                    alt={`${title} screenshot`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="tutorial-card-image-placeholder" aria-hidden="true" />
                )}
              </div>
              <div className="tutorial-card-copy">
                <span>{itemTool}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <strong>
                  View tutorial <span aria-hidden="true">→</span>
                </strong>
              </div>
            </a>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="tutorials-empty" role="status">
            No tutorials match that search. Try another tool or keyword.
          </p>
        ) : null}
        <nav className="tutorials-pagination" aria-label="Tutorial pages">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span aria-live="polite">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
          >
            Next
          </button>
        </nav>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
