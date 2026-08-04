"use client";

import { useMemo, useState } from "react";
import { MarketingHeader } from "./marketing-chrome";
import { MarketingReferenceFooter } from "./marketing-download";

export type MarketingBlogArticle = {
  href: string;
  image: string;
  alt: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
};

const sanity = "https://cdn.sanity.io/images/eyuvl764/production/";
const josephAvatar = `${sanity}c7dc0cacf1f9d8365fde7ef6921cbaa805952878-769x1024.jpg?w=96&q=75`;
const narayaniAvatar = "https://supademo.com/images/team/narayani.avif";

const productUpdateArchive = [
  "New in June 2026: Voiceovers 2.0, Advanced Search, UI Redesign & Seismic Integration",
  "New in May 2026: Free 4K Screen Recording, Showcases 2.0, Pronounciation Dictionary",
  "New in April 2026: Account Analytics, Offline Demos, MCP, Route Hub & AI Demo Agents",
  "Announcing Supademo's MCP Server",
  "Introducing RouteHub: Personalized Demo Journeys From One Link",
  "New in March 2026: Video Hotspots, Smarter AI Creation, Preview of New Features",
  "New in February ’26: AI Demo Audits, Video Edit Updates, Bulk Crop & More",
  "New in January ’26: Demo Tagging, Hotspots 2.0, and AI Data Edits",
  "New in December ’25: Screen Recorder, Zoom & Pan on HTML & Typewriter Effect",
  "New in November ’25: Smarter Recording, Editing, Sharing, Analytics & More",
  "New in October '25: Demo Hubs, External Comments, New Translations Hub & More",
  "New on Supademo: Demo Hubs that Scale In-App Guidance",
  "New in September '25: New Chapter Designs, AI Voice Cloning, Smarter forms and more",
  "AI Voice Cloning, Domain-based Access Controls and More!",
  "New in August '25: Autoplay Per Slide, Custom Watermarks, Showcase Folders",
  "Custom Autoplay Per Slide, Tag Manager and Upload Custom Voiceover Files!",
  "New in July '25: New hotspots, showcase design options, sandbox autolink and more",
  "10 New Updates: Analytics Source Tracking, HTML Exports, Improved Mac App, and More!",
  "8 New Updates: Sandbox Auto-Linking, Expiring Links, and Better Showcase Experience",
  "7+ New Updates: Revamped Analytics, Sandbox Demo Mode, Improved Screenshots",
  "Find & Replace, New Hotspot Options, Custom Fonts, Video Crop and More",
  "Trending Analytics and Lead Search, Export to PDF, and Workspace Filters",
  "Windows App Improvements, Audio on Chapters, UI/UX Upgrades",
  "Launch Week Day 5: Native Forms on Supademo",
  "Launch Week Day 4: Windows App Beta Release",
  "Launch Week Day 3: 9 Delightful Design Improvements",
  "Launch Week Day 2: Translations Hub",
  "Launch Week Day 1: A faster way to create interactive demos",
  "New: Custom domains and workspace branding",
  "New: Improved analytics and viewer insights",
  "New: Faster HTML capture and smarter redaction",
  "New: Showcase collections for every team",
  "New: More ways to share product knowledge"
] as const;

const productUpdateHrefs = [
  "/blog/product-update-june-recap",
  "/blog/product-update-may-recap",
  "/blog/product-update-april-recap",
  "/blog/product-update-mcp-server",
  "/blog/product-update-routehub",
  "/blog/product-update-march-recap",
  "/blog/product-update-feb-recap",
  "/blog/product-update-jan-recap",
  "/blog/product-update-dec-recap",
  "/blog/product-update-nov-recap",
  "/blog/product-update-oct-recap",
  "/blog/product-update-demo-hub",
  "/blog/product-update-oct-1",
  "/blog/product-update-sept-25",
  "/blog/product-update-sept-4",
  "/blog/product-update-aug-22",
  "/blog/product-update-aug-7",
  "/blog/product-update-july-31",
  "/blog/product-update-july-10",
  "/blog/product-update-june-19",
  "/blog/product-update-may-29",
  "/blog/product-update-may-8",
  "/blog/product-update-april-10",
  "/blog/launch-week-native-forms",
  "/blog/launch-week-windows-app",
  "/blog/launch-week-9-design-updates",
  "/blog/launch-week-translations-hub"
] as const;

const productUpdateImages = [
  "68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png",
  "7cfbe570467c43a4bff62ce1adfe394b17a0a503-1672x941.png",
  "77733958ac0f7c300deb0af399b86f56d9472884-1413x795.jpg",
  "b41cb0939e134b3df1d2ff61ed71634da14c8eb2-2034x1090.jpg",
  "94927e7fe09af68c6e7e38f648e8fce01e6034d2-1413x795.jpg",
  "b3655a7eb3c4972590f3c3e0d75681fca8eb2c88-2120x1193.jpg",
  "a7380d7bce91764a4aebf324de4b5f5dfe948113-1413x795.jpg",
  "ef34fb66b07d02486be82c69d4c5c07da23142e9-2826x1590.heif",
  "7136dda69442d8024fb677eed9828eec2ae4018d-2826x1590.jpg",
  "01a880e7632a980b433f3da8b0a405365091eaa3-2000x1125.jpg",
  "2c5cc35cf4a980718b8110a2e0e806a026e41bbf-2000x1125.jpg",
  "6497cd53f4078c0e505fea871cd62025f4f6cae5-2000x1125.jpg",
  "2e06e23e33f0610a051ad5f5d05c7c6f08239b86-2000x1125.jpg",
  "ca2eada2bb9f5889565f2cc73c10e41ce2957ea4-1888x1025.jpg",
  "e599ff2b4461630ec85ea58edfbfa880c756ec9e-1413x795.jpg",
  "b6e4222464a8af14d77b5b75ec2c296b01f4dc40-1888x1025.jpg",
  "73b3f97d0b2c818555c9c28b6dca137ac26035d4-2221x1248.png",
  "4bfdbddcca958b4495b4de2be008a20098390e3e-1888x1025.jpg",
  "b022c90ad483c5af9b0cba3fc4359bc595d56f32-1888x1025.jpg",
  "f1fbdf90a69029ff2ea61301786d39be27b139d5-1888x1025.jpg",
  "71a7ae15a10c83b1c37986bde17e7a841b2e8ace-1888x1025.jpg",
  "f0c976b074a0bbbfb3f94ba11c579cb89b15bb44-1888x1025.jpg",
  "2cc12ce73600ee0ba986240ddddc20155d5df194-1888x1025.jpg",
  "2d6048ca0beeb48f56e773ec284dd6078d6df9e3-2000x1010.jpg",
  "abb65c1ac444a751287ae4d4a0540c62e0478ccb-2000x1010.jpg",
  "1310660866a91c365ff1e606d65893a9fa409c17-2000x1010.jpg",
  "9c0c9f6468e8ad050cd44ffb109cd8ce821ad7e2-2000x1010.jpg"
] as const;

const productUpdateArticles: readonly MarketingBlogArticle[] = productUpdateArchive
  .slice(0, productUpdateHrefs.length)
  .map((title, index) => ({
    href: productUpdateHrefs[index],
    image: `${sanity}${productUpdateImages[index]}?w=800&q=80&auto=format`,
    alt: title,
    title,
    description:
      "Supademo product updates: new ways to create, personalize, share, and measure interactive demos.",
    author: "Joseph Lee",
    date: index < 3 ? ["Jul 7, 2026", "Jun 11, 2026", "May 8, 2026"][index] : "2026",
    category: "Product Updates"
  }));

const blogLandingExcludedHrefs = new Set([
  "/blog/sales/interactive-product-demo",
  "/blog/sales/create-better-interactive-demos",
  "/blog/sales/leveraging-interactive-demos",
  "/blog/startup/how-supademo-uses-supademo"
]);

const articles: readonly MarketingBlogArticle[] = [
  {
    href: "/blog/sales/interactive-product-demo",
    image: `${sanity}556c5e2026d2310d3479fa467f417c39059ef62f-2000x1041.jpg?w=800&q=80&auto=format`,
    alt: "Interactive Product Demo 101: A Complete Guide",
    title: "Interactive Product Demo 101: A Complete Guide",
    description:
      "In this guide, we will look into everything you need to know about interactive product demos with examples to improve your sales, marketing, and customer success collaterals.",
    author: "Joseph Lee",
    date: "Feb 25, 2024",
    category: "Sales Enablement"
  },
  {
    href: "/blog/sales/create-better-interactive-demos",
    image: `${sanity}acfb456a20d8161a49ffc9a77cdae74b364d219d-1280x720.jpg?w=800&q=80&auto=format`,
    alt: "Step-by-Step Guide: 7 Tips on Creating Better Interactive Demos",
    title: "Step-by-Step Guide: 7 Tips on Creating Better Interactive Demos",
    description:
      "Communicating how products work is critical — whether it is for salespeople to close deals, enable customers, or explain a complex workflow within support or training.",
    author: "Joseph Lee",
    date: "Jan 19, 2026",
    category: "Sales Enablement"
  },
  {
    href: "/blog/sales/leveraging-interactive-demos",
    image: `${sanity}784256e3af7ebe02c22b972476a1a1ef8f222032-1217x576.png?w=800&q=80&auto=format`,
    alt: "Top 6 Interactive Product Demo Use Cases You Need to Know",
    title: "Top 6 Interactive Product Demo Use Cases You Need to Know",
    description:
      "Interactive demos fit throughout the buyer journey and across departments, from product awareness to customer success and enablement.",
    author: "Nupur Mittal",
    date: "Jan 9, 2024",
    category: "Sales Enablement"
  },
  {
    href: "/blog/startup/how-supademo-uses-supademo",
    image: `${sanity}a173ff7b5833acad859b01d82aa25c8571ac4024-2400x1440.png?w=800&q=80&auto=format`,
    alt: "How Supademo uses Supademo for Demo Automation",
    title: "How Supademo uses Supademo for Demo Automation",
    description:
      "Using our own product helps our employees drive adoption and productivity while forcing us to identify new features, narrow down issues, and improve constantly.",
    author: "Joseph Lee",
    date: "Jan 16, 2026",
    category: "Inside Supademo"
  },
  {
    href: "/blog/agentic-demo-software",
    image: `${sanity}d9c546c6827c2dfac63c87ccfa30a2d5829a39ab-1200x720.png?w=800&q=80&auto=format`,
    alt: "Best Agentic Demo Software [Tested and Reviewed]",
    title: "Best Agentic Demo Software in 2026: 5 Tools Compared",
    description:
      "Your buyers want to understand your product now, not after three emails and a scheduled call. But sales and Solutions Engineering teams cannot personally demo every curious visitor.",
    author: "Narayani Iyear",
    date: "Jul 20, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/navattic-alternatives",
    image: `${sanity}12a9e03866a76c3e7563e385a20a47f16852f299-1200x720.png?w=800&q=80&auto=format`,
    alt: "Top 5 Navattic Alternatives & Competitors (2026 Guide)",
    title: "Top 5 Navattic Alternatives & Competitors (2026 Guide)",
    description:
      "In the market for a better interactive demo solution? Use this comprehensive guide to discover the leading 5 Navattic alternatives and competitors.",
    author: "Joseph Lee",
    date: "Jul 17, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/storylane-vs-arcade-vs-supademo",
    image: `${sanity}151b53ae229b6d6c92b766fcc50dc087f20ef8ac-1200x720.png?w=800&q=80&auto=format`,
    alt: "Storylane vs Arcade vs Supademo: Which is best in 2026?",
    title: "Storylane vs Arcade vs Supademo: Which is best in 2026?",
    description:
      "If Storylane, Arcade, and Supademo have made it into your shortlist, you are looking at three heavyweight contenders in interactive demo automation.",
    author: "Narayani Iyear",
    date: "Jul 16, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/personalized-outbound-demos-at-scale",
    image: `${sanity}7685482a33ee86584238eb2b742b02f7ed26d5ce-1280x720.jpg?w=800&q=80&auto=format`,
    alt: "How to create personalized outbound demos at scale with AI",
    title: "How to Create Personalized Outbound Demos at Scale With AI",
    description:
      "Cold outbound is getting brutal. Here is the exact workflow I use to turn one master demo into hundreds of personalized product demos.",
    author: "Joseph Lee",
    date: "Jul 16, 2026",
    category: "Sales Enablement"
  },
  {
    href: "/blog/what-are-agentic-demos",
    image: `${sanity}dcfec973345790dc1922d45dc941ef623f7e60f5-1200x720.png?w=800&q=80&auto=format`,
    alt: "What are agentic demos? How they work and where they fit",
    title: "What are agentic demos? How they work and where they fit",
    description:
      "Most product demos force buyers to choose between a fixed self-serve walkthrough and a live sales call. Agentic demos offer a third option.",
    author: "Narayani Iyear",
    date: "Jul 15, 2026",
    category: "Demo Automation Playbooks"
  },
  {
    href: "/blog/hackathon-july-8",
    image: `${sanity}31116e2337213ef2e3b0cdd1c9f6ad55de7c385f-1200x720.png?w=800&q=80&auto=format`,
    alt: "Winning team on stage at a hackathon",
    title: "Results from our 1st Hackathon: Everything We Built in 48 Hours",
    description:
      "Six teams, one house in Toronto, 48 hours. A candid look at Supademo's first internal hackathon and everything we shipped.",
    author: "Joseph Lee",
    date: "Jul 10, 2026",
    category: "Product Updates"
  },
  {
    href: "/blog/product-update-june-recap",
    image: `${sanity}68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png?w=800&q=80&auto=format`,
    alt: "Supademo AI Voiceover 2.0 product update header",
    title: "New in June 2026: Voiceovers 2.0, Advanced Search, UI Redesign & Seismic Integration",
    description:
      "Supademo's June 2026 product updates: Voiceovers 2.0, Command K search, a redesigned dashboard, unified Workspace Settings, and more.",
    author: "Joseph Lee",
    date: "Jul 6, 2026",
    category: "Product Updates"
  },
  {
    href: "/blog/supademo-vs-claude-code",
    image: `${sanity}b21ab88b3aa4433bf754e58a9a794cb7a24c9814-2880x1620.jpg?w=800&q=80&auto=format`,
    alt: "Build vs. buy: vibe-coding product demos with Claude Code vs. building them on Supademo",
    title:
      "Supademo vs. Claude Code: Should You Vibe-Code Product Demos or Build Them on a Demo Platform?",
    description:
      "You can vibe-code a product demo with Claude Code, Remotion, and HyperFrames... but should you?",
    author: "Joseph Lee",
    date: "Jun 30, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/storylane-pricing",
    image: `${sanity}6235a27893259026a70563fef0c98b7fb7b42ef2-2000x1001.jpg?w=800&q=80&auto=format`,
    alt: "Storylane Pricing: How Effective is this Demo Automation Platform?",
    title: "Storylane Pricing: How Effective is this Demo Automation Platform?",
    description:
      "Understand Storylane's pricing models and compare them with other demo automation platforms.",
    author: "Nupur Mittal",
    date: "Jun 26, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/best-video-tutorial-software",
    image: `${sanity}7cc75f73aa438a521144f7a6e1175b509d61b3a4-1200x720.png?w=800&q=80&auto=format`,
    alt: "Best Video Tutorial Software in 2026 (Tested & Compared)",
    title: "12 Best Video Tutorial Software in 2026 (Tested & Compared)",
    description:
      "A practical comparison of the best video tutorial software for onboarding, support, and employee training.",
    author: "Fredo Tan",
    date: "Jun 24, 2026",
    category: "Demo Automation Playbooks"
  },
  {
    href: "/blog/consensus-vs-navattic-vs-supademo",
    image: `${sanity}90e86a6b3d236a9df406f3e39218628eb87805f2-1200x720.png?w=800&q=80&auto=format`,
    alt: "Consensus vs Navattic vs Supademo: Compared by AI Features, Ease of Use, and Scalability",
    title:
      "Consensus vs Navattic vs Supademo: Compared by AI Features, Ease of Use, and Scalability",
    description:
      "Compare three product demo platforms by AI features, ease of use, scalability, and buyer experience.",
    author: "Narayani Iyear",
    date: "Jun 22, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/ai-demo-agent-vs-ai-sdr",
    image: `${sanity}a8995bbb5f81651e88815de07e2f6140128dfbc8-1692x930.png?w=800&q=80&auto=format`,
    alt: "AI SDRs create pipeline while AI Demo Agents convert product interest",
    title: "AI Demo Agents vs AI SDRs: Which One Fits Your Sales Motion?",
    description:
      "Compare AI Demo Agents and AI SDRs by funnel stage, use case, buyer intent, handoff, and tools.",
    author: "Narayani Iyear",
    date: "Jun 22, 2026",
    category: "Sales Enablement"
  },
  {
    href: "/blog/saas-is-changing",
    image: `${sanity}bc711d1ad784fed2fda5df05088c1a0ad5b24820-1672x941.png?w=800&q=80&auto=format`,
    alt: "No, seriously: SaaS is about to change forever",
    title: "No, Seriously. SaaS Is About To Change Forever.",
    description:
      "Four shifts every founder needs to understand in 2026, and how to position your product before competitors catch on.",
    author: "Joseph Lee",
    date: "Jun 17, 2026",
    category: "Product Marketing"
  },
  {
    href: "/blog/tango-alternatives",
    image: `${sanity}ca981f9d59e6895315690e15b98a6b8878a9a28a-1200x720.webp?w=800&q=80&auto=format`,
    alt: "Top 5 Tango Alternatives and Competitors (2026 Guide)",
    title: "Top 10 Tango Alternatives and Competitors (2026 Guide)",
    description:
      "A step-by-step guide to finding the best alternatives for internal tools, onboarding, and product education.",
    author: "Narayani Iyear",
    date: "Jun 16, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/scribe-pricing",
    image: `${sanity}ac03f926ae10ade8246b8759a407a4276944b9da-1200x720.png?w=800&q=80&auto=format`,
    alt: "Scribe Pricing: Is It Worth The Cost? (Compared)",
    title: "Scribe Pricing: Is It Worth The Cost? (2026 Compared)",
    description: "Get a full breakdown of Scribe costs, plan limits, and what you actually get.",
    author: "Hiba Fathima",
    date: "Jun 15, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/product-update-may-recap",
    image: `${sanity}7cfbe570467c43a4bff62ce1adfe394b17a0a503-1672x941.png?w=800&q=80&auto=format`,
    alt: "Product Update Header",
    title: "New in May 2026: Free 4K Screen Recording, Showcases 2.0, Pronounciation Dictionary",
    description:
      "Supademo's May 2026 product updates: 4K recording, Showcases 2.0, pronunciation dictionaries, and more.",
    author: "Joseph Lee",
    date: "Jun 11, 2026",
    category: "Product Updates"
  },
  {
    href: "/blog/loom-coupon-code",
    image: `${sanity}16eea243795923b3f0cbf79e2b6d9d5a9169f153-1200x720.png?w=800&q=80&auto=format`,
    alt: "Loom Coupon Code & Discounts + A Better Alternative",
    title: "Loom Coupon Code & Discounts After Atlassian's Billing Changes (2026)",
    description:
      "The discount paths that work, plus what Atlassian's billing changes mean for your bill.",
    author: "Prit Centrago",
    date: "Jun 11, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/ai-demo-agent-guide",
    image: `${sanity}944eaa8f99e8beee4a3bdd5e2f488b08703b9708-1672x941.png?w=800&q=80&auto=format`,
    alt: "Joseph explaining how to build an AI demo agent with Supademo",
    title: "How I Built an AI Demo Agent That Sells 24/7 (And How You Can Too)",
    description:
      "How an AI demo agent can run agentic demos, qualify buyers, and book meetings while your team sleeps.",
    author: "Joseph Lee",
    date: "Jun 11, 2026",
    category: "Demo Automation Playbooks"
  },
  {
    href: "/blog/consensus-pricing",
    image: `${sanity}e6c0a0349a192ab62ad5f3cb44646048f11e792d-1200x720.webp?w=800&q=80&auto=format`,
    alt: "Consensus Pricing: Plans, Features, and Value Breakdown",
    title: "Consensus Pricing in 2026: Plans, Features, and Value Breakdown",
    description:
      "Full breakdown of Consensus pricing in 2026 with plans, features, costs, and alternatives.",
    author: "Narayani Iyear",
    date: "Jun 10, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/warmly-alternatives",
    image: `${sanity}f80c3d0f1cb582f182450446f243a19c77233d40-1200x720.png?w=800&q=80&auto=format`,
    alt: "Best Warmly Alternatives for Inbound Leads 2026",
    title: "7 Best Warmly alternatives in 2026 for AI-led buyer engagement",
    description:
      "Find the best Warmly alternatives for AI demos, visitor intelligence, qualification, and sales handoff.",
    author: "Narayani Iyear",
    date: "Jun 9, 2026",
    category: "Sales Enablement"
  },
  {
    href: "/blog/product-tour-software",
    image: `${sanity}7089f88e64bd67d3d1713e942518302582cc9ea9-2000x1124.webp?w=800&q=80&auto=format`,
    alt: "12 Best Product Tour Software in 2026",
    title: "15 Best Product Tour Software in 2026: Pre-Trial and In-App Tools Compared",
    description:
      "Compare product tour software for teams that need clearer onboarding and stronger activation.",
    author: "Prachi Jha",
    date: "Jun 4, 2026",
    category: "Demo Automation Playbooks"
  },
  {
    href: "/blog/naoma-alternatives",
    image: `${sanity}f276147d751522f0a05279b6320dbbfcc823bacf-1200x720.png?w=800&q=80&auto=format`,
    alt: "7 Best Naoma AI Alternatives for Agentic Product Demos",
    title: "7 Best Naoma AI Alternatives for Agentic Product Demos in 2026",
    description:
      "Compare AI video agents, buyer qualification, approved asset routing, pricing, and implementation.",
    author: "Narayani Iyear",
    date: "Jun 2, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/1mind-alternatives",
    image: `${sanity}3805ce291e2322ace2f8c1273a7d3e6bbb0555b5-1200x720.png?w=800&q=80&auto=format`,
    alt: "7 best 1mind alternatives",
    title: "7 Best 1mind Alternatives for AI Demo Agents in 2026",
    description:
      "Find alternatives for AI-led demos, buyer qualification, approved asset routing, and faster implementation.",
    author: "Narayani Iyear",
    date: "May 29, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/top-presales-software-for-2024",
    image: `${sanity}6f2e5ad15f56766d7a14642023dfe1fb0188590d-1200x720.png?w=800&q=80&auto=format`,
    alt: "Top Performing Presales Software",
    title:
      "12 Best Presales Tools in 2026: Compare Demos, RFPs, POCs, and AI Buyer Engagement Software",
    description:
      "Compare the best presales tools for demos, AI buyer engagement, POCs, RFPs, and SE workflows.",
    author: "Hiba Fathima & Narayani Iyear",
    date: "May 27, 2026",
    category: "Sales Enablement"
  },
  {
    href: "/blog/bootstrapping-vs-vc",
    image: `${sanity}913fc6ea7160dcca017abdec62acaba93184b459-1672x941.png?w=800&q=80&auto=format`,
    alt: "Bootstrapping vs Venture Capital",
    title: "Bootstrapping vs VC: Which Is Better in the Age of AI?",
    description:
      "The real tradeoffs between raising venture capital and bootstrapping your startup in the age of AI.",
    author: "Joseph Lee",
    date: "May 25, 2026",
    category: "Product Marketing"
  },
  {
    href: "/blog/karumi-alternatives",
    image: `${sanity}54d3fd17732912394feeb3d52845021fdff7514b-1200x720.png?w=800&q=80&auto=format`,
    alt: "Top Karumi alternatives for agentic demos in 2026",
    title: "7 Best Karumi Alternatives for Agentic Product Demos in 2026",
    description:
      "Compare the best Karumi alternatives for AI demo agents, including Supademo, 1Mind, Saleo, and Consensus.",
    author: "Narayani Iyear",
    date: "May 25, 2026",
    category: "Supademo Compared"
  },
  {
    href: "/blog/storylane-alternatives",
    image: `${sanity}a1751694fa93f475d2eae938119c009fbf86171f-1200x720.png?w=800&q=80&auto=format`,
    alt: "Top Storylane Alternatives & Competitors",
    title: "8 Best Storylane alternatives in 2026: compare features, pricing, AI, and use cases",
    description:
      "Compare the best Storylane alternatives with features, pricing, AI, and comparison tables.",
    author: "Joseph Lee",
    date: "May 22, 2026",
    category: "Supademo Compared"
  }
] as const;

const categories = [
  "All",
  "Featured",
  "Product Updates",
  "Supademo Compared",
  "Demo Automation Playbooks",
  "Sales Enablement",
  "Product Marketing"
] as const;

type FeaturedArticle = {
  title: string;
  author: string;
  date: string;
  image: string;
  href: string;
};

const featured: readonly FeaturedArticle[] = [
  {
    title: "New in June 2026: Voiceovers 2.0, Advanced Search, UI Redesign & Seismic Integration",
    author: "Joseph Lee",
    date: "Jul 6, 2026",
    image: `${sanity}68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png?w=1200&q=80&auto=format`,
    href: "/blog/product-update-june-recap"
  },
  {
    title: "Supademo vs. Claude Code: Should You Vibe-Code Product Demos or Build Them...",
    author: "Joseph Lee",
    date: "Jul 1, 2026",
    image: `${sanity}b21ab88b3aa4433bf754e58a9a794cb7a24c9814-2880x1620.jpg?w=1200&q=80&auto=format`,
    href: "/blog/supademo-vs-claude-code"
  },
  {
    title: "No, Seriously. SaaS Is About To Change Forever.",
    author: "Joseph Lee",
    date: "Jun 17, 2026",
    image: `${sanity}bc711d1ad784fed2fda5df05088c1a0ad5b24820-1672x941.png?w=1200&q=80&auto=format`,
    href: "/blog/saas-is-changing"
  }
];

const productUpdateFeatured: readonly FeaturedArticle[] = [
  {
    title: "New in June 2026: Voiceovers 2.0, Advanced Search, UI Redesign & Seismic Integration",
    author: "Joseph Lee",
    date: "Jul 6, 2026",
    image: `${sanity}68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png?w=1200&q=80&auto=format`,
    href: "/blog/product-update-june-recap"
  },
  {
    title: "New in May 2026: Free 4K Screen Recording, Showcases 2.0, Pronounciation Dictionary",
    author: "Joseph Lee",
    date: "Jun 11, 2026",
    image: `${sanity}7cfbe570467c43a4bff62ce1adfe394b17a0a503-1672x941.png?w=1200&q=80&auto=format`,
    href: "/blog/product-update-may-recap"
  },
  {
    title: "New in April 2026: Account Analytics, Offline Demos, MCP, Route Hub & AI Demo Agents",
    author: "Joseph Lee",
    date: "May 5, 2026",
    image: `${sanity}77733958ac0f7c300deb0af399b86f56d9472884-1413x795.jpg?w=1200&q=80&auto=format`,
    href: "/blog/product-update-april-recap"
  }
];

function BlogAvatar({ author }: { author: string }) {
  return (
    <img
      className="blog-exact-avatar"
      src={author.includes("Narayani") ? narayaniAvatar : josephAvatar}
      alt={author}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function FeaturedCard({ item }: { item: FeaturedArticle }) {
  return (
    <a className="blog-exact-feature-card" href={item.href}>
      <div className="blog-exact-feature-copy">
        <h2>{item.title}</h2>
        <div className="blog-exact-byline">
          <BlogAvatar author={item.author} />
          <span>{item.author}</span>
          <i aria-hidden="true" />
          {item.date}
        </div>
      </div>
      <img src={item.image} alt={item.title} loading="eager" referrerPolicy="no-referrer" />
    </a>
  );
}

function ArticleCard({ article }: { article: MarketingBlogArticle }) {
  return (
    <article className="blog-exact-card">
      <a className="blog-exact-card-image" href={article.href} aria-label={article.title}>
        <img src={article.image} alt={article.alt} loading="lazy" referrerPolicy="no-referrer" />
        <span>{article.category}</span>
      </a>
      <div className="blog-exact-card-body">
        <a className="blog-exact-card-title" href={article.href}>
          {article.title}
        </a>
        <p>{article.description}</p>
        <div className="blog-exact-card-byline">
          <BlogAvatar author={article.author} />
          <div>
            <strong>{article.author}</strong>
            <small>{article.date}</small>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductUpdateCard({ article }: { article: MarketingBlogArticle }) {
  return (
    <article className="blog-exact-card blog-exact-product-update-card">
      <a className="blog-exact-card-image" href={article.href} aria-label={article.title}>
        <img src={article.image} alt={article.alt} loading="lazy" referrerPolicy="no-referrer" />
        <span>{article.category}</span>
      </a>
      <div className="blog-exact-card-body">
        <a className="blog-exact-card-title" href={article.href}>
          <h3>{article.title}</h3>
        </a>
        <p>{article.description}</p>
        <div className="blog-exact-card-byline">
          <BlogAvatar author={article.author} />
          <div>
            <strong>{article.author}</strong>
            <small>{article.date}</small>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Resolve a public article path to the same metadata used by the blog index.
 * Trailing slashes are ignored so copied reference links and canonical Next
 * routes share one source of truth.
 */
export function getMarketingBlogArticle(pathname: string): MarketingBlogArticle | undefined {
  const normalized = pathname.replace(/\/+$/u, "") || "/";
  return articles.find((article) => article.href === normalized);
}

export function MarketingBlogPage({
  initialCategory = "All",
  pageTitle = "The Supademo Blog"
}: { initialCategory?: (typeof categories)[number]; pageTitle?: string } = {}) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>(initialCategory);
  const [query, setQuery] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const filteredArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch =
        activeCategory === "All" ||
        activeCategory === "Featured" ||
        article.category === activeCategory;
      const queryMatch =
        !needle || `${article.title} ${article.description}`.toLowerCase().includes(needle);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query]);
  const filteredProductUpdateArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const categoryMatch =
      activeCategory === "All" ||
      activeCategory === "Featured" ||
      activeCategory === "Product Updates";

    if (!categoryMatch) {
      return [];
    }

    return productUpdateArticles.filter(
      (article) =>
        !needle || `${article.title} ${article.description}`.toLowerCase().includes(needle)
    );
  }, [activeCategory, query]);
  const featuredItems = pageTitle === "Product Updates" ? productUpdateFeatured : featured;
  const isProductUpdates = pageTitle === "Product Updates";
  const visibleArticles =
    pageTitle === "The Supademo Blog"
      ? filteredArticles.filter((article) => !blogLandingExcludedHrefs.has(article.href))
      : filteredArticles;

  return (
    <main
      className={`blog-exact-page ${pageTitle === "Product Updates" ? "blog-exact-updates-page" : "blog-exact-index"}`}
      id="main"
    >
      <MarketingHeader />
      <section className="blog-exact-hero" aria-labelledby="blog-exact-title">
        <h1 id="blog-exact-title">{pageTitle}</h1>
        <p>
          Product updates, interactive demo tutorials, and GTM insights to help
          <br className="blog-exact-desktop-break" /> you create better demos and grow faster.
        </p>
      </section>
      <section className="blog-exact-featured" aria-label="Featured articles">
        <div
          className="blog-exact-feature-track"
          style={{ transform: `translateX(-${featuredIndex * 992}px)` }}
        >
          {featuredItems.map((item) => (
            <FeaturedCard item={item} key={item.href} />
          ))}
        </div>
        <div className="blog-exact-feature-controls">
          <button
            type="button"
            aria-label="Previous featured article"
            disabled={featuredIndex === 0}
            onClick={() => setFeaturedIndex((current) => Math.max(0, current - 1))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next featured article"
            disabled={featuredIndex === featuredItems.length - 1}
            onClick={() =>
              setFeaturedIndex((current) => Math.min(featuredItems.length - 1, current + 1))
            }
          >
            ›
          </button>
        </div>
      </section>
      <section className="blog-exact-filters" aria-label="Filter blog articles">
        <div className="blog-exact-filter-row" role="tablist" aria-label="Article categories">
          {categories.map((category) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="blog-exact-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 120))}
            placeholder="Search articles..."
            aria-label="Search articles"
          />
        </label>
      </section>
      <section className="blog-exact-article-section" aria-label="All blog articles">
        <div className="blog-exact-grid">
          {(isProductUpdates ? filteredProductUpdateArticles : visibleArticles).map((article) =>
            isProductUpdates ? (
              <ProductUpdateCard article={article} key={article.href} />
            ) : (
              <ArticleCard article={article} key={article.href} />
            )
          )}
        </div>
      </section>
      {!isProductUpdates ? (
        <section className="blog-exact-updates" aria-labelledby="blog-updates-title">
          <div>
            <h2 id="blog-updates-title">Product Updates</h2>
            <a href="/blog/product-updates">View all updates →</a>
          </div>
          <div className="blog-exact-update-grid">
            {articles
              .filter((article) => article.category === "Product Updates")
              .slice(0, 3)
              .map((article) => (
                <a href={article.href} key={article.href}>
                  <strong>{article.title}</strong>
                  <span>{article.date}</span>
                </a>
              ))}
          </div>
        </section>
      ) : null}
      <MarketingReferenceFooter />
    </main>
  );
}
