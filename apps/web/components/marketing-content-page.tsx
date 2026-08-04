"use client";

import { useMemo, useState } from "react";
import { getMarketingBlogArticle, MarketingBlogPage } from "./marketing-blog";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import { isIndustrySlug, MarketingIndustryPage } from "./marketing-industry";
import { MarketingReportPage } from "./marketing-report";

type ContentPageProps = {
  slug: readonly string[];
};

type ContentCard = {
  title: string;
  description: string;
  href: string;
  tag: string;
};

const articleTitles: Record<string, { title: string; description: string; tag: string }> = {
  "blog/product-update-mcp-server": {
    title: "Announcing Supademo's MCP Server",
    description: "Create, edit, and personalize product demos with natural language.",
    tag: "Product update"
  },
  "blog/product-update-june-recap": {
    title: "New in June: voiceovers, advanced search, and more",
    description: "A look at the latest Supademo product updates and workflow improvements.",
    tag: "Product update"
  },
  "blog/product-update-may-recap": {
    title: "New in May: 4K recording, Showcases 2.0, and AI voiceovers",
    description: "The newest ways to record, personalize, and share product knowledge.",
    tag: "Product update"
  },
  "blog/sales/interactive-product-demo": {
    title: "The complete guide to interactive product demos",
    description: "Learn what interactive demos are, why they work, and how teams use them.",
    tag: "Sales"
  },
  "blog/sales/create-better-interactive-demos": {
    title: "How to create better interactive demos",
    description: "A practical framework for finding the aha moments that move buyers forward.",
    tag: "Sales"
  },
  "blog/sales/leveraging-interactive-demos": {
    title: "7 ways teams use interactive demos to move work forward",
    description: "Six useful ways marketing, sales, and customer teams can show the product.",
    tag: "Sales"
  },
  "blog/startup/how-supademo-uses-supademo": {
    title: "How Supademo uses Supademo",
    description: "A behind-the-scenes look at how our teams show, teach, and validate ideas.",
    tag: "Inside Supademo"
  },
  "blog/supademo-vs-claude-code": {
    title: "Supademo vs Claude Code: vibe-code or use a demo platform?",
    description: "Where AI coding helps and where a purpose-built demo workflow wins.",
    tag: "AI"
  },
  "blog/saas-is-changing": {
    title: "SaaS is changing: the product story matters more than ever",
    description: "How modern buyers evaluate software and what teams can do about it.",
    tag: "Growth"
  },
  "blog/ai-demo-agent-guide": {
    title: "How to build an AI Demo Agent that qualifies buyers 24/7",
    description:
      "Train, configure, validate, and launch an agent that can guide product discovery.",
    tag: "AI"
  },
  "blog/naoma-alternatives": {
    title: "The best Naoma AI alternatives in 2026",
    description: "A practical comparison for teams looking for a more flexible demo experience.",
    tag: "Comparisons"
  },
  "blog/bootstrapping-vs-vc": {
    title: "Bootstrapping vs VC: which is better in the age of AI?",
    description: "A founder-focused view of optionality, speed, and sustainable growth.",
    tag: "Startups"
  },
  "blog/karumi-alternatives": {
    title: "7 best Karumi alternatives for agentic product demos in 2026",
    description: "Compare the workflows teams use to make product education self-serve.",
    tag: "Comparisons"
  },
  "blog/best-ai-bdr-tools": {
    title: "Best AI BDR Tools for Outbound, Pipeline, and Demo-Led Qualification",
    description: "A workflow-first guide to AI tools for qualification and enablement.",
    tag: "AI"
  },
  "blog/rise-of-ai-demo-agents": {
    title: "AI Demo Agents: A Founder's POV On New B2B SaaS Demo Motion",
    description: "Why interactive, conversational demos are becoming part of the buying journey.",
    tag: "AI"
  },
  "blog/g2-fastest-growing-product": {
    title: "Supademo ranked #5 fastest-growing product by G2",
    description: "What the recognition means for the teams building a more useful demo platform.",
    tag: "Company"
  },
  "content/state-of-interactive-demos-2026": {
    title: "State of Interactive Demos 2026",
    description:
      "Industry research on how modern teams make software easier to evaluate and adopt.",
    tag: "Research"
  }
};

type ArticleSection = {
  heading: string;
  paragraphs: readonly string[];
};

const defaultArticleSections: readonly ArticleSection[] = [
  {
    heading: "Start with the viewer's question",
    paragraphs: [
      "A useful product story starts with the question a real viewer is trying to answer. Make that question visible, then choose the shortest path to a confident next step.",
      "The strongest demos stay focused on an outcome rather than a tour of every feature. Give the viewer just enough context to understand why the workflow matters and what they can do next."
    ]
  },
  {
    heading: "Make the aha moment easy to find",
    paragraphs: [
      "Aha moments are small, concrete proof points: a faster workflow, a new capability, or a result the viewer can imagine achieving. Use chapter labels and concise hotspot copy to point directly at that proof.",
      "When every step has a job, viewers can explore at their own pace without losing the thread. Remove decorative steps that do not answer a question or move the story forward."
    ]
  },
  {
    heading: "Build a path for each use case",
    paragraphs: [
      "Different audiences need different context. A sales prospect may want the business outcome first, while a new customer may need a guided setup path. Keep the source capture reusable and tailor the layer of explanation for each audience.",
      "Personalized chapters, variables, and share links let teams reuse the same product truth without forcing every viewer through the same sequence."
    ]
  },
  {
    heading: "Set expectations before the first click",
    paragraphs: [
      "Tell viewers how long the experience will take and what they will leave with. A short promise such as ‘Explore the workflow in six clicks’ creates a clear contract and lowers the cost of starting.",
      "Use an intro chapter, progress cues, and descriptive actions to keep the experience calm. The viewer should always know where they are and why the next step is worth taking."
    ]
  },
  {
    heading: "Use interaction to teach, not distract",
    paragraphs: [
      "Interactive demos work when the interaction reveals useful detail. Use callouts, custom areas, branching, and motion sparingly so each control reinforces the product story.",
      "A consistent visual language makes the demo feel like one coherent experience. Keep labels short, use accessible contrast, and avoid asking viewers to hunt for the next action."
    ]
  },
  {
    heading: "Personalize the handoff",
    paragraphs: [
      "The final step should connect the lesson to an action: start a trial, book time, open the next chapter, or send a question. Match the call to action to the intent signaled by the path the viewer chose.",
      "Trackable links and lightweight forms make the handoff measurable while keeping the experience self-serve. Pass only the context the next person needs to continue the conversation."
    ]
  },
  {
    heading: "Keep the source current",
    paragraphs: [
      "A demo is part of the product surface. Review it whenever the interface, positioning, or workflow changes, and make ownership explicit so stale screenshots do not quietly become customer-facing documentation.",
      "A small maintenance habit—checking links, voiceovers, redactions, and key chapters on a regular cadence—protects trust and keeps every share link useful."
    ]
  },
  {
    heading: "Measure the outcome",
    paragraphs: [
      "Look beyond plays. Measure whether viewers reach the important step, which paths they choose, where they pause, and whether the experience helps them take the next action.",
      "Use those signals to shorten confusing sections, expand useful proof, and give each team a feedback loop. The goal is not more clicks; it is a clearer path to understanding."
    ]
  }
];

const articleSectionsByKey: Record<string, readonly ArticleSection[]> = {
  "blog/sales/create-better-interactive-demos": [
    {
      heading: "First off: what are interactive product demos?",
      paragraphs: [
        "Interactive product demos are self-paced experiences that let a viewer explore a product through a curated sequence of screens, context, and actions. They sit between a static video and a live walkthrough: the story is prepared, but the viewer controls the pace.",
        "That makes them useful anywhere a team needs to explain a workflow clearly without asking a specialist to repeat the same meeting."
      ]
    },
    {
      heading: "Key benefits of interactive product demos",
      paragraphs: [
        "A focused demo gives buyers a concrete way to evaluate value, gives customers a repeatable way to learn, and gives internal teams a shareable source of product truth.",
        "Because the experience is measurable, teams can see which moments create confidence and improve the story instead of guessing."
      ]
    },
    {
      heading: "Step-by-step: making great interactive demos",
      paragraphs: [
        "Start with the outcome, map the shortest credible path, and then layer in the explanation a viewer needs at each decision point. A storyboard keeps the capture honest and prevents the demo from becoming a feature catalogue.",
        "The following practices turn that outline into a polished experience that feels personal without multiplying production work."
      ]
    },
    {
      heading: "1) Storyboard your benefits",
      paragraphs: [
        "Write the viewer's job-to-be-done before you record a screen. Choose the few moments that prove the benefit and label each one in language the audience already uses.",
        "A storyboard also gives reviewers a safe place to challenge scope before a long capture becomes expensive to change."
      ]
    },
    {
      heading: "2) Focus on clear, aha moments",
      paragraphs: [
        "An aha moment is the point where a viewer can picture the product solving their problem. Make it visually obvious with a short callout, a deliberate pause, or a concrete before-and-after.",
        "If a screen needs a paragraph of explanation, split the step or move the detail into a chapter so the main story keeps its pace."
      ]
    },
    {
      heading: "3) Tailor the interactive demo for specific use cases",
      paragraphs: [
        "Create one source of truth and then tailor the framing for sales, onboarding, support, and enablement. Variables and branching let each audience see the context that matters without duplicating the whole demo.",
        "Use a small set of purposeful paths rather than trying to recreate every possible product journey."
      ]
    },
    {
      heading: "4) Set expectations for the viewer",
      paragraphs: [
        "Tell the viewer how many steps they will explore and what they will learn. A simple promise makes the experience feel lightweight and gives people a reason to begin.",
        "Keep progress, navigation, and completion states consistent so the viewer never has to decode the interface while learning the product."
      ]
    },
    {
      heading: "5) Add CTAs throughout the interactive demo",
      paragraphs: [
        "Use calls to action at moments of intent, not only at the final frame. A viewer who is ready to start, compare, or talk to a person should not have to backtrack to find the next step.",
        "Keep the action specific and make sure the destination preserves enough context to continue the story."
      ]
    },
    {
      heading: "6) Add design variations to your hotspots",
      paragraphs: [
        "Use a small, intentional set of hotspot styles to distinguish context, interaction, and emphasis. Callouts can explain a pattern while custom areas make the next click obvious.",
        "Accessible contrast, readable type, and restrained motion help the layer feel native to the product instead of sitting on top of it."
      ]
    },
    {
      heading: "7) Personalize with variables and trackable share links",
      paragraphs: [
        "A few meaningful variables—such as the viewer's name, team, or chosen workflow—can make a demo feel made for the moment. Trackable links show which story is helping and where the handoff happens.",
        "Keep personalization bounded and transparent. The experience should be useful even when a viewer chooses not to share additional information."
      ]
    },
    {
      heading: "Tips for maintenance and updates",
      paragraphs: [
        "Assign an owner, check the critical path after product releases, and retire links that no longer describe the current experience. A short review cadence prevents small changes from becoming a credibility problem.",
        "When a source screen changes, update the copy, voiceover, redactions, and destination together so the experience remains coherent."
      ]
    },
    {
      heading: "Keep Your Demos Fresh",
      paragraphs: [
        "Treat the best-performing demo paths as living product content. Refresh examples, add new proof, and remove steps that viewers consistently skip.",
        "A fresh demo reflects a team that is paying attention to the customer's reality."
      ]
    },
    {
      heading: "Distribute Strategically",
      paragraphs: [
        "Place the right path where the question appears: on a product page, in a sales follow-up, inside onboarding, or beside a support answer. The same product truth can serve each moment when the framing is right.",
        "Use a small library of clear titles and descriptions so teammates can choose a relevant experience quickly."
      ]
    },
    {
      heading: "Conclusion",
      paragraphs: [
        "The best interactive demos are not miniature copies of a product. They are deliberate product stories: short enough to finish, specific enough to believe, and useful enough to revisit.",
        "Start with one audience and one outcome, learn from the first viewers, and build the next path from what they actually needed."
      ]
    }
  ]
};

/* The reference publishes a number of editorial articles with distinct
 * chapter outlines. Keep those outlines explicit so the local pages preserve
 * the same scan-friendly structure instead of collapsing every article into
 * one generic template. The copy remains deliberately bounded and reusable;
 * titles are fixed content, never user input. */
const articleHeadingSets: Record<string, readonly string[]> = {
  "blog/sales/interactive-product-demo": [
    "What is an interactive product demo?",
    "What are the benefits of interactive demos?",
    "Popular use cases for interactive product demos",
    "Interactive product demos for marketing",
    "Interactive product demos for sales",
    "Interactive product demos for customer success",
    "Additional use cases of interactive product demos",
    "Examples of Interactive Product Demos",
    "Lemlist - Product Overview",
    "Supademo - Onboarding Toolkit",
    "How to create an interactive product demo",
    "Interactive product demo best practices",
    "Get started with your first interactive demo"
  ],
  "blog/sales/leveraging-interactive-demos": [
    "What is an interactive product demo?",
    "6 Helpful Use Cases of Interactive Product Demos",
    "Use cases for the marketing team",
    "1. Share a product tour",
    "2. Product updates & change logs",
    "Use cases for customer success team",
    "1. Self-paced onboarding guides",
    "2. Knowledge bases and support docs",
    "Use cases for the sales team",
    "5. Email outreach",
    "6. Post-demo call sales collateral",
    "Start with your first interactive product demo"
  ],
  "blog/startup/how-supademo-uses-supademo": [
    "Why Supademo uses Supademo",
    "Sales & Enablement",
    "Prospecting + Early Demos",
    "Enablement",
    'Follow-Ups and Demo "Leave Behinds"',
    "Marketing",
    "Product updates and changelog",
    "Website product tours",
    "Email Marketing",
    "Content marketing + SEO",
    "Social Media",
    "Product Design and Validation",
    "Internal scoping and validation",
    "Customer Success, Support & Onboarding",
    "User Onboarding",
    "Knowledge base + help docs",
    "Support tickets",
    "Internal training + communication",
    "In Conclusion"
  ],
  "blog/product-update-june-recap": [
    "Voiceovers 2.0 with a new expressive mode",
    "Command K search across every layer of Supademo",
    "A redesigned dashboard built around Create, Share, and Measure",
    "A unified Workspace Settings hub",
    "Integration updates: manual field mapping and Seismic",
    "Manual field mapping for CRM integrations",
    "New: Supademo + Seismic integration",
    "Wrapping up"
  ],
  "blog/supademo-vs-claude-code": [
    "The short answer",
    "The main types of product demos (and how automatable each one is)",
    "1. Explainer demo",
    "2. Video demo (recorded product walkthrough)",
    "3. Live demo",
    "4. Guided interactive demo",
    "5. Sandbox / self-exploration demo",
    "6. Agentic demo",
    "The five demo “modules” / where vibe-coding wins and where it breaks",
    "1. Creation",
    "2. Editing and personalization",
    "3. Sharing and distribution",
    "4. Tracking and analytics",
    "5. Maintenance, updates, and collaboration",
    "The verdict: build (vibe-code) vs. buy (Supademo), by demo type",
    "Time and cost: what each approach actually costs you",
    "Use AI for momentum, Supademo for the demos that have to perform"
  ],
  "blog/saas-is-changing": [
    "Shift #1: Being Top of Mind Beats Having More Features",
    'What "top of mind" looks like in practice',
    "How to build your way into that position",
    "Shift #2: Buyers Run Their Own Evaluation Now",
    "AI agents are now part of the buying committee",
    "How to make your product self-serve and AI-ready",
    "Shift #3: The Winners Become Part of the Workflow",
    "1. Become the default tool for a job",
    "2. Integrate into the processes a company already has",
    "3. Spread laterally across the org",
    "4. Make new users successful fast",
    "Shift #4: Lean, Capital-Efficient, AI-Native Teams Are Winning",
    "Why too much money can actually hurt you",
    "The painkiller vs. vitamin test",
    "What to do this week"
  ],
  "blog/product-update-may-recap": [
    "Unlimited free 4K screen and webcam recording",
    "Why it matters",
    "Showcases 2.0",
    "Why it matters",
    "Custom pronunciation dictionary for AI voiceovers and agents",
    "Why it matters",
    "Faster, lower-cost AI Demo Agents",
    "Why it matters",
    "What’s improved",
    "Improved demo playback and caption controls",
    "Better video embeds and uploads",
    "Wrapping up"
  ],
  "blog/ai-demo-agent-guide": [
    "What Is an AI Demo Agent?",
    "Step 1: Train the Agent on Your Product Knowledge",
    "Adding Contextual Hints",
    "Don’t Forget Text Snippets",
    "Step 2: Configure How the Agent Sells",
    "Define the Agent’s Identity",
    "Set Up Communication Modes and CTAs",
    "The Most Important Step: Guardrails",
    "Step 3: Validate With the Agent Readiness Checklist",
    "Step 4: Go Live and Track Every Conversation",
    "The Agentic Demo Experience",
    "Session Summaries for Your Sales Team",
    "Why Agentic Demos Are the Future of SaaS Sales",
    "Getting Started With Your Own AI Demo Agent"
  ],
  "blog/naoma-alternatives": [
    "Quick comparison: Naoma alternatives at a glance",
    "What is Naoma AI?",
    "Key Naoma AI features",
    "Why look for Naoma AI alternatives?",
    "1. You want more narrative control",
    "2. Setup and maintenance can become a black box",
    "3. Pricing needs to scale predictably",
    "4. You need to scale demos across more use cases",
    "5. You need enterprise-grade security",
    "6. You want a demo automation platform, not a narrow AI front end",
    "How we selected the best Naoma AI alternatives",
    "Top 7 Naoma AI alternatives in 2026",
    "1. Supademo AI Demo Agent",
    "Where Supademo wins over Naoma AI",
    "Supademo AI Demo Agent vs Naoma AI",
    "Honest limitations",
    "2. Karumi AI",
    "Where Karumi wins over Naoma AI",
    "What to validate before choosing Karumi",
    "3. 1Mind",
    "Where 1Mind wins over Naoma AI",
    "Where 1Mind may fall short",
    "4. Saleo AI Demo Agent",
    "Where Saleo wins over Naoma AI",
    "Limitations to consider",
    "5. Consensus AI",
    "Where Consensus wins over Naoma AI",
    "What to keep in mind",
    "6. Warmly",
    "Where Warmly wins over Naoma AI",
    "Where Warmly may not be enough",
    "7. Dialora",
    "Where Dialora wins over Naoma AI",
    "When Dialora is not the right fit",
    "Which Naoma AI alternative should you choose?",
    "Final thoughts on choosing the right agentic demo platform"
  ],
  "blog/bootstrapping-vs-vc": [
    "The Hidden Costs of Raising Venture Capital",
    "Why Bootstrapping Is Not Always the Answer",
    "The Framework for Deciding Between VC and Bootstrapping",
    "The Bottom Line: AI Lowers the Cost of Starting, Not Winning"
  ],
  "blog/karumi-alternatives": [
    "What is Karumi?",
    "How I evaluated the top Karumi alternatives",
    "Karumi alternatives at a glance",
    "The 7 best Karumi alternatives in 2026",
    "1. Supademo AI Demo Agent",
    "How it works:",
    "Key features",
    "Pricing and setup: Supademo vs. Karumi",
    "Honest trade-offs:",
    "2. 1Mind",
    "How it works:",
    "Key features:",
    "Honest trade-offs:",
    "3. Naoma AI",
    "How it works",
    "Key features",
    "Honest trade-offs",
    "4. Saleo AI Demo Agent",
    "How it works",
    "Key features",
    "Honest trade-offs",
    "5. Consensus AI Agents",
    "How it works",
    "Key features",
    "Honest trade-offs",
    "6. Storylane RepX",
    "How it works",
    "Key features",
    "Honest trade-offs",
    "7. Navattic Agent Demos",
    "How it works",
    "Key features",
    "Honest trade-offs",
    "How to choose the right Karumi alternative",
    "Choose a screen-control agent if:",
    "Choose an asset-orchestration agent if:",
    "Final thoughts"
  ],
  "blog/best-ai-bdr-tools": [
    "What is an AI BDR?",
    "Top 8 AI SDR tools for winning deals in 2026",
    "1. Artisan Ava",
    "2. 11x Alice",
    "3. Autobound AI",
    "4. Apollo AI",
    "5. Outreach AI",
    "6. Salesloft AI",
    "7. Sybill",
    "8. Supademo AI Demo Agent",
    "AI BDR tools by workflow",
    "How to choose the right AI BDR tool"
  ],
  "blog/rise-of-ai-demo-agents": [
    "What is an AI demo agent?",
    "Where AI demo agents fit and where they don’t",
    "What changes with AI demo agents?",
    "Product clarity moves earlier",
    "Intent gets captured when it is fresh",
    "Qualification becomes behavioral",
    "Demo content becomes active enablement",
    "How AI demo agents actually work",
    "Curated vs. live: how autonomous should an AI demo agent be?",
    "Risks live AI demo agents",
    "Why curated AI demo agent beats screen-control AI agents",
    "What to evaluate when you're choosing an AI demo agent",
    "The future of product demos with AI agents"
  ]
};

const generatedArticleSectionsByKey: Record<string, readonly ArticleSection[]> = Object.fromEntries(
  Object.entries(articleHeadingSets).map(([key, headings]) => [
    key,
    headings.map((heading, index) => ({
      heading,
      paragraphs: defaultArticleSections[index % defaultArticleSections.length].paragraphs
    }))
  ])
) as Record<string, readonly ArticleSection[]>;

const articleInlineImages: Record<string, readonly { src: string; alt: string }[]> = {
  "blog/product-update-mcp-server": [
    {
      src: "https://cdn.sanity.io/images/eyuvl764/production/0b33465412974f9ee6264099d258dc6fbfedbcda-1536x666.png?w=1200&q=85",
      alt: "Photo of example MCP prompt"
    },
    {
      src: "https://cdn.sanity.io/images/eyuvl764/production/6ff3b4e4148920aa2ee1df4e7e0d95d9b90c9dec-1012x821.png?w=1200&q=85",
      alt: "Example prompt response"
    }
  ],
  "blog/sales/create-better-interactive-demos": [
    {
      src: "https://cdn.sanity.io/images/eyuvl764/production/d3677990e494f6207872443045ac349b346a97a3-1914x1080.png?w=1200&q=85",
      alt: "Interactive demo hotspot examples"
    },
    {
      src: "https://d33v4339jhl8k0.cloudfront.net/docs/assets/65cd1b060e92bd4055f3b684/images/662be8255027f87fcc6bdd0d/file-DYYW3UUC4m.png",
      alt: "Personalized interactive demo hotspots"
    }
  ]
};

const articleFaqs = [
  [
    "What makes a product demo effective?",
    "An effective demo answers a specific viewer question, shows a credible outcome, and gives the viewer a clear next step without unnecessary detours."
  ],
  [
    "How long should an interactive demo be?",
    "Keep the main path as short as the outcome allows. Most viewers prefer a focused sequence they can finish in a few minutes, with optional chapters for deeper exploration."
  ],
  [
    "How do teams keep demos up to date?",
    "Assign an owner, review the critical path after product changes, and update screens, copy, voiceovers, and links together."
  ],
  [
    "How can I measure whether a demo is working?",
    "Track completion, meaningful step engagement, path selection, and the action after the demo. Those signals show where the story earns attention and where it loses momentum."
  ],
  [
    "Can one source demo serve multiple audiences?",
    "Yes. Branching, variables, chapters, and trackable links let teams reuse the same product truth while changing the context for each audience."
  ],
  [
    "What should I improve first?",
    "Start with the step where viewers pause or leave. Clarify the promise, shorten the copy, and make the next action unmistakable before adding more content."
  ]
] as const;

const articleFaqHeadings: Record<string, string> = {
  "blog/sales/interactive-product-demo":
    "Frequently Asked Questions about interactive product demo 101",
  "blog/sales/create-better-interactive-demos":
    "Frequently Asked Questions about creating interactive demos",
  "blog/sales/leveraging-interactive-demos":
    "Frequently Asked Questions about top 6 interactive product demo use cases you need to know",
  "blog/startup/how-supademo-uses-supademo":
    "Frequently Asked Questions about demo automation with Supademo",
  "blog/product-update-june-recap":
    "Frequently asked questions about Supademo’s June 2026 product updates",
  "blog/product-update-may-recap":
    "Frequently asked questions about Supademo’s May 2026 product updates",
  "blog/ai-demo-agent-guide": "Getting Started With Your Own AI Demo Agent",
  "blog/naoma-alternatives": "Frequently Asked Questions about Naoma Alternatives",
  "blog/bootstrapping-vs-vc": "Frequently Asked Questions",
  "blog/karumi-alternatives": "Frequently Asked Questions about Karumi Alternatives",
  "blog/best-ai-bdr-tools": "Frequently Asked Questions",
  "blog/rise-of-ai-demo-agents": "Frequently Asked Questions about Agentic product demos",
  "blog/supademo-vs-claude-code": "FAQ",
  "blog/saas-is-changing": "Frequently Asked Questions"
};

const mcpSectionDetails = [
  {
    paragraphs: [
      "MCP is a shared language between a model and the tools a team trusts. Instead of asking an assistant to guess at a private editor API, you give it a small set of named capabilities with clear inputs and outcomes.",
      "That boundary keeps the request understandable and makes the result reviewable. The assistant can propose an edit, while the demo owner remains responsible for deciding what becomes customer-facing.",
      "Supademo MCP is designed around the things demo teams already do every week: keep a story current, adapt it for a new audience, and move a viewer to the next useful action."
    ],
    bullets: [
      "Describe the change in plain language",
      "Keep the source demo as the system of record",
      "Review before publishing"
    ]
  },
  {
    paragraphs: [
      "Demo libraries grow faster than most teams expect. A single launch can create a sales path, an onboarding path, a support answer, an internal enablement guide, and several personalized follow-ups.",
      "Without a shared editing loop, every small product change creates a queue of manual updates. MCP turns those repetitive edits into bounded requests that can be handled alongside the rest of the planning conversation.",
      "The result is less context switching for the person who owns the story and less risk that an old screen quietly becomes the version a buyer sees."
    ],
    bullets: [
      "Reduce repetitive hotspot edits",
      "Keep voiceovers and labels aligned",
      "Make maintenance part of the workflow"
    ]
  },
  {
    paragraphs: [
      "Use MCP when the request is specific enough to review: update a chapter title, redact a sensitive field, add a step for a new workflow, or create a share link for a named audience.",
      "It is also useful for content operations. A team can ask for the same safe transformation across a set of demos, then inspect the changes before anything is published.",
      "The best use cases keep human judgment in the loop while removing the repetitive clicks that do not require a human to make a creative decision."
    ],
    bullets: [
      "Launch and release notes",
      "Onboarding and support libraries",
      "Sales follow-ups and enablement"
    ]
  },
  {
    paragraphs: [
      "The larger unlock is a product story that can keep up with the product itself. Teams can start with one clear source demo, then adapt the framing for each moment without rebuilding the capture from scratch.",
      "Because the request and the result stay visible in the conversation, collaborators can understand what changed and why. That makes the workflow easier to hand off across product, marketing, sales, and customer success.",
      "Supademo MCP gives teams a practical way to use AI for product education while preserving the controls that make a public demo trustworthy."
    ],
    bullets: [
      "Create a reusable source of truth",
      "Personalize without duplicating production",
      "Publish with clear guardrails"
    ]
  }
] as const;

const relatedArticleTitles = [
  "The fastest way to create interactive product demos",
  "Interactive Product Demo 101: A Complete Guide",
  "6 Examples of Interactive Product Demos for Sales Enablement",
  "Unlocking Growth: A Step-by-Step Guide to Creating Engaging Interactive Demos",
  "7 Benchmarks for High-Performing Interactive Demos in 2026"
] as const;

const mcpFaqs = [
  [
    "What is Supademo MCP?",
    "Supademo MCP is a permissioned connection that lets compatible AI assistants work with the Supademo editing and sharing workflow."
  ],
  [
    "How does Supademo MCP work with Claude, ChatGPT, and Gemini?",
    "You describe a bounded request in the assistant, review the proposed result, and keep the final change in the Supademo workspace."
  ],
  [
    "What can you do with Supademo MCP?",
    "Update hotspot copy, add or remove steps, refresh voiceovers, personalize context, and create focused share links."
  ],
  [
    "Who is Supademo MCP for?",
    "It is built for product, marketing, sales, enablement, support, and customer success teams maintaining a shared library of demos."
  ],
  [
    "How is Supademo MCP different from Supademo's built-in editor?",
    "The editor gives you direct visual control. MCP adds a natural-language editing path for repeatable changes and collaborative workflows."
  ],
  [
    "Can Supademo MCP personalize demos at scale?",
    "Yes. Use bounded variables and share-link workflows to adapt a source story while preserving the controls and review steps your team requires."
  ],
  [
    "Will Supademo MCP support approvals and guardrails for customer-facing changes?",
    "The workflow is designed to keep review and publishing decisions explicit, so teams can add the approval rules that fit their workspace."
  ]
] as const;

const mcpRelatedArticleTitles = [
  "New in April 2026: Account Analytics, Offline Demos, MCP, Route Hub & AI Demo Agents",
  "How Supademo uses Supademo for Demo Automation",
  "Supademo for Product Managers: Showcasing New Features Effectively",
  "Why the Demo Layer is Becoming Core GTM Infrastructure",
  "What is Demo Automation? [+Examples, Use Cases & ROI]",
  "Smart Blur, Showcase & Custom Variables, Workspace Upgrades"
] as const;

const directoryCards: ContentCard[] = [
  {
    title: "How to create better interactive demos",
    description: "A practical guide to building focused product stories.",
    href: "/blog/sales/create-better-interactive-demos",
    tag: "Sales"
  },
  {
    title: "The rise of AI Demo Agents",
    description: "Understand the new conversational product experience.",
    href: "/blog/rise-of-ai-demo-agents",
    tag: "AI"
  },
  {
    title: "New in June: voiceovers, advanced search, and more",
    description: "See what shipped and how it changes your workflow.",
    href: "/blog/product-update-june-recap",
    tag: "Product update"
  },
  {
    title: "How Supademo uses Supademo",
    description: "The playbook our own teams use to show the work.",
    href: "/blog/startup/how-supademo-uses-supademo",
    tag: "Inside Supademo"
  },
  {
    title: "State of Interactive Demos 2026",
    description: "Research and benchmarks for the self-serve buying journey.",
    href: "/content/state-of-interactive-demos-2026",
    tag: "Research"
  },
  {
    title: "How to build an AI Demo Agent",
    description: "A step-by-step guide for product and revenue teams.",
    href: "/blog/ai-demo-agent-guide",
    tag: "AI"
  }
];

const legalCopy: Record<string, { title: string; description: string; updated: string }> = {
  "terms-of-service": {
    title: "Terms of Service",
    description: "The terms that govern use of Supademo products and services.",
    updated: "Last updated July 2026"
  },
  "privacy-policy": {
    title: "Privacy Policy and Data Security",
    description: "How Supademo collects, uses, protects, and deletes personal information.",
    updated: "Last updated July 2026"
  },
  "privacy-policy/ai": {
    title: "AI Policy",
    description: "How Supademo handles data, safety, and controls for AI-powered features.",
    updated: "Last updated July 2026"
  },
  dpa: {
    title: "Supademo Data Processing Agreement",
    description: "Data processing terms for customers who use Supademo as a processor.",
    updated: "Last updated July 2026"
  }
};

const legalSectionTitles: Record<string, readonly string[]> = {
  "terms-of-service": [
    "Definitions",
    "Account Registration and Authority",
    "Access Grant and License",
    "Usage Limitations and Prohibited Uses",
    "Platform Access and User Management",
    "Fees, Billing, and Subscriptions",
    "Customer Content and Intellectual Property",
    "Company Intellectual Property",
    "Logo and Brand Usage",
    "Data Protection and Privacy",
    "AI Features and Disclaimers",
    "Third-Party Services",
    "Service Availability and Support",
    "Confidentiality",
    "Export Control and Compliance",
    "Indemnification",
    "Limitation of Liability",
    "Suspension and Termination",
    "Modifications to Terms",
    "Dispute Resolution and Governing Law",
    "General Provisions",
    "Contact Information"
  ],
  "privacy-policy": [
    "Key Privacy Principles",
    "Information We Collect",
    "How We Use Your Information",
    "Legal Bases for Processing (GDPR)",
    "Data Sharing and Disclosure",
    "Data Security and Protection",
    "AI Features and Data Processing",
    "International Data Transfers",
    "Data Retention",
    "Your Privacy Rights",
    "Cookies and Tracking Technologies",
    "Children's Privacy",
    "Enterprise and Business Customers",
    "Changes to This Privacy Policy",
    "Compliance and Certifications",
    "Third-Party Links and Services",
    "Data Breach Notification",
    "Contact Information",
    "Additional Resources"
  ],
  "privacy-policy/ai": [
    "Scope and Application",
    "AI Feature Implementation",
    "Disabling AI Across Your Workspace",
    "Data Usage and Training",
    "Accuracy and Reliability Disclaimers",
    "Security and Compliance",
    "Prohibited Uses",
    "Limitation of Liability",
    "Updates and Modifications",
    "Contact Information"
  ],
  dpa: [
    "How this DPA applies",
    "1. Definitions",
    "2. Roles and scope of Processing",
    "3. Processing instructions",
    "4. Confidentiality of Processing",
    "5. Security",
    "6. Subprocessors",
    "7. Data Subject requests",
    "8. Assistance to Customer",
    "9. Security Incident notification",
    "10. International transfers",
    "11. Audits",
    "12. CCPA and US state privacy laws",
    "13. Deletion and return",
    "14. Liability",
    "15. General",
    "Annex 1 — Details of Processing",
    "Annex 2 — Technical and organizational measures",
    "Annex 3 — Subprocessors"
  ]
};

function legalSectionParagraphs(section: string, title: string) {
  if (title === "Terms of Service") {
    return [
      `${section} explains the rules that apply when an organization uses Supademo and the responsibilities of the people managing that workspace.`,
      `Keep access scoped to the right users and contact legal@supademo.com when your agreement or a specific obligation needs review.`
    ];
  }
  if (title === "Supademo Data Processing Agreement") {
    return [
      `${section} records the roles, safeguards, and responsibilities that apply to processing customer data through Supademo.`,
      `For agreement-specific questions, contact legal@supademo.com.`
    ];
  }
  if (title === "AI Policy") {
    return [
      `${section} explains the controls and expectations for Supademo's AI-powered features. Contact legal@supademo.com with a policy question.`
    ];
  }
  return [
    `${section} describes the responsibilities and controls that apply when an organization uses Supademo. We keep the service focused on the stated purpose, document the relevant roles, and make material changes visible to the people who rely on this document.`,
    `For ${title.toLowerCase()}, customers should use the workspace controls, access policies, and support channels available to them. If a question is specific to your organization or agreement, contact legal@supademo.com so the right record can be reviewed.`
  ];
}

function routeKey(slug: readonly string[]) {
  return slug.filter(Boolean).join("/");
}

function prettySlug(slug: readonly string[]) {
  return (slug.at(-1) ?? "Supademo")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ContentArt({ tone = "blue" }: { tone?: string }) {
  return (
    <div className={`content-page-art content-page-art-${tone}`} aria-hidden="true">
      <span className="content-art-window">
        <i />
        <i />
        <i />
        <b />
        <b />
        <b />
      </span>
      <span className="content-art-card">
        <strong>Show the useful path.</strong>
        <small>One clear step at a time.</small>
      </span>
    </div>
  );
}

function MarketingDirectoryPage({ slug }: ContentPageProps) {
  const key = routeKey(slug);
  const [filter, setFilter] = useState("All");
  const [careerSlide, setCareerSlide] = useState(0);
  const categories = ["All", "AI", "Sales", "Product update", "Research", "Inside Supademo"];
  const filteredCards = useMemo(
    () =>
      filter === "All" ? directoryCards : directoryCards.filter((card) => card.tag === filter),
    [filter]
  );

  if (key === "careers") {
    const values = [
      [
        "Build with urgency",
        "We move quickly, learn in public, and keep the work close to the customer."
      ],
      ["Default to ownership", "Small teams make clear decisions and follow through together."],
      [
        "Make showing easy",
        "We care deeply about craft, clarity, and the people who use what we build."
      ]
    ];
    const value = values[careerSlide];
    return (
      <main className="content-directory-page careers-page" id="main">
        <MarketingHeader />
        <section className="content-directory-hero">
          <div>
            <p className="marketing-announcement">Careers at Supademo</p>
            <h1>Grow your career with Supademo</h1>
            <p>
              Join a thoughtful, ambitious team building the easiest way to show how software works.
            </p>
            <div className="marketing-hero-actions">
              <a className="marketing-button" href="mailto:careers@supademo.com">
                See open roles
              </a>
              <a className="marketing-text-action" href="#values">
                Meet our values
              </a>
            </div>
          </div>
          <ContentArt tone="purple" />
        </section>
        <section className="content-values" id="values" aria-labelledby="values-title">
          <div className="content-section-heading">
            <p className="marketing-announcement">How we work</p>
            <h2 id="values-title">A small team with a big surface area</h2>
          </div>
          <article className="content-value-card">
            <span>0{careerSlide + 1}</span>
            <h3>{value[0]}</h3>
            <p>{value[1]}</p>
          </article>
          <div className="content-carousel-controls">
            <button
              type="button"
              aria-label="Previous value"
              disabled={careerSlide === 0}
              onClick={() => setCareerSlide((current) => Math.max(0, current - 1))}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next value"
              disabled={careerSlide === values.length - 1}
              onClick={() => setCareerSlide((current) => Math.min(values.length - 1, current + 1))}
            >
              →
            </button>
          </div>
        </section>
        <MarketingFooter />
      </main>
    );
  }

  if (key.startsWith("industries/")) {
    const industrySlug = slug.at(-1) ?? "software";
    if (isIndustrySlug(industrySlug)) return <MarketingIndustryPage slug={industrySlug} />;
  }

  if (key === "ai" || key === "ai/demo-agents") {
    const agent = key === "ai/demo-agents";
    return (
      <main className="content-directory-page ai-page" id="main">
        <MarketingHeader />
        <section className="content-directory-hero">
          <div>
            <p className="marketing-announcement">Supademo AI</p>
            <h1>
              {agent
                ? "Run demos on autopilot with AI Demo Agents"
                : "Build, qualify, and scale with AI demo agents"}
            </h1>
            <p>
              {agent
                ? "Meet every buyer with an always-on product expert that can answer questions, guide discovery, and qualify intent."
                : "Turn your product knowledge into an always-on experience for buyers, customers, and teammates."}
            </p>
            <div className="marketing-hero-actions">
              <a className="marketing-button" href="/signup">
                Try AI Demo Agents
              </a>
              <a className="marketing-text-action" href="/product">
                Explore the platform
              </a>
            </div>
          </div>
          <ContentArt tone="dark" />
        </section>
        <section className="content-card-grid" aria-label="AI demo agent capabilities">
          {[
            "Answer product questions",
            "Guide the right workflow",
            "Qualify intent automatically"
          ].map((card, index) => (
            <article className="content-card" key={card}>
              <span>0{index + 1}</span>
              <h2>{card}</h2>
              <p>
                Combine structured product knowledge with a focused, interactive path that keeps
                viewers moving.
              </p>
              <a href="/product">Learn more →</a>
            </article>
          ))}
        </section>
        <MarketingFooter />
      </main>
    );
  }

  if (key === "content" || key === "blog/product-updates") {
    return (
      <main className="content-directory-page content-library-page" id="main">
        <MarketingHeader />
        <section className="content-directory-hero content-directory-hero-compact">
          <div>
            <p className="marketing-announcement">Supademo resources</p>
            <h1>Strategic playbooks and content to help you grow</h1>
            <p>
              Practical frameworks, examples, and product updates for teams who would rather show
              than tell.
            </p>
          </div>
          <ContentArt tone="orange" />
        </section>
        <section className="content-library" aria-labelledby="content-library-title">
          <div className="content-section-heading">
            <p className="marketing-announcement">Browse the library</p>
            <h2 id="content-library-title">Useful ideas, ready to share</h2>
          </div>
          <div className="content-filter-row" role="tablist" aria-label="Resource categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={filter === category}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="content-card-grid">
            {filteredCards.map((card) => (
              <a className="content-card content-card-link" href={card.href} key={card.href}>
                <span>{card.tag}</span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <strong>Read more →</strong>
              </a>
            ))}
          </div>
        </section>
        <MarketingFooter />
      </main>
    );
  }

  if (key === "security") {
    return (
      <main className="content-directory-page security-page" id="main">
        <MarketingHeader />
        <section className="content-directory-hero">
          <div>
            <p className="marketing-announcement">Supademo security</p>
            <h1>Security every team can trust</h1>
            <p>
              Supademo protects your product knowledge with enterprise controls, clear data
              boundaries, and a security program built for modern teams.
            </p>
            <div className="marketing-hero-actions">
              <a className="marketing-button" href="https://security.supademo.com">
                Visit Trust Center
              </a>
              <a className="marketing-text-action" href="mailto:security@supademo.com">
                Contact security
              </a>
            </div>
          </div>
          <ContentArt tone="dark" />
        </section>
        <section className="content-card-grid" aria-label="Security commitments">
          {["Privacy by design", "Enterprise access controls", "Reliable infrastructure"].map(
            (card, index) => (
              <article className="content-card" key={card}>
                <span>0{index + 1}</span>
                <h2>{card}</h2>
                <p>
                  Clear controls and documented practices help teams share product knowledge
                  responsibly.
                </p>
                <a href="https://security.supademo.com">Read more →</a>
              </article>
            )
          )}
        </section>
        <MarketingFooter />
      </main>
    );
  }

  return (
    <main className="content-directory-page blog-page" id="main">
      <MarketingHeader />
      <section className="content-directory-hero content-directory-hero-compact">
        <div>
          <p className="marketing-announcement">The Supademo Blog</p>
          <h1>The ideas behind clearer product stories</h1>
          <p>
            Practical notes on interactive demos, onboarding, enablement, and the craft of showing
            useful work.
          </p>
        </div>
        <ContentArt tone="blue" />
      </section>
      <section className="content-library" aria-labelledby="blog-library-title">
        <div className="content-section-heading">
          <p className="marketing-announcement">Latest from Supademo</p>
          <h2 id="blog-library-title">Explore the journal</h2>
        </div>
        <div className="content-filter-row" role="tablist" aria-label="Blog categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="content-card-grid">
          {filteredCards.map((card) => (
            <a className="content-card content-card-link" href={card.href} key={card.href}>
              <span>{card.tag}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <strong>Read article →</strong>
            </a>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

function MarketingArticlePage({ slug }: ContentPageProps) {
  const key = routeKey(slug);
  const blogArticle = getMarketingBlogArticle(`/${key}`);
  const article = blogArticle
    ? {
        title: blogArticle.title,
        description: blogArticle.description,
        tag: blogArticle.category
      }
    : (articleTitles[key] ?? {
        title: `${prettySlug(slug)} made easier to experience`,
        description: "A practical Supademo guide for showing the product clearly.",
        tag: "Supademo guide"
      });
  const isMcpArticle = key === "blog/product-update-mcp-server";
  const genericSections =
    articleSectionsByKey[key] ?? generatedArticleSectionsByKey[key] ?? defaultArticleSections;
  const articleImages =
    articleInlineImages[key] ??
    (blogArticle ? [{ src: blogArticle.image, alt: blogArticle.alt }] : []);
  const isExpandedArticle =
    key.startsWith("blog/") &&
    !["blog/product-update-june-recap", "blog/product-update-may-recap"].includes(key);
  const faqItems = isMcpArticle ? mcpFaqs : articleFaqs;
  const relatedTitles = isMcpArticle ? mcpRelatedArticleTitles : relatedArticleTitles;
  const [activeSection, setActiveSection] = useState(0);
  const tocSections = isMcpArticle
    ? [
        "What is an MCP? How does it work with Supademo?",
        "Why this matters",
        "Common use cases",
        "What this unlocks for Supademo"
      ]
    : genericSections.map((section) => section.heading);
  const mcpSectionCopy = [
    {
      paragraphs: [
        "MCP stands for Model Context Protocol. It is an open standard that lets AI assistants connect to tools and data sources in a predictable, permissioned way.",
        "With Supademo MCP, you can ask Claude or ChatGPT to create, edit, and personalize product demos without leaving the conversation."
      ],
      video: true
    },
    {
      paragraphs: [
        "Creating demos with Supademo is already fast. But editing and maintaining them at scale can sometimes be tedious.",
        "If you manage a growing library of product demos, onboarding flows, support tutorials, or sales walkthroughs, you already know the problem. Updating hotspot text one by one, refreshing voiceovers after UI changes, swapping screenshots manually, and generating personalized share links at scale is not the best use of your team's time."
      ]
    },
    {
      paragraphs: [
        "Use MCP to update hotspot copy, add or remove steps, refresh voiceovers, and tailor a demo to a specific audience.",
        "The same workflow works for launch notes, onboarding libraries, sales follow-ups, and internal enablement—wherever a useful product story needs to stay current."
      ]
    },
    {
      paragraphs: [
        "Supademo MCP makes product knowledge easier to maintain, easier to personalize, and easier to share. Your team can spend more time on the story and less time on repetitive editing."
      ]
    }
  ];
  return (
    <main
      className={`content-article-page content-article-${key.replaceAll("/", "-")}${isMcpArticle ? " content-article-mcp-page" : ""}${isExpandedArticle ? " content-article-expanded" : ""}`}
      id="main"
    >
      <MarketingHeader />
      {isMcpArticle ? (
        <section className="content-article-mcp-header" aria-labelledby="content-article-title">
          <img
            src="https://cdn.sanity.io/images/eyuvl764/production/b41cb0939e134b3df1d2ff61ed71634da14c8eb2-2034x1090.jpg?w=1920&q=80&auto=format"
            alt="MCP server header"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="content-article-mcp-meta">
            <p className="content-article-mcp-breadcrumb">Blog&nbsp; / &nbsp;Product Updates</p>
            <h1 id="content-article-title">{article.title}</h1>
            <div className="content-article-mcp-author">
              <img
                src="https://cdn.sanity.io/images/eyuvl764/production/c7dc0cacf1f9d8365fde7ef6921cbaa805952878-769x1024.jpg?w=96&q=75"
                alt=""
                width={34}
                height={34}
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <strong>Joseph Lee</strong>
              <span>Updated on April 20, 2026</span>
            </div>
            <span className="content-article-mcp-tag">Product Updates</span>
          </div>
        </section>
      ) : (
        <section className="content-article-hero">
          <div>
            <p className="marketing-announcement">{article.tag}</p>
            <p className="content-article-breadcrumb">Supademo / {slug.join(" / ")}</p>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <div className="content-article-meta">
              <span>{blogArticle?.author ?? "Supademo editorial"}</span>
              <span>·</span>
              <span>{blogArticle?.date ?? "8 min read"}</span>
            </div>
          </div>
          {blogArticle ? (
            <img
              className="content-article-hero-image"
              src={blogArticle.image}
              alt={blogArticle.alt}
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <ContentArt tone="purple" />
          )}
        </section>
      )}
      <div className="content-article-layout">
        <aside className="content-article-toc" aria-label="On this page">
          <strong>On this page</strong>
          {tocSections.map((section, index) => (
            <button
              key={section}
              type="button"
              aria-current={activeSection === index ? "location" : undefined}
              onClick={() => setActiveSection(index)}
            >
              {section}
            </button>
          ))}
          {isMcpArticle ? (
            <div className="content-article-ai-summary" aria-label="Summarize post with AI">
              <strong>Summarize post with AI</strong>
              <div>
                <button type="button" aria-label="Summarize with ChatGPT">
                  ◎
                </button>
                <button type="button" aria-label="Summarize with Gemini">
                  ✧
                </button>
                <button type="button" aria-label="Summarize with Claude">
                  ✹
                </button>
              </div>
            </div>
          ) : null}
        </aside>
        <article className="content-article-body">
          {isMcpArticle ? (
            <>
              <p className="content-article-lede">
                Creating demos with Supademo is already fast. But editing and maintaining them at
                scale can sometimes be tedious.
              </p>
              <p className="content-article-mcp-intro">
                If you manage a growing library of product demos, onboarding flows, support
                tutorials, or sales walkthroughs, you already know the problem. Updating hotspot
                text one by one, refreshing voiceovers after UI changes, swapping screenshots
                manually, and generating personalized share links at scale is not the best use of
                your team&apos;s time.
              </p>
              <p className="content-article-mcp-intro">
                <strong>That is exactly why we built Supademo MCP.</strong>
              </p>
              {tocSections.map((section, index) => {
                const copy = mcpSectionCopy[index];
                return (
                  <section
                    key={section}
                    className={activeSection === index ? "is-active" : undefined}
                  >
                    <span className="content-article-index">0{index + 1}</span>
                    <h2>{section}</h2>
                    {copy.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {copy.video ? (
                      <div
                        className="content-article-mcp-video"
                        role="img"
                        aria-label="MCP tutorial video preview"
                      >
                        <span>▶</span>
                        <strong>MCP Tutorial: Edit Product Demos with Claude + ChatGPT</strong>
                      </div>
                    ) : null}
                    <div
                      className={`content-article-mcp-rich content-article-mcp-rich-${index + 1}`}
                    >
                      {mcpSectionDetails[index].paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      <ul>
                        {mcpSectionDetails[index].bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                      <div className="content-article-mcp-pill-grid">
                        {mcpSectionDetails[index].bullets.map((bullet, bulletIndex) => (
                          <span key={bullet}>
                            <b>0{bulletIndex + 1}</b>
                            {bullet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}
              <section className="content-article-mcp-deep-dive">
                <span className="content-article-index">05</span>
                <h2>See the workflow in action</h2>
                <p>
                  Supademo MCP keeps the editing loop inside the tools where your team already
                  thinks and writes. Ask for a focused change, review the result, and keep the
                  source demo as the durable place for product truth.
                </p>
                <div className="content-article-media-grid">
                  {articleImages.map((image) => (
                    <figure key={image.src}>
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                      <figcaption>{image.alt}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="content-article-step-grid">
                  {["Describe the change", "Review the preview", "Share the updated path"].map(
                    (step, index) => (
                      <article key={step}>
                        <span>0{index + 1}</span>
                        <h3>{step}</h3>
                        <p>
                          Keep the request bounded, inspect the result, and make the next action
                          clear for everyone who will use the demo.
                        </p>
                      </article>
                    )
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              <p className="content-article-lede">
                {article.description} In this guide, we break the idea into a few clear decisions so
                your team can move from a blank page to a useful, shareable experience.
              </p>
              {genericSections.map((section, index) => (
                <section
                  key={section.heading}
                  className={activeSection === index ? "is-active" : undefined}
                >
                  <span className="content-article-index">0{index + 1}</span>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
              <section className="content-article-playbook">
                <span className="content-article-index">
                  {String(genericSections.length + 1).padStart(2, "0")}
                </span>
                <h2>A practical playbook for your next demo</h2>
                <p>
                  Use these checkpoints as a lightweight review before you publish. They keep the
                  story focused while giving every team a shared quality bar.
                </p>
                <div className="content-article-checklist">
                  {[
                    "A clear viewer outcome",
                    "A short, credible path",
                    "A useful next action",
                    "An owner for updates"
                  ].map((item, index) => (
                    <article key={item}>
                      <span>0{index + 1}</span>
                      <strong>{item}</strong>
                      <p>Make this visible in the experience, not just in the internal brief.</p>
                    </article>
                  ))}
                </div>
                {articleImages.length > 0 ? (
                  <div className="content-article-media-grid">
                    {articleImages.slice(0, 2).map((image) => (
                      <figure key={image.src}>
                        <img
                          src={image.src}
                          alt={image.alt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                        <figcaption>{image.alt}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </section>
              {isExpandedArticle ? (
                <section className="content-article-expanded-guidance">
                  <span className="content-article-index">
                    {String(genericSections.length + 2).padStart(2, "0")}
                  </span>
                  <h2>Turn one useful story into a system</h2>
                  <p>
                    Once a path works, make it reusable. Give it a clear name, connect it to the
                    place where the question appears, and use the feedback from real viewers to
                    improve the next version.
                  </p>
                  <p>
                    This is how a small library of focused demos becomes shared product knowledge:
                    easy to find, easy to maintain, and ready for the next conversation.
                  </p>
                  <div className="content-article-quote">
                    <strong>Show the useful path.</strong>
                    <span>Every interaction should make the product easier to understand.</span>
                  </div>
                </section>
              ) : null}
            </>
          )}
          <section className="content-article-faq" aria-labelledby="content-article-faq-title">
            <span className="content-article-index">FAQ</span>
            <h2 id="content-article-faq-title">
              {isMcpArticle
                ? "Frequently Asked Questions"
                : (articleFaqHeadings[key] ??
                  `Frequently Asked Questions about ${article.title.toLowerCase()}`)}
            </h2>
            <div>
              {faqItems.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
          <section
            className="content-article-related"
            aria-labelledby="content-article-related-title"
          >
            <span className="content-article-index">More to explore</span>
            <h2 id="content-article-related-title">More from the blog</h2>
            <div className="content-article-related-grid">
              {relatedTitles.map((title, index) => (
                <a href="/blog" key={title}>
                  <span>0{index + 1}</span>
                  <strong>{title}</strong>
                  <small>Read article →</small>
                </a>
              ))}
            </div>
          </section>
        </article>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}

function MarketingLegalPage({ slug }: ContentPageProps) {
  const key = routeKey(slug);
  const legal = legalCopy[key] ?? legalCopy["terms-of-service"];
  const [activeSection, setActiveSection] = useState(0);
  const sections = legalSectionTitles[key] ?? legalSectionTitles["terms-of-service"];
  return (
    <main className={`content-legal-page content-legal-${key.replaceAll("/", "-")}`} id="main">
      <MarketingHeader />
      <section className="content-legal-hero">
        <p className="marketing-announcement">Supademo legal</p>
        <h1>{legal.title}</h1>
        <p>{legal.description}</p>
        <span>{legal.updated}</span>
      </section>
      <div className="content-legal-layout">
        <aside className="content-article-toc" aria-label="Legal document sections">
          {sections.map((section, index) => (
            <button
              key={section}
              type="button"
              aria-current={activeSection === index ? "location" : undefined}
              onClick={() => setActiveSection(index)}
            >
              {section}
            </button>
          ))}
        </aside>
        <article className="content-legal-body">
          {sections.map((section, index) => (
            <section className={activeSection === index ? "is-active" : undefined} key={section}>
              <h2>{section}</h2>
              {legalSectionParagraphs(section, legal.title).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {key !== "terms-of-service" &&
              key !== "dpa" &&
              key !== "privacy-policy/ai" &&
              index % 3 === 1 ? (
                <ul>
                  <li>Use least-privilege access and review it regularly.</li>
                  <li>Keep workspace content accurate, current, and appropriately scoped.</li>
                  <li>
                    Contact support promptly when a security or privacy concern is identified.
                  </li>
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}

export function MarketingContentPage({ slug }: ContentPageProps) {
  const key = routeKey(slug);
  if (legalCopy[key]) return <MarketingLegalPage slug={slug} />;
  if (key === "content/state-of-interactive-demos-2026") return <MarketingReportPage />;
  if (key === "blog/product-updates")
    return <MarketingBlogPage initialCategory="Product Updates" pageTitle="Product Updates" />;
  if (key.startsWith("blog/") || key.startsWith("content/"))
    return <MarketingArticlePage slug={slug} />;
  return <MarketingDirectoryPage slug={slug} />;
}
