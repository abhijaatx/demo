"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

type ShowcaseCard = {
  title: string;
  brand: string;
  type: string;
  description: string;
  tone: string;
  image?: string;
  logo?: string;
  href?: string;
};
const groups = [
  [
    "Demo Type",
    [
      "HTML Demos",
      "Sandbox Demos",
      "Mobile App Demos",
      "Screenshot Demos",
      "Demo Hubs",
      "Route Hubs",
      "Showcase Collections"
    ]
  ],
  [
    "Use Case",
    ["Product Marketing", "Customer Success", "Sales & Enablement", "Training & Education"]
  ],
  ["Industry", ["Finance & Banking", "Software", "Healthcare", "Government"]]
] as const;

function makeShowcaseCards(titles: string[], type: string): ShowcaseCard[] {
  return titles.map((title, index) => ({
    title,
    brand: "Supademo",
    type,
    description: "Explore an interactive Supademo example.",
    tone: ["blue", "purple", "teal", "orange", "pink", "green"][index % 6],
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg",
    logo: "https://supademo.com/images/supademo_logo.svg",
    href: "/showcase"
  }));
}

const sections: Array<{
  title: string;
  description: string;
  filter: string;
  learn: string;
  more?: boolean;
  cards: ShowcaseCard[];
}> = [
  {
    title: "HTML Interactive Demos",
    description:
      "Capture pixel-perfect replicas of web-based products and features with HTML capture.",
    filter: "HTML Demos",
    learn: "/features/guided-html-demo",
    cards: [
      {
        title: "Interactive demo of Fin AI",
        brand: "Intercom",
        type: "HTML Demos",
        description: "Explore a self-serve AI support workflow.",
        tone: "blue",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg",
        logo: "https://supademo.com/logos/intercom.svg",
        href: "/product-demo/fin-ai"
      },
      {
        title: "Demo of Robinhood Legend",
        brand: "Robinhood",
        type: "HTML Demos",
        description: "Walk through a modern trading experience.",
        tone: "dark",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/aVqOhmh3_IuAbOr5xbD3L.jpg",
        logo: "https://supademo.com/logos/robinhood.svg",
        href: "/product-demo/robinhood"
      },
      {
        title: "Custom demo using URL parameters",
        brand: "Supademo",
        type: "HTML Demos",
        description: "Personalize the viewer experience with variables.",
        tone: "pink",
        image:
          "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/screenshots/_j3D8XqsrOrl8rDn8fq3D.jpg",
        logo: "https://supademo.com/images/supademo_logo.svg",
        href: "/product-demo/supademo"
      },
      {
        title: "Setting up autopay on Mercury",
        brand: "Mercury",
        type: "HTML Demos",
        description: "Show customers the fastest path to value.",
        tone: "teal",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg",
        logo: "https://supademo.com/logos/mercury.svg",
        href: "/product-demo/mercury"
      },
      {
        title: "Wise product overview",
        brand: "Wise",
        type: "HTML Demos",
        description: "Explain a modern financial workflow.",
        tone: "green",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/2jAdK1WdzdugSw97h-AFM.jpg",
        logo: "https://supademo.com/logos/wise.svg",
        href: "/product-demo/wise"
      },
      {
        title: "Adding products on Shopify",
        brand: "Shopify",
        type: "HTML Demos",
        description: "Show the fastest path from catalog to checkout.",
        tone: "purple",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/ZMshzrt2rbFa0JBgMXOrz.jpg",
        logo: "https://supademo.com/logos/shopify.svg",
        href: "/product-demo/shopify"
      },
      ...makeShowcaseCards(
        [
          "Upload and share files in Dropbox",
          "Product tour: collaboration on Slack",
          "Build a CS Dashboard in Airtable",
          "Rabobank payment requests",
          "Requesting Zelle Payment on Wells Fargo",
          "Edit mailing address in Canada Revenue Agency profile settings",
          "Check application status on USCIS",
          "Manage Personal Profile and Services in Mijn Rijswijk",
          "Scheduling Sales Calls in Calendly",
          "Documenting patient visits in clinical records",
          "똑닥 joining a doctor's online waiting list",
          "TriageFlow patient triage assessment with priority escalation",
          "Supademo analytics product tour"
        ],
        "HTML Demos"
      )
    ]
  },
  {
    title: "Sandbox Demo Environments",
    description:
      "Let qualified viewers freely click around your product via realistic, sandbox environments.",
    filter: "Sandbox Demos",
    learn: "/features/sandbox-demos",
    cards: [
      {
        title: "Ahrefs Sandbox Demo",
        brand: "Ahrefs",
        type: "Sandbox Demos",
        description: "Explore search performance with guided context.",
        tone: "purple",
        image: "https://media.supademo.com/clugzi2gx28r413it967dc5rm/RKP5Orw9JkLOX2B3YHFzt.jpg",
        logo: "https://supademo.com/logos/ahrefs.svg",
        href: "/product-demo/ahrefs"
      },
      {
        title: "Typeform Sandbox Demo",
        brand: "Typeform",
        type: "Sandbox Demos",
        description: "Experience a form workflow from start to finish.",
        tone: "orange",
        image: "https://media.supademo.com/clugzi2gx28r413it967dc5rm/aqfEvKXFdSiZXlebKQstu.jpg",
        logo: "https://supademo.com/logos/typeform.svg",
        href: "/product-demo/typeform"
      },
      {
        title: "Mixpanel Sandbox Demo",
        brand: "Mixpanel",
        type: "Sandbox Demos",
        description: "Explore product analytics in a safe environment.",
        tone: "green",
        image: "https://media.supademo.com/clugzi2gx28r413it967dc5rm/1ifNIDopyrZNe7_EiB4fB.jpg",
        logo: "https://supademo.com/logos/mixpanel.svg",
        href: "/product-demo/mixpanel-sandbox"
      }
    ]
  },
  {
    title: "Interactive Mobile App Demos",
    description:
      "Record your mobile app or convert demo videos from your phone into interactive demos.",
    filter: "Mobile App Demos",
    learn: "/tools/mobile-app-demos",
    cards: [
      {
        title: "How to book a trip on Kindred",
        brand: "Kindred",
        type: "Mobile App Demos",
        description: "A polished mobile onboarding walkthrough.",
        tone: "pink",
        image: "https://supademo.com/showcase/kindred-header.avif",
        logo: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/screenshots/z660Qqf-it13QYG5Iy3id.png",
        href: "https://app.supademo.com/demo/cmniyc7gu001ux50ia56fdqw2?preview=true"
      },
      {
        title: "Booking a car rental on Turo's mobile app",
        brand: "Turo",
        type: "Mobile App Demos",
        description: "Help users discover the right mobile flow.",
        tone: "orange",
        image: "https://supademo.com/showcase/turo-header.avif",
        logo: "https://supademo.com/logos/turo.avif",
        href: "/showcase/turo"
      },
      {
        title: "Adding a stop to your route on Uber's mobile app",
        brand: "Uber",
        type: "Mobile App Demos",
        description: "Show a useful mobile feature in context.",
        tone: "dark",
        image: "https://supademo.com/showcase/uber-header.avif",
        logo: "https://supademo.com/logos/uber.avif",
        href: "/showcase/uber"
      },
      {
        title: "Set your home or work address on Google Maps",
        brand: "Google Maps",
        type: "Mobile App Demos",
        description: "Help users complete a common mobile task.",
        tone: "blue",
        image: "https://supademo.com/showcase/maps-header.avif",
        logo: "https://supademo.com/logos/google.avif",
        href: "/showcase/google-maps"
      },
      {
        title: "Change the Content Language on Mobile",
        brand: "Mobile",
        type: "Mobile App Demos",
        description: "Make localization easy to discover.",
        tone: "purple",
        image: "https://app.supademo.com/api/demo/cmh3b9qad01ryyw0iflqtpjk4/image",
        logo: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/screenshots/XK75NGhA15WrrqeCrFPsz.png",
        href: "https://app.supademo.com/demo/cmh3b9qad01ryyw0iflqtpjk4?preview=true"
      },
      {
        title: "How to find archived chats on ChatGPT",
        brand: "ChatGPT",
        type: "Mobile App Demos",
        description: "Guide users through a useful mobile setting.",
        tone: "dark",
        image: "https://app.supademo.com/api/demo/cmggyvqgc012uwl0iuhntjldt/image",
        logo: "https://supademo.com/logos/openai.svg",
        href: "https://app.supademo.com/demo/cmggyvqgc012uwl0iuhntjldt?preview=true"
      },
      ...makeShowcaseCards(["Delete a Course in Duolingo"], "Mobile App Demos")
    ]
  },
  {
    title: "Tours, Collections and Multi-Demo Showcase",
    description:
      "Showcases allow you to share multiple, related Supademos through a single, shareable page.",
    filter: "Showcase Collections",
    learn: "/features/showcase-collection",
    cards: [
      {
        title: "Supademo interactive onboarding",
        brand: "Supademo",
        type: "Showcase Collections",
        description: "A collection of onboarding lessons.",
        tone: "blue",
        image: "https://supademo.com/blog/supademo-onboarding-min.avif",
        logo: "https://supademo.com/images/supademo_logo.svg",
        href: "https://app.supademo.com/showcase/clkwvaf1k2j3szg8xvfy0vr3e?preview=true"
      },
      {
        title: "Strava feature tour and showcase",
        brand: "Strava",
        type: "Showcase Collections",
        description: "Bundle a complete feature tour.",
        tone: "orange",
        image: "https://supademo.com/blog/strava-sales-min.avif",
        logo: "https://supademo.com/logos/strava.avif",
        href: "https://app.supademo.com/showcase/clkwvaf1k2j3szg8xvfy0vr3e?preview=true"
      },
      {
        title: "Canva step-by-step tutorials",
        brand: "Canva",
        type: "Showcase Collections",
        description: "Share a library of guided tutorials.",
        tone: "purple",
        image: "https://supademo.com/blog/canva-showcase-min.avif",
        logo: "https://supademo.com/logos/canva.svg",
        href: "https://app.supademo.com/showcase/cmqfhstsf02xg0b0jr1aizqch?preview=true"
      }
    ]
  },
  {
    title: "Route Hubs",
    description:
      "Route viewers to a personalized demo based on their interests and needs with interactive Route Hubs.",
    filter: "Route Hubs",
    learn: "/features/route-hub",
    cards: [
      {
        title: "Supademo Route Hub",
        brand: "Supademo",
        type: "Route Hubs",
        description: "Personalize the path every viewer takes.",
        tone: "purple",
        image: "https://supademo.com/showcase/route-hub-supademo.avif",
        logo: "https://supademo.com/images/supademo_logo.svg",
        href: "https://app.supademo.com/route/cmo0bprcj00byxl0jliobyd3k?preview=published"
      },
      {
        title: "Airtable Route Hub",
        brand: "Airtable",
        type: "Route Hubs",
        description: "Route prospects to the right workflow.",
        tone: "blue",
        image: "https://supademo.com/showcase/route-hub-airtable.avif",
        logo: "https://supademo.com/logos/airtable.svg",
        href: "https://app.supademo.com/route/cmo0bprcj00byxl0jliobyd3k?preview=published"
      },
      {
        title: "Canva Route Hub",
        brand: "Canva",
        type: "Route Hubs",
        description: "Guide every audience to the right proof.",
        tone: "pink",
        image: "https://supademo.com/showcase/route-hub-canva.avif",
        logo: "https://supademo.com/logos/canva.svg",
        href: "https://app.supademo.com/route/cmo0cn6rh00r0040j8yazunda?preview=published"
      }
    ]
  },
  {
    title: "Demo Hubs",
    description:
      "Replace disruptive product tours with engaging Demo Hubs. Inside your app, on your website, and in your docs.",
    filter: "Demo Hubs",
    learn: "/features/demo-hub",
    more: false,
    cards: [
      {
        title: "Drive adoption by highlighting new features",
        brand: "Strava",
        type: "Demo Hubs",
        description: "Help users discover what is new.",
        tone: "orange",
        logo: "https://supademo.com/logos/strava.avif",
        href: "/product-demo/strava"
      },
      {
        title: "Consolidate common support tickets into self-paced tutorials",
        brand: "Freshworks",
        type: "Demo Hubs",
        description: "Give customers a faster path to answers.",
        tone: "teal",
        logo: "https://supademo.com/logos/freshworks.avif",
        href: "/product-demo/freshworks"
      },
      {
        title: "Build an engaging learning academy for first-time users",
        brand: "Typeform",
        type: "Demo Hubs",
        description: "Turn onboarding into a guided experience.",
        tone: "dark",
        logo: "https://supademo.com/logos/typeform-black.avif",
        href: "/product-demo/typeform"
      },
      {
        title: "Embed self-serve interactive guides inside of your app",
        brand: "Supademo",
        type: "Demo Hubs",
        description: "Make in-app education discoverable.",
        tone: "blue",
        logo: "https://supademo.com/supademo_logo.svg",
        href: "/features/demo-hub"
      },
      {
        title: "Self-paced in-app guide for common product questions",
        brand: "HubSpot",
        type: "Demo Hubs",
        description: "Answer product questions in context.",
        tone: "orange",
        logo: "https://supademo.com/logos/hubspot.svg",
        href: "/features/demo-hub"
      },
      {
        title: "Reducing redundant support with interactive in-context guides",
        brand: "Help Scout",
        type: "Demo Hubs",
        description: "Give customers answers at the moment of need.",
        tone: "purple",
        logo: "https://supademo.com/logos/helpscout.svg",
        href: "/features/demo-hub"
      }
    ]
  },
  {
    title: "Customer Success",
    description:
      "Help your customers succeed with interactive guides and tutorials that drive product adoption and reduce support tickets.",
    filter: "Customer Success",
    learn: "/use-cases/customer-success",
    cards: [
      {
        title: "Setting up autopay on Mercury",
        brand: "Mercury",
        type: "Customer Success",
        description: "Accelerate time to value.",
        tone: "blue",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg",
        logo: "https://supademo.com/logos/mercury.svg",
        href: "/product-demo/mercury"
      },
      {
        title: "Adding products on Shopify",
        brand: "Shopify",
        type: "Customer Success",
        description: "Deflect repetitive support requests.",
        tone: "teal",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/ZMshzrt2rbFa0JBgMXOrz.jpg",
        logo: "https://supademo.com/logos/shopify.svg",
        href: "/product-demo/shopify"
      },
      {
        title: "Build a CS Dashboard in Airtable",
        brand: "Airtable",
        type: "Customer Success",
        description: "Keep customers discovering more value.",
        tone: "purple",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/ERrqVcv8f219y1RcUuav0.jpg",
        logo: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/screenshots/gx5Y1xf87-I5ZTXD50TDP.png",
        href: "https://app.supademo.com/demo/cmgqgdiro0gl0letgblznozee?preview=true"
      },
      {
        title: "Rabobank payment requests",
        brand: "Rabobank",
        type: "Customer Success",
        description: "Make financial tasks easier to complete.",
        tone: "pink",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/aapwkh7NR5PEyV_MkmaYK.jpg",
        logo: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/screenshots/hIQGSCiU6B3mihubjAMQ2.png",
        href: "/product-demo/rabobank"
      },
      {
        title: "Requesting Zelle Payment on Wells Fargo",
        brand: "Wells Fargo",
        type: "Customer Success",
        description: "Guide customers through a payment workflow.",
        tone: "orange",
        image: "https://app.supademo.com/api/demo/cmi67jgih02xm0o0ik2k3cr96/image",
        logo: "https://supademo.com/logos/wells-fargo.svg",
        href: "https://app.supademo.com/demo/cmi67jgih02xm0o0ik2k3cr96?preview=true"
      },
      {
        title: "Edit mailing address in Canada Revenue Agency profile settings",
        brand: "Canada Revenue Agency",
        type: "Customer Success",
        description: "Help users update account details.",
        tone: "green",
        image: "https://app.supademo.com/api/demo/cmi65bwck3ljab7b4lt1qzouh/image",
        logo: "https://supademo.com/logos/canada-revenue-agency.png",
        href: "https://app.supademo.com/demo/cmi65bwck3ljab7b4lt1qzouh?preview=true"
      },
      ...makeShowcaseCards(
        [
          "Check application status on USCIS",
          "Manage Personal Profile and Services in Mijn Rijswijk",
          "Documenting patient visits in clinical records",
          "Change the Content Language on Mobile",
          "How to find archived chats on ChatGPT",
          "How to use AI to clone your voice on ElevenLabs",
          "How to import contacts into Hubspot",
          "How to change sender email for Apollo sequence",
          "Create repeatable routes for personal challenges with Routes",
          "Simplify keyword research with SEMRush",
          "Interactive feature recap for Sara",
          "How to export Figma frames to PDF",
          "How to import leads and contacts on Close CRM"
        ],
        "Customer Success"
      )
    ]
  },
  {
    title: "Product Marketing",
    description:
      "Showcase your product features and drive engagement with compelling interactive demos for your marketing campaigns.",
    filter: "Product Marketing",
    learn: "/use-cases/product-marketing",
    cards: [
      {
        title: "Interactive demo of Fin AI",
        brand: "Intercom",
        type: "Product Marketing",
        description: "Make product updates easy to explore.",
        tone: "pink",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg",
        logo: "https://supademo.com/logos/intercom.svg",
        href: "/product-demo/fin-ai"
      },
      {
        title: "Demo of Robhinhood Legend",
        brand: "Robinhood",
        type: "Product Marketing",
        description: "Let buyers learn by doing.",
        tone: "orange",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/aVqOhmh3_IuAbOr5xbD3L.jpg",
        logo: "https://supademo.com/logos/robinhood.svg",
        href: "/product-demo/robinhood"
      },
      {
        title: "Wise product overview",
        brand: "Wise",
        type: "Product Marketing",
        description: "Tailor proof without duplicate work.",
        tone: "blue",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/2jAdK1WdzdugSw97h-AFM.jpg",
        logo: "https://supademo.com/logos/wise.svg",
        href: "/product-demo/wise"
      },
      {
        title: "Upload and share files in Dropbox",
        brand: "Dropbox",
        type: "Product Marketing",
        description: "Show a simple, repeatable workflow.",
        tone: "teal",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/WQMsP21kN_58TyF2DC44x.jpg",
        logo: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/screenshots/5qkNz7ttWQVdJZFBuqJiF.png",
        href: "/product-demo/dropbox"
      },
      {
        title: "Product tour: collaboration on Slack",
        brand: "Slack",
        type: "Product Marketing",
        description: "Bring a collaborative feature to life.",
        tone: "purple",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/siu8kkU1KvZQdv2KkSlwO.jpg",
        logo: "https://supademo.com/logos/slack.svg",
        href: "https://app.supademo.com/demo/cmgjbkq331cc6krn9p5n9pmgs?preview=true"
      },
      {
        title: "Build a CS Dashboard in Airtable",
        brand: "Airtable",
        type: "Product Marketing",
        description: "Tailor proof without duplicate work.",
        tone: "green",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/ERrqVcv8f219y1RcUuav0.jpg",
        logo: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/screenshots/gx5Y1xf87-I5ZTXD50TDP.png",
        href: "https://app.supademo.com/demo/cmgqgdiro0gl0letgblznozee?preview=true"
      },
      ...makeShowcaseCards(
        [
          "똑닥 joining a doctor's online waiting list",
          "TriageFlow patient triage assessment with priority escalation",
          "Supademo analytics product tour",
          "Ahrefs Sandbox Demo",
          "Typeform Sandbox Demo",
          "How to book a trip on Kindred",
          "Booking a car rental on Turo's mobile app",
          "Delete a Course in Duolingo",
          "Embed a Spotify Podcast on Notion",
          "Create repeatable routes for personal challenges with Routes",
          "Simplify keyword research with SEMRush",
          "Introducing Notion Calendar",
          "How to export Figma frames to PDF",
          "How to import leads and contacts on Close CRM"
        ],
        "Product Marketing"
      )
    ]
  },
  {
    title: "Sales and Enablement",
    description:
      "Empower your sales team with interactive demos that help close deals faster and demonstrate value effectively.",
    filter: "Sales & Enablement",
    learn: "/use-cases/sales-enablement",
    cards: [
      {
        title: "Interactive demo of Fin AI",
        brand: "Intercom",
        type: "Sales & Enablement",
        description: "Keep the conversation moving after the call.",
        tone: "dark",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg",
        logo: "https://supademo.com/logos/intercom.svg",
        href: "/product-demo/fin-ai"
      },
      {
        title: "Custom demo using URL parameters",
        brand: "Supademo",
        type: "Sales & Enablement",
        description: "Give every seller the right story.",
        tone: "purple",
        image:
          "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/screenshots/_j3D8XqsrOrl8rDn8fq3D.jpg",
        logo: "https://supademo.com/images/supademo_logo.svg",
        href: "/product-demo/supademo"
      },
      {
        title: "Product tour: collaboration on Slack",
        brand: "Slack",
        type: "Sales & Enablement",
        description: "Turn engagement into action.",
        tone: "green",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/siu8kkU1KvZQdv2KkSlwO.jpg",
        logo: "https://supademo.com/logos/slack.svg",
        href: "https://app.supademo.com/demo/cmgjbkq331cc6krn9p5n9pmgs?preview=true"
      },
      {
        title: "Scheduling Sales Calls in Calendly",
        brand: "Calendly",
        type: "Sales & Enablement",
        description: "Turn engagement into action.",
        tone: "blue",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/svTsjgItiWAlCkCpS9_Fw.jpg",
        logo: "https://supademo.com/integrations/calendly.svg",
        href: "/product-demo/calendly"
      },
      {
        title: "Supademo analytics product tour",
        brand: "Supademo Analytics",
        type: "Sales & Enablement",
        description: "Give every seller the right story.",
        tone: "pink",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/EHUTeSxXvW_InMAq5JgVl.jpg",
        logo: "https://supademo.com/images/supademo_logo.svg",
        href: "/product-demo/supademo-analytics"
      },
      {
        title: "Ahrefs Sandbox Demo",
        brand: "Ahrefs",
        type: "Sales & Enablement",
        description: "Explore search performance with guided context.",
        tone: "orange",
        image: "https://media.supademo.com/clugzi2gx28r413it967dc5rm/RKP5Orw9JkLOX2B3YHFzt.jpg",
        logo: "https://supademo.com/logos/ahrefs.svg",
        href: "/product-demo/ahrefs"
      },
      ...makeShowcaseCards(
        [
          "Typeform Sandbox Demo",
          "Booking a car rental on Turo's mobile app",
          "Interactive feature recap for Sara",
          "How to export Figma frames to PDF",
          "How to import leads and contacts on Close CRM"
        ],
        "Sales & Enablement"
      )
    ]
  },
  {
    title: "Training and Education",
    description:
      "Create engaging learning experiences with step-by-step interactive tutorials that make training effortless.",
    filter: "Training & Education",
    learn: "/use-cases/education-training",
    cards: [
      {
        title: "Setting up autopay on Mercury",
        brand: "Mercury",
        type: "Training & Education",
        description: "Organize lessons around outcomes.",
        tone: "blue",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg",
        logo: "https://supademo.com/logos/mercury.svg",
        href: "/product-demo/mercury"
      },
      {
        title: "Adding products on Shopify",
        brand: "Shopify",
        type: "Training & Education",
        description: "Make every process easy to follow.",
        tone: "teal",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/ZMshzrt2rbFa0JBgMXOrz.jpg",
        logo: "https://supademo.com/logos/shopify.svg",
        href: "/product-demo/shopify"
      },
      {
        title: "Upload and share files in Dropbox",
        brand: "Dropbox",
        type: "Training & Education",
        description: "Let learners practice at their pace.",
        tone: "pink",
        image: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/WQMsP21kN_58TyF2DC44x.jpg",
        logo: "https://media.supademo.com/clyszkgee00ww8ku0ja57y4wk/screenshots/5qkNz7ttWQVdJZFBuqJiF.png",
        href: "/product-demo/dropbox"
      },
      {
        title: "Rabobank payment requests",
        brand: "Rabobank",
        type: "Training & Education",
        description: "Make every process easy to follow.",
        tone: "purple",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/aapwkh7NR5PEyV_MkmaYK.jpg",
        logo: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/screenshots/hIQGSCiU6B3mihubjAMQ2.png",
        href: "/product-demo/rabobank"
      },
      {
        title: "Requesting Zelle Payment on Wells Fargo",
        brand: "Wells Fargo",
        type: "Training & Education",
        description: "Turn complex workflows into clear lessons.",
        tone: "orange",
        image: "https://app.supademo.com/api/demo/cmi67jgih02xm0o0ik2k3cr96/image",
        logo: "https://supademo.com/logos/wells-fargo.svg",
        href: "https://app.supademo.com/demo/cmi67jgih02xm0o0ik2k3cr96?preview=true"
      },
      {
        title: "Edit mailing address in Canada Revenue Agency profile settings",
        brand: "Canada Revenue Agency",
        type: "Training & Education",
        description: "Let learners practice at their pace.",
        tone: "green",
        image: "https://app.supademo.com/api/demo/cmi65bwck3ljab7b4lt1qzouh/image",
        logo: "https://supademo.com/logos/canada-revenue-agency.png",
        href: "https://app.supademo.com/demo/cmi65bwck3ljab7b4lt1qzouh?preview=true"
      },
      ...makeShowcaseCards(
        [
          "Check application status on USCIS",
          "Manage Personal Profile and Services in Mijn Rijswijk",
          "Documenting patient visits in clinical records",
          "똑닥 joining a doctor's online waiting list",
          "TriageFlow patient triage assessment with priority escalation",
          "How to book a trip on Kindred",
          "Adding a stop to your route on Uber's mobile app",
          "Set your home or work address on Google Maps",
          "Change the Content Language on Mobile",
          "How to find archived chats on ChatGPT",
          "Delete a Course in Duolingo",
          "How to use AI to clone your voice on ElevenLabs",
          "How to import contacts into Hubspot",
          "How to change sender email for Apollo sequence",
          "Embed a Spotify Podcast on Notion",
          "How to view your top story on Reddit",
          "How to remove duplicates in Microsoft Excel",
          "How to view past Product Hunt Launches",
          "How to delete an existing channel on Slack"
        ],
        "Training & Education"
      )
    ]
  },
  {
    title: "Finance & Banking",
    description:
      "Drive financial compliance and customer clarity with interactive demos for fintech, banking, and financial services.",
    filter: "Finance & Banking",
    learn: "/industries/finance-banking",
    more: false,
    cards: [
      {
        title: "Demo of Robhinhood Legend",
        brand: "Robinhood",
        type: "Finance & Banking",
        description: "Explain complex flows clearly.",
        tone: "blue",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/aVqOhmh3_IuAbOr5xbD3L.jpg",
        logo: "https://supademo.com/logos/robinhood.svg",
        href: "/product-demo/robinhood"
      },
      {
        title: "Setting up autopay on Mercury",
        brand: "Mercury",
        type: "Finance & Banking",
        description: "Keep every process consistent.",
        tone: "dark",
        image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg",
        logo: "https://supademo.com/logos/mercury.svg",
        href: "/product-demo/mercury"
      },
      {
        title: "Wise product overview",
        brand: "Wise",
        type: "Finance & Banking",
        description: "Build trust with interactive proof.",
        tone: "purple",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/2jAdK1WdzdugSw97h-AFM.jpg",
        logo: "https://supademo.com/logos/wise.svg",
        href: "/product-demo/wise"
      },
      {
        title: "Rabobank payment requests",
        brand: "Rabobank",
        type: "Finance & Banking",
        description: "Explain complex flows clearly.",
        tone: "pink",
        image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/aapwkh7NR5PEyV_MkmaYK.jpg",
        logo: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/screenshots/hIQGSCiU6B3mihubjAMQ2.png",
        href: "/product-demo/rabobank"
      },
      {
        title: "Requesting Zelle Payment on Wells Fargo",
        brand: "Wells Fargo",
        type: "Finance & Banking",
        description: "Guide customers through financial products.",
        tone: "orange",
        image: "https://app.supademo.com/api/demo/cmi67jgih02xm0o0ik2k3cr96/image",
        logo: "https://supademo.com/logos/wells-fargo.svg",
        href: "https://app.supademo.com/demo/cmi67jgih02xm0o0ik2k3cr96?preview=true"
      },
      {
        title: "Interactive feature recap for Sara",
        brand: "Stripe",
        type: "Finance & Banking",
        description: "Showcase secure product experiences.",
        tone: "green",
        image: "https://supademo.com/showcase/s5VHZjXK0kSV5mt-jC.avif",
        logo: "https://supademo.com/logos/stripe.svg",
        href: "/showcase/stripe"
      }
    ]
  },
  {
    title: "Government",
    description:
      "Simplify citizen services and improve digital accessibility with interactive guides for government agencies and public services.",
    filter: "Government",
    learn: "/industries/government",
    cards: [
      {
        title: "Edit mailing address in Canada Revenue Agency profile settings",
        brand: "Canada Revenue Agency",
        type: "Government",
        description: "Make public workflows easier to navigate.",
        tone: "teal",
        image: "https://app.supademo.com/api/demo/cmi65bwck3ljab7b4lt1qzouh/image",
        logo: "https://supademo.com/logos/canada-revenue-agency.png",
        href: "https://app.supademo.com/demo/cmi65bwck3ljab7b4lt1qzouh?preview=true"
      },
      {
        title: "Check application status on USCIS",
        brand: "USCIS",
        type: "Government",
        description: "Reduce time spent searching for answers.",
        tone: "blue",
        image: "https://app.supademo.com/api/demo/cmi68ujti3t5xb7b4vquxbjqn/image",
        logo: "https://supademo.com/logos/uscis.png",
        href: "https://app.supademo.com/demo/cmi68ujti3t5xb7b4vquxbjqn?preview=true&lang=Spanish"
      },
      {
        title: "Manage Personal Profile and Services in Mijn Rijswijk",
        brand: "Mijn Rijswijk",
        type: "Government",
        description: "Help every visitor complete the task.",
        tone: "orange",
        image: "https://app.supademo.com/api/demo/cmiej2jelaxm5b7b45j6nqyt0/image",
        logo: "https://supademo.com/logos/mijn-rijswijk.png",
        href: "https://app.supademo.com/demo/cmiej2jelaxm5b7b45j6nqyt0"
      }
    ]
  },
  {
    title: "Healthcare",
    description:
      "Enhance patient education and streamline clinical workflows with interactive demos for healthcare providers and medical software.",
    filter: "Healthcare",
    learn: "/industries/healthcare",
    cards: [
      {
        title: "Documenting patient visits in clinical records",
        brand: "Mockcare",
        type: "Healthcare",
        description: "Make care instructions clearer.",
        tone: "green",
        image: "https://app.supademo.com/api/demo/cmi7qva895om6b7b4eq9j5mz3/image",
        logo: "https://supademo.com/logos/mockcare.png",
        href: "https://app.supademo.com/demo/cmi7qva895om6b7b4eq9j5mz3"
      },
      {
        title: "똑닥 joining a doctor's online waiting list",
        brand: "똑닥",
        type: "Healthcare",
        description: "Build confidence before go-live.",
        tone: "blue",
        image: "https://app.supademo.com/api/demo/cmidxriz401lg060iplrrwvad/image",
        logo: "https://supademo.com/logos/ddocdoc.png",
        href: "https://app.supademo.com/demo/cmidxriz401lg060iplrrwvad"
      },
      {
        title: "TriageFlow patient triage assessment with priority escalation",
        brand: "TriageFlow",
        type: "Healthcare",
        description: "Standardize everyday processes.",
        tone: "purple",
        image: "https://app.supademo.com/api/demo/cmiecrf04aos6b7b4cocmj26s/image",
        logo: "https://supademo.com/logos/triageflow.png",
        href: "https://app.supademo.com/demo/cmiecrf04aos6b7b4cocmj26s"
      }
    ]
  }
];

function ShowcaseCardView({ card }: { card: ShowcaseCard }) {
  const href = card.href ?? `/product-demo/${card.brand.toLowerCase().replaceAll(" ", "-")}`;
  if (card.type === "Demo Hubs") {
    return (
      <a className="showcase-card showcase-card-hub" href={href}>
        <div className="showcase-hub-logo">
          {card.logo ? <img src={card.logo} alt="" loading="lazy" /> : <span>{card.brand}</span>}
        </div>
        <strong>{card.title}</strong>
        <span className="showcase-hub-arrow" aria-hidden="true">
          →
        </span>
      </a>
    );
  }
  const isTall =
    card.type === "Mobile App Demos" ||
    /Edit mailing address|Requesting Zelle|Documenting patient visits|TriageFlow/.test(card.title);
  return (
    <a className={`showcase-card${isTall ? " showcase-card-tall" : ""}`} href={href}>
      <div className={`showcase-card-art showcase-card-art-${card.tone}`}>
        {card.image ? <img src={card.image} alt={card.title} loading="lazy" /> : null}
        <span>{card.brand}</span>
        {!card.image ? (
          <>
            <i />
            <i />
            <i />
          </>
        ) : null}
      </div>
      <div className="showcase-card-copy">
        {card.logo ? (
          <img className="showcase-card-logo" src={card.logo} alt="" loading="lazy" />
        ) : null}
        <strong>{card.title}</strong>
        <p>{card.description}</p>
        <span>View demo →</span>
      </div>
    </a>
  );
}

export function MarketingShowcase() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Demo Type": true,
    "Use Case": true,
    Industry: true
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const visibleSections = useMemo(
    () => sections.filter((section) => selected.length === 0 || selected.includes(section.filter)),
    [selected]
  );

  function toggleFilter(value: string) {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  return (
    <main className="showcase-page" id="main">
      <MarketingHeader />
      <section className="showcase-hero" aria-labelledby="showcase-title">
        <h1 id="showcase-title">Explore the interactive demo showcase</h1>
        <p>
          Get inspired by exploring interactive demo examples by demo type, industry, or use case.
        </p>
      </section>
      <div className="showcase-layout">
        <aside className="showcase-filters" aria-label="Filter by">
          <h2>Filter by</h2>
          {groups.map(([name, values]) => (
            <div className="showcase-filter-group" key={name}>
              <button
                type="button"
                aria-expanded={openGroups[name]}
                onClick={() => setOpenGroups((current) => ({ ...current, [name]: !current[name] }))}
              >
                {name}
                <span aria-hidden="true">⌃</span>
              </button>
              {openGroups[name] ? (
                <fieldset>
                  <legend className="sr-only">{name}</legend>
                  {values.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={selected.includes(value)}
                        onChange={() => toggleFilter(value)}
                      />
                      {value}
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </div>
          ))}
        </aside>
        <div className="showcase-sections">
          {visibleSections.map((section) => {
            const initialCount = section.cards.length >= 6 ? 6 : 3;
            const cards = expanded[section.title]
              ? section.cards
              : section.cards.slice(0, initialCount);
            return (
              <section
                className="showcase-section"
                data-showcase-section={section.title}
                key={section.title}
              >
                <div className="showcase-section-heading">
                  <div>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                  <a href={section.learn}>Learn more →</a>
                </div>
                <div className="showcase-grid">
                  {cards.map((card) => (
                    <ShowcaseCardView card={card} key={card.title} />
                  ))}
                </div>
                {section.more !== false && section.cards.length > 3 ? (
                  <button
                    className="showcase-more"
                    type="button"
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [section.title]: !current[section.title]
                      }))
                    }
                  >
                    {expanded[section.title] ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </section>
            );
          })}
          {visibleSections.length === 0 ? (
            <p className="showcase-empty" role="status">
              No showcases match these filters.
            </p>
          ) : null}
        </div>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
