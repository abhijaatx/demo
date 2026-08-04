"use client";

import { Fragment, useState } from "react";
import type { CSSProperties } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

type PlanKey = "starter" | "scale" | "growth" | "enterprise";

type Plan = {
  key: PlanKey;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  unit?: string;
  accent?: boolean;
  badge?: string;
  features: readonly string[];
  keyFeatureHeading: string;
  keyFeatures: readonly string[];
  footerLines: readonly string[];
  action: string;
  actionHref: string;
};

const plans: readonly Plan[] = [
  {
    key: "starter",
    name: "Starter",
    description: "For individuals getting started with interactive demos.",
    monthlyPrice: "$0",
    annualPrice: "$0",
    unit: "",
    features: ["5 guided interactive demos", "50 video recordings (4K)"],
    keyFeatureHeading: "Key features",
    keyFeatures: [
      "Unlimited demo views",
      "AI text personalization",
      "Intuitive demo editor",
      "Share as link, embed, video, PDF"
    ],
    footerLines: ["1 creator/admin included"],
    action: "Sign up for free",
    actionHref: "/signup"
  },
  {
    key: "scale",
    name: "Scale",
    description: "For teams creating demos for sales, marketing, and support.",
    monthlyPrice: "$38",
    annualPrice: "$32",
    unit: "/ month",
    features: ["Guided interactive demos", "Video recording (4K)", "Showcase collections"],
    keyFeatureHeading: "Everything in Starter Plus",
    keyFeatures: [
      "Supademo AI",
      "Supademo MCP",
      "Branching and variables",
      "Tracking links and analytics",
      "+20 premium features"
    ],
    footerLines: ["Billed per creator/admin", "5 view-only collaborators"],
    action: "Start Scale trial",
    actionHref: "/signup"
  },
  {
    key: "growth",
    name: "Growth",
    description: "For growing teams that need personalization and scale.",
    monthlyPrice: "$350",
    annualPrice: "$350",
    unit: "/ month",
    accent: true,
    badge: "Highest ROI",
    features: [
      "Guided interactive demos",
      "Guided HTML demos",
      "Sandbox demos",
      "Video recording (4K)",
      "Showcase collections",
      "AI Demo Agent"
    ],
    keyFeatureHeading: "Everything in Scale Plus",
    keyFeatures: [
      "Route Hub",
      "AI voice cloning",
      "AI data editing",
      "White-glove onboarding",
      "+10 premium features"
    ],
    footerLines: ["5 creators bundled, additional at $50/mo", "Unlimited view-only collaborators"],
    action: "Start Growth trial",
    actionHref: "/signup"
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For organizations that need a flexible, supported rollout.",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    unit: "",
    features: [
      "Guided interactive demos",
      "Guided HTML demos",
      "Sandbox demos",
      "Video recording (4K)",
      "Showcase collections",
      "AI Demo Agent"
    ],
    keyFeatureHeading: "Everything in Growth Plus",
    keyFeatures: [
      "SSO & SAML",
      "Custom data residency",
      "Multiple workspaces",
      "Dedicated support & training",
      "+10 premium features"
    ],
    footerLines: ["Starts at 10 creators bundled", "Unlimited view-only collaborators"],
    action: "Talk to a human",
    actionHref: "/product-demo"
  }
];

const comparisonSections = [
  {
    name: "Members and workspace",
    rows: [
      ["Creators", "1", "Per Seat", "5 Pre-Bundled", "10 Pre-Bundled"],
      ["View-only collaborators", "Not included in Free", "5", "Unlimited", "Unlimited"],
      ["Team workspace", "Not included in Free", "1", "1", "Multiple"],
      [
        "Folders and subfolders",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Collaborative commenting",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Record and upload",
    rows: [
      ["Guided interactive demos (Screenshots, video)", "5", "Unlimited", "Unlimited", "Unlimited"],
      [
        "Guided interactive demos (HTML cloning)",
        "Not included in Free",
        "Not included in Scale",
        "Unlimited",
        "Unlimited"
      ],
      [
        "Clickable sandbox demos",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      ["Showcases", "Not included in Free", "Unlimited", "Unlimited", "Unlimited"],
      ["Screenshots", "Not included in Free", "Unlimited", "Unlimited", "Unlimited"],
      ["Video recordings", "50", "Unlimited", "Unlimited", "Unlimited"],
      [
        "In-app Demo Hub",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Chrome extension",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Smart blur",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Figma plugin",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Upload content",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Mac desktop app",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Windows desktop app",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Editing",
    rows: [
      [
        "Pointer hotspot",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Callout hotspot",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Area hotspot",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Invisible hotspots",
        "Not included in Free",
        "Not included in Scale",
        "Yes (HTML)",
        "Yes (HTML)"
      ],
      [
        "Chapters",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "End CTA",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Multiple CTAs in chapter",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Zoom and pan",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Autoplay and loop",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Blur, crop, annotate",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "HTML editing",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Demo versioning",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "AI data editing",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Video editing",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Video splitting",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Keyboard shortcuts",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Record or upload voiceover",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "AI voiceovers",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "AI voice cloning",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Closed captions",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Generate text with AI",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Translate with AI",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Supademo MCP",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Supademo AI Copilot",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Personalization",
    rows: [
      [
        "Remove watermark",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom watermark",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom logo",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom page CTA",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom domain",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Demo backgrounds",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Background music",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Dynamic variables",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Conditional branching",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Supademo theme",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Workspace theme",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Embed forms",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Embed calendars",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Translations hub",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Sharing",
    rows: [
      [
        "Embed online",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Share as link",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Presenter Mode",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Route Hub",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Expiring share links",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Trackable share link",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Share as collection",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Offline demos",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Require email to view",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Password protection",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Access blacklist / whitelist",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Engaged viewer notifications",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Export as GIF",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      ["Export as MP4", "Up to 1080p w/ watermark", "Up to 4k", "Up to 4k", "Up to 4k"],
      [
        "Export as SOP (PDF, PNG)",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Analytics and leads",
    rows: [
      [
        "Overview analytics",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Advanced viewer insights",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "IP & session data",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Track and export leads",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Lead Analytics",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Company Analytics",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Showcase analytics",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom forms",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "AI Demo Agent",
    rows: [
      [
        "Runs product demos, 24/7",
        "Not included in Free",
        "Not included in Scale",
        "Add-on",
        "Add-on"
      ],
      [
        "Qualifies and routes buyers",
        "Not included in Free",
        "Not included in Scale",
        "Add-on",
        "Add-on"
      ],
      ["Warm handoff to sales", "Not included in Free", "Not included in Scale", "Add-on", "Add-on"]
    ]
  },
  {
    name: "Integrations",
    rows: [
      [
        "HubSpot",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Salesforce",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Google Analytics",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Google Tag Manager",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Slack",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Marketo",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Zapier",
        "Not included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ]
    ]
  },
  {
    name: "Security and support",
    rows: [
      [
        "SOC 2 Type 2",
        "Included in Free",
        "Included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "SSO & SAML",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ],
      [
        "Custom data retention policies",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ],
      [
        "Export data",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ],
      [
        "Priority support",
        "Not included in Free",
        "Not included in Scale",
        "Included in Growth",
        "Included in Enterprise"
      ],
      [
        "Dedicated support",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ],
      [
        "Private Slack channel",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ],
      [
        "Unlimited onboarding and training",
        "Not included in Free",
        "Not included in Scale",
        "Not included in Growth",
        "Included in Enterprise"
      ]
    ]
  }
] as const;

const faqItems = [
  {
    question: "Can I get started for free?",
    answer:
      "Yes, you can start with our forever free plan or try one of our paid plans for 14 days, no credit card required. You can upgrade or downgrade between plans at any point in time on a pro-rated basis, without losing your existing Supademos."
  },
  {
    question: "Do you have a startup plan?",
    answer:
      "Yes, we do have a startup plan for pre-Series A companies who have raised less than $2M in funding and are less than 2 years old. Our startup plans apply to any of our paid plans and can be accessed by contacting us here."
  },
  {
    question: "Do you have non-profit or educational discounts?",
    answer:
      "Yes, we're able to provide discounts on a case by case basis for non-profits and select educational institutions. Please contact us here to request more information or access."
  },
  {
    question: "Is there a limit on the number of demos or views I get on a Supademo?",
    answer:
      "Every Supademo plan (including Free) comes with an unlimited number of external views and viewers on a Supademo. When it comes to creating Supademos, paid plans include unlimited Supademos, Showcases, and screenshots. In contrast, the Free plan has a limit of five Supademos along with unlimited screenshots."
  },
  {
    question: "What happens when I downgrade my account to a free account?",
    answer:
      "Once you downgrade your account, you'll lose access to the features specific to the plan you downgraded from. Your existing demos will still be accessible, but you'll lose access to premium features and the workspace will be restricted from creating more than five demos. If you upgrade at a later date, you'll be able to re-enable these premium features."
  },
  {
    question: "What's the difference between creators, viewers and admins?",
    answer:
      "Supademo allows you to add both paid Creators and free Viewer accounts to your internal workspace. Creators have recording and editing capabilities, Admins also have billing and member-management permissions, and Viewers can analyze, view, and share existing Supademos without create or edit permissions."
  },
  {
    question: "How does billing work for per-seat pricing?",
    answer:
      "Paid plans of Supademo are billed per creator, on a monthly or annual basis. As you add creators to your workspace, your subscription is adjusted on a pro-rated basis. If you remove seats from your plan, you will be credited the difference for use in the next billing period."
  },
  {
    question: "How do free unlimited screenshots work?",
    answer:
      "All of our plans include unlimited access to Supa Screenshots. If you take a screenshot, we'll instantly generate a shareable link, and it will be saved onto your workspace, similar to a Supademo."
  },
  {
    question: "How do you ensure data privacy?",
    answer:
      "Data privacy and security are of critical importance to Supademo. We follow stringent data security protocols for ourselves and our vendors while maintaining compliance with SOC 2 Type II data security standards. User-generated content is owned by the end-user and access can be fully controlled by the creator."
  },
  {
    question: "Will you help us create or optimize our Supademos?",
    answer:
      "For customers on our Scale or Enterprise plans, a dedicated customer success team can provide initial and ongoing demo assistance and audits."
  }
] as const;

const trustedLogos = [
  { name: "Spare", src: "https://supademo.com/logos/spare.svg" },
  { name: "Jotform", src: "https://supademo.com/logos/jotform.svg" },
  { name: "Anvil", src: "https://supademo.com/logos/useanvil.svg" },
  { name: "beehiiv", src: "https://supademo.com/logos/beehiiv.svg" },
  { name: "Ledger", src: "https://supademo.com/logos/ledger-logo.svg" },
  { name: "Visma", src: "https://supademo.com/logos/visma.svg" },
  { name: "lightspeed", src: "https://supademo.com/logos/lightspeed.svg" },
  { name: "eng", src: "https://supademo.com/logos/engdb.svg" },
  { name: "Relevance AI", src: "https://supademo.com/logos/relevanceai.svg" },
  { name: "easy", src: "https://supademo.com/logos/easy.svg" },
  { name: "Alibaba", src: "https://supademo.com/logos/alibaba.svg" },
  { name: "Bullhorn", src: "https://supademo.com/logos/bullhorn.svg" },
  { name: "Typeform", src: "https://supademo.com/logos/typeform.svg" },
  { name: "NetApp", src: "https://supademo.com/logos/netapp.svg" },
  { name: "RB2B", src: "https://supademo.com/logos/rb2b.svg" },
  { name: "Turo", src: "https://supademo.com/logos/turo.svg" },
  { name: "concentrix", src: "https://supademo.com/logos/concentrix.svg" },
  { name: "VRIFY", src: "https://supademo.com/logos/vrify.svg" },
  { name: "POSH", src: "https://supademo.com/logos/poshvip.svg" },
  { name: "SIEMENS", src: "https://supademo.com/logos/simens.svg" }
] as const;

const addOnBenefits = [
  "Runs demos like your best AE, 24/7",
  "Qualifies and routes to the right demos",
  "Warm handoff to sales",
  "Shows your product on demand",
  "Voice-led, in 50+ languages",
  "Learns from every conversation"
] as const;

const pricingTestimonials = [
  {
    logo: "https://supademo.com/logos/vrify.svg",
    logoAlt: "Nova Siegmann's logo",
    quote:
      "VRIFY reduces enablement content production time by 75% while saving $100k+ on staff resourcing with Supademo.",
    name: "Nova Siegmann",
    role: "Sr. Manager, Product Enablement & Training",
    headshot: "https://supademo.com/case-studies/nova-headshot.avif",
    href: "/customers/vrify-case-study"
  },
  {
    logo: "https://supademo.com/logos/bullhorn.svg",
    logoAlt: "Robert Hoffmann's logo",
    quote:
      "Bullhorn creates content 50% faster while increasing viewer engagement by 20% with Supademo.",
    name: "Robert Hoffmann",
    role: "Instructional Designer",
    headshot: "https://supademo.com/headshots/robert-headshot.avif",
    href: "/customers/bullhorn-case-study"
  },
  {
    logo: "https://supademo.com/logos/beehiiv.avif",
    logoAlt: "EJ White's logo",
    quote: "beehiiv converts thousands of signups with 50% better conversion rates with Supademo.",
    name: "EJ White",
    role: "Head of Growth",
    headshot: "https://supademo.com/headshots/ej-headshot.avif",
    href: "/customers/beehiiv-case-study"
  },
  {
    logo: "https://supademo.com/logos/easy.svg",
    logoAlt: "Felix True's logo",
    quote:
      "Easy deploys interactive demos across departments and closes $100k+ in contracts with Supademo.",
    name: "Felix True",
    role: "Head of Presales",
    headshot: "https://supademo.com/headshots/felix-headshot.avif",
    href: "/customers/easy-software-case-study"
  }
] as const;

function PlanCreatorControl({
  plan,
  count,
  onChange
}: {
  plan: Plan;
  count: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="pricing-creator-control" aria-label={`${plan.name} creator seats`}>
      <div className="pricing-creator-stepper">
        <button
          type="button"
          aria-label={`Decrease ${plan.name} creators`}
          onClick={() => onChange(Math.max(1, count - 1))}
          disabled={count <= 1}
        >
          −
        </button>
        <output aria-label={`${count} ${plan.name} creators`}>
          Per {count} Creator{count === 1 ? "" : "s"}
        </output>
        <button
          type="button"
          aria-label={`Increase ${plan.name} creators`}
          onClick={() => onChange(Math.min(10, count + 1))}
          disabled={count >= 10}
        >
          +
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  annual,
  creatorCount,
  onCreatorChange
}: {
  plan: Plan;
  annual: boolean;
  creatorCount: number;
  onCreatorChange: (next: number) => void;
}) {
  return (
    <article className={`pricing-card${plan.accent ? " pricing-card-featured" : ""}`}>
      {plan.badge ? <span className="pricing-card-badge">{plan.badge}</span> : null}
      <div className="pricing-card-heading">
        <span className="pricing-card-plan-label">{plan.name}</span>
        <h2>{plan.name}</h2>
        <p>{plan.description}</p>
      </div>
      <div className="pricing-card-price" aria-live="polite">
        <strong>{annual ? plan.annualPrice : plan.monthlyPrice}</strong>
        {plan.unit ? <span>{plan.unit}</span> : null}
      </div>
      {plan.key === "scale" || plan.key === "growth" ? (
        <PlanCreatorControl plan={plan} count={creatorCount} onChange={onCreatorChange} />
      ) : plan.key === "enterprise" ? (
        <div className="pricing-enterprise-control">Starts at 10 Creators</div>
      ) : (
        <div className="pricing-enterprise-control">Free Forever for 1 Creator</div>
      )}
      <a
        className={`marketing-button${plan.accent ? " pricing-button-accent" : ""}${
          plan.key === "enterprise" ? " pricing-button-enterprise" : ""
        }`}
        href={plan.actionHref}
      >
        {plan.action}
      </a>
      <p className="pricing-card-feature-heading">Available demo types</p>
      <ul className="pricing-feature-list">
        {plan.features.map((feature) => (
          <li key={feature}>
            <span className="pricing-check" aria-hidden="true" />
            {feature}
            {feature === "AI Demo Agent" ? <small>Add on</small> : null}
          </li>
        ))}
      </ul>
      <p className="pricing-card-feature-heading pricing-key-feature-heading">
        {plan.keyFeatureHeading}
      </p>
      <ul className="pricing-key-feature-list">
        {plan.keyFeatures.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="pricing-card-footer">
        {plan.footerLines.map((line) => (
          <p key={line}>
            {line}
            {line.includes("collaborators") ? (
              <span className="pricing-info-mark" aria-label="View-only collaborators information">
                ?
              </span>
            ) : null}
          </p>
        ))}
      </div>
    </article>
  );
}

function PricingAddOn() {
  return (
    <section className="pricing-addon" aria-labelledby="pricing-addon-title">
      <span className="pricing-addon-badge">Usage-based add-on</span>
      <div className="pricing-addon-price">
        <span className="pricing-card-plan-label">AI Demo Agent</span>
        <strong id="pricing-addon-title">$0.50 – 0.80</strong>
        <p>avg cost per qualified product demo</p>
      </div>
      <ul className="pricing-addon-benefits">
        {addOnBenefits.map((benefit, index) => (
          <li key={benefit}>
            <span
              className={`pricing-addon-icon pricing-addon-icon-${index % 3}`}
              aria-hidden="true"
            />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PricingTrust() {
  return (
    <section className="pricing-trust" aria-labelledby="pricing-trust-title">
      <div className="pricing-trust-heading">
        <h2 id="pricing-trust-title">
          Trusted by 200,000+ top operators and 3,000+ paying organizations
        </h2>
        <div className="pricing-awards" aria-label="Supademo awards and ratings">
          <span className="pricing-award">
            Top 100<small>Fastest growing</small>
          </span>
          <span className="pricing-award">
            Top 50<small>Sales products</small>
          </span>
          <span className="pricing-award pricing-award-round">
            Leader<small>Winter 2025</small>
          </span>
          <span className="pricing-award pricing-award-round">
            High performer<small>Winter 2025</small>
          </span>
          <span className="pricing-award pricing-award-round">
            Momentum leader<small>Winter 2025</small>
          </span>
        </div>
      </div>
      <div className="pricing-trust-logo-label">
        Explore <span>Featured⌄</span> companies that trust Supademo
      </div>
      <div className="pricing-trust-logo-panel" aria-label="Companies that trust Supademo">
        {trustedLogos.map((logo) => (
          <div className="pricing-trust-logo" key={logo.name}>
            <img src={logo.src} alt={logo.name} loading="lazy" referrerPolicy="no-referrer" />
            <span>{logo.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingTestimonials() {
  return (
    <section className="pricing-testimonials" aria-labelledby="pricing-testimonials-title">
      <h2 id="pricing-testimonials-title">Trusted by thousands of fast growing companies</h2>
      <div className="pricing-testimonials-grid">
        {pricingTestimonials.map((testimonial) => (
          <a className="pricing-testimonial-card" href={testimonial.href} key={testimonial.name}>
            <img
              className="pricing-testimonial-logo"
              src={testimonial.logo}
              alt={testimonial.logoAlt}
              width="100"
              height="50"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <p>{testimonial.quote}</p>
            <div className="pricing-testimonial-footer">
              <div className="pricing-testimonial-person">
                <img
                  src={testimonial.headshot}
                  alt={`${testimonial.name} headshot`}
                  width="40"
                  height="40"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span>
                  <strong>{testimonial.name}</strong>
                  <small>{testimonial.role}</small>
                </span>
              </div>
              <span className="pricing-testimonial-arrow" aria-hidden="true">
                →
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function MarketingPricing() {
  const [annual, setAnnual] = useState(false);
  const [comparisonPlan, setComparisonPlan] = useState<PlanKey>("starter");
  const [openFaq, setOpenFaq] = useState<string | null>(faqItems[0]?.question ?? null);
  const [openComparisonSections, setOpenComparisonSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(comparisonSections.map((section) => [section.name, true]))
  );
  const [creatorCounts, setCreatorCounts] = useState<Record<PlanKey, number>>({
    starter: 1,
    scale: 1,
    growth: 5,
    enterprise: 10
  });

  function updateCreatorCount(plan: PlanKey, next: number) {
    setCreatorCounts((current) => ({ ...current, [plan]: next }));
  }

  function toggleComparisonSection(section: string) {
    setOpenComparisonSections((current) => ({ ...current, [section]: !current[section] }));
  }

  return (
    <main className="pricing-page" id="main">
      <MarketingHeader active="pricing" variant="sharing" />
      <section className="pricing-hero" aria-labelledby="pricing-title">
        <h1 id="pricing-title">Transparent, flexible pricing</h1>
        <p>
          Great demos start with a plan. Get started with a 14-day free trial on one of our flexible
          plans, <strong>no credit card required.</strong>
        </p>
        <div className="pricing-billing-row">
          <span className={!annual ? "is-active" : undefined}>Billed monthly</span>
          <button
            className={`pricing-toggle${!annual ? " is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={!annual}
            aria-label="Toggle annual billing"
            onClick={() => setAnnual((value) => !value)}
          >
            <span aria-hidden="true" />
          </button>
          <span className={annual ? "is-active" : undefined}>Billed yearly</span>
          <strong>Save up to 33% with annual billing</strong>
        </div>
      </section>

      <section className="pricing-plans" aria-label="Pricing plans">
        {plans.map((plan, index) => (
          <div
            className="pricing-card-shell"
            key={plan.key}
            style={{ "--pricing-card-delay": `${index * 70}ms` } as CSSProperties}
          >
            <PricingCard
              plan={plan}
              annual={annual}
              creatorCount={creatorCounts[plan.key]}
              onCreatorChange={(next) => updateCreatorCount(plan.key, next)}
            />
          </div>
        ))}
      </section>

      <PricingAddOn />
      <a className="pricing-compare-jump" href="#compare">
        Compare plans and features ↓
      </a>
      <PricingTrust />

      <section
        className="pricing-comparison"
        id="compare"
        aria-labelledby="pricing-comparison-title"
      >
        <div className="pricing-section-heading">
          <div>
            <h2 id="pricing-comparison-title">Compare plans and features</h2>
            <div
              className="pricing-comparison-tabs"
              role="tablist"
              aria-label="Compare pricing plans"
            >
              {plans.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  role="tab"
                  aria-selected={comparisonPlan === plan.key}
                  className={comparisonPlan === plan.key ? "is-active" : undefined}
                  onClick={() => setComparisonPlan(plan.key)}
                >
                  {plan.name === "Starter" ? "Free" : plan.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pricing-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {plans.map((plan) => (
                  <th
                    scope="col"
                    key={plan.key}
                    className={comparisonPlan === plan.key ? "is-active" : undefined}
                  >
                    {plan.name === "Starter" ? "Free" : plan.name}
                    <a
                      className="pricing-table-plan-action"
                      href={plan.key === "enterprise" ? "/product-demo" : "/signup"}
                    >
                      {plan.key === "growth"
                        ? "Get Growth"
                        : plan.key === "enterprise"
                          ? "Request a demo"
                          : "Start free trial"}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonSections.map((section) => (
                <Fragment key={section.name}>
                  <tr key={`${section.name}-heading`}>
                    <th className="pricing-table-section-heading" colSpan={5} scope="colgroup">
                      <button type="button" onClick={() => toggleComparisonSection(section.name)}>
                        <span>{section.name}</span>
                        <span>{openComparisonSections[section.name] ? "Hide" : "Show"}⌄</span>
                      </button>
                    </th>
                  </tr>
                  {openComparisonSections[section.name]
                    ? section.rows.map(([feature, ...values]) => (
                        <tr key={`${section.name}-${feature}`}>
                          <th scope="row">{feature}</th>
                          {values.map((value, index) => (
                            <td
                              key={`${section.name}-${feature}-${plans[index]?.key ?? index}`}
                              className={
                                comparisonPlan === plans[index]?.key ? "is-active" : undefined
                              }
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))
                    : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PricingTestimonials />

      <section className="pricing-faq" aria-labelledby="pricing-faq-title">
        <div className="pricing-faq-intro">
          <h2 id="pricing-faq-title">FAQs</h2>
          <p>
            Commonly asked questions about Supademo. Have other questions? Reach out and our team
            will be happy to help.
          </p>
          <img
            src="https://supademo.com/images/faq-section-illustration.avif"
            alt="FAQ illustration"
            width="400"
            height="350"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="pricing-faq-list">
          {faqItems.map((item) => {
            const isOpen = openFaq === item.question;
            const answerId = `pricing-faq-${faqItems.indexOf(item)}`;
            return (
              <div className={`pricing-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenFaq(isOpen ? null : item.question)}
                >
                  <span>{item.question}</span>
                  <span className="pricing-faq-icon" aria-hidden="true" />
                </button>
                <div id={answerId} className="pricing-faq-answer" hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}
