import { AnalyticsUseCaseTabs } from "./analytics-use-case-tabs";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import { RouteHubCalculator } from "./route-hub-calculator";
import { SandboxScaleCarousel } from "./sandbox-scale-carousel";
import { ScreenRecorderFeatureCarousel } from "./screen-recorder-feature-carousel";
import { ShowcaseUseCaseTabs } from "./showcase-use-case-tabs";

export type FeatureDetail = {
  label: string;
  title: string;
  description: string;
  heroImage?: string;
  outcome: string;
  steps: readonly [string, string][];
  capabilities: readonly string[];
  accent: "blue" | "purple" | "teal" | "orange" | "green";
};

const featureDetails: Record<string, FeatureDetail> = {
  "guided-html-demo": {
    label: "Guided HTML demos",
    title: "Create pixel-perfect HTML interactive demos",
    description:
      "Clone and share your product in fully interactive, browser-based product experiences that feel like using the real interface.",
    outcome: "Make complex software easy to explore without a live walkthrough.",
    steps: [
      ["Capture the workflow", "Record the path once and keep every useful interaction intact."],
      [
        "Guide the next step",
        "Add hotspots, captions, and chapters that make the journey obvious."
      ],
      ["Share anywhere", "Publish a lightweight link or embed it in the places your buyers learn."]
    ],
    capabilities: [
      "Responsive layouts",
      "Hotspots and chapters",
      "No-code publishing",
      "Viewer analytics"
    ],
    accent: "blue"
  },
  "sandbox-demos": {
    label: "Sandbox demos",
    title: "Build elegant sandbox demos with no code",
    description:
      "Transform your sales process with pixel-perfect demo environments—without engineering support, staging environments, or maintenance headaches.",
    outcome: "Replace a static tour with a product moment people can actually try.",
    steps: [
      ["Choose a starting state", "Set the data, permissions, and path that fit the audience."],
      ["Add safe interactions", "Let viewers explore without touching production or private data."],
      ["See what matters", "Use engagement signals to focus follow-up on real intent."]
    ],
    capabilities: ["Safe sandbox state", "Guided actions", "Lead capture", "Intent signals"],
    accent: "purple"
  },
  "route-hub": {
    label: "Route Hub",
    title: "Route every viewer to the right content automatically",
    description:
      "Let viewers self-select what matters. RouteHub instantly delivers the right interactive demos, content, and answers based on each viewer's role, goals, or use case.",
    outcome: "Make one link feel personal without creating a maze of pages.",
    steps: [
      ["Ask one useful question", "Collect only the context you need to choose a path."],
      ["Set simple rules", "Route by role, intent, company, or answer without a complex workflow."],
      ["Measure the journey", "See which paths create momentum and improve them over time."]
    ],
    capabilities: [
      "Forms and intent",
      "Conditional routes",
      "Personalized links",
      "Journey analytics"
    ],
    accent: "orange"
  },
  "demo-hub": {
    label: "Demo Hub",
    title: "In-app product tours that your users won't dismiss",
    description:
      "Create contextual product tours that help users discover value in the moment, without taking them away from the workflow.",
    outcome: "Turn a collection of demos into a clear, self-serve resource.",
    steps: [
      [
        "Collect the best stories",
        "Bring product updates, onboarding, and enablement into one place."
      ],
      ["Organize by goal", "Use clear labels so every viewer can find a useful next step."],
      ["Share one destination", "Publish a hub link that stays current as your product grows."]
    ],
    capabilities: [
      "Searchable library",
      "Branded collections",
      "Embed-ready hub",
      "Content insights"
    ],
    accent: "teal"
  },
  "screen-recorder": {
    label: "Screen recorder",
    title: "4K screen recorder built to replace them all",
    description:
      "Record your screen and webcam in up to 4K, edit for free, and share instantly. A free replacement for Loom, Vidyard, Screen Studio, Camtasia, and more, with interactive demos when you want to go beyond video.",
    outcome: "Go from a blank page to a useful product explanation in one focused take.",
    steps: [
      ["Pick a capture mode", "Choose screenshot, interactive HTML, or video before you start."],
      ["Record the aha moment", "Pause, undo, and keep the capture focused on the viewer's goal."],
      ["Polish and publish", "Trim the take, add context, and share a link that works everywhere."]
    ],
    capabilities: ["4K recording", "Webcam and voice", "Pause and undo", "Automatic uploads"],
    accent: "purple"
  },
  analytics: {
    label: "Supademo Analytics",
    title: "Identify your most promising prospects",
    description:
      "Evaluate and improve the performance of your Supademo by tracking viewers, engagement, and completion rates and more.",
    outcome: "Replace guesswork with a clear picture of what viewers actually do.",
    steps: [
      ["Watch the journey", "See where viewers start, continue, and stop across every step."],
      ["Understand intent", "Connect engagement with people, accounts, and the paths they chose."],
      [
        "Improve the story",
        "Use the signal to tighten the next version instead of adding more slides."
      ]
    ],
    capabilities: [
      "Views and engagement",
      "Step drop-off",
      "Viewer identity",
      "Exportable reports"
    ],
    accent: "blue"
  },
  sharing: {
    label: "Sharing",
    title: "Share your interactive demos anywhere",
    description:
      "Whether you want to email Supademo to a prospect, embed in your help center, or share an onboarding playbook, we've got you covered.",
    outcome: "Give every teammate a reliable way to share the right version.",
    steps: [
      [
        "Choose the audience",
        "Set public, gated, password, preview, or private access in plain language."
      ],
      ["Choose the format", "Send a link, embed a guide, export a video, or present live."],
      ["Keep it current", "Update the source once and every shared destination stays in sync."]
    ],
    capabilities: ["Link and embed", "Email gates", "Password and expiry", "Presentation mode"],
    accent: "green"
  },
  "demo-recorder": {
    label: "Demo Recorder",
    title: "Record studio quality product demos",
    description:
      "Bring life to your product demos to close more deals, drive enablement and scale product onboarding.",
    outcome: "Make recording the first step of a repeatable demo workflow.",
    steps: [
      ["Start recording", "Choose the browser tab and capture mode that match your story."],
      [
        "Add the useful detail",
        "Annotate steps, redact sensitive data, and keep the language concise."
      ],
      ["Send the link", "Preview the final flow, publish it, and share it with confidence."]
    ],
    capabilities: ["Click capture", "Sensitive-data blur", "Automatic step labels", "Fast publish"],
    accent: "orange"
  },
  "in-app-product-tour": {
    label: "In-app product tours",
    title: "In-app product tours that your users won't dismiss",
    description:
      "Embed contextual, interactive guidance inside your product so users can learn by doing without leaving the workflow.",
    outcome: "Help users reach value without interrupting the work they came to do.",
    steps: [
      [
        "Choose the moment",
        "Target the feature, role, or milestone where guidance is most useful."
      ],
      ["Guide the action", "Keep the tour short, direct, and anchored to the real interface."],
      ["Learn from usage", "Measure completion and refine the experience as your product changes."]
    ],
    capabilities: [
      "Contextual embeds",
      "Role-based paths",
      "Accessible controls",
      "Completion analytics"
    ],
    accent: "teal"
  },
  "demo-editor": {
    label: "Demo Editor",
    title: "Edit interactive demos like a pro",
    description:
      "Create engaging product demos with a powerful no-code editor - no technical skills required.",
    outcome: "Turn a raw capture into a clear, publishable story in one place.",
    steps: [
      ["Arrange the steps", "Reorder screens and chapters until the viewer's path feels natural."],
      ["Shape the context", "Edit text, hotspots, blur, and voiceover from the selected object."],
      ["Preview and share", "Check the story as a viewer, then publish the version you intended."]
    ],
    capabilities: ["Step rail", "Context inspector", "Inline editing", "Autosave and preview"],
    accent: "blue"
  },
  personalization: {
    label: "Personalization",
    title: "Improve engagement with personalized demos",
    description:
      "Grab viewer attention and boost engagement by creating personalized demo experiences at scale without sacrificing efficiency.",
    outcome: "Give viewers the context they need while keeping your library manageable.",
    steps: [
      ["Define the audience", "Start with the role, company, or goal that changes the story."],
      ["Personalize the moment", "Use variables and conditional content where relevance matters."],
      [
        "Share one source",
        "Keep analytics and updates in one version instead of splitting the library."
      ]
    ],
    capabilities: ["Variables", "Conditional paths", "Custom branding", "Audience analytics"],
    accent: "purple"
  },
  figma: {
    label: "Figma import",
    title: "Create guided walkthroughs to elevate Figma prototypes",
    description:
      "Add smooth animations, AI voiceovers, CTAs, embedded forms, viewer analytics, and more - directly into your Figma designs for free!",
    outcome: "Move from design review to shared understanding with less handoff friction.",
    steps: [
      ["Import the flow", "Start with the frames and states that explain the intended experience."],
      [
        "Add the path",
        "Connect screens, annotate the decision points, and make the next click clear."
      ],
      ["Share the concept", "Send a clickable link to stakeholders, customers, or the build team."]
    ],
    capabilities: [
      "Figma import",
      "Clickable hotspots",
      "Comments and review",
      "Shareable previews"
    ],
    accent: "orange"
  },
  "showcase-collection": {
    label: "Showcase collections",
    title: "Share multiple interactive demos in one showcase",
    description:
      "Showcase collections enable you to combine and share related Supademos into a cohesive, multi-demo experience.",
    outcome: "Give people a complete answer without sending a chain of links.",
    steps: [
      [
        "Pick the stories",
        "Select the demos that explain the journey from first question to next step."
      ],
      ["Set the order", "Create a simple progression with chapters and a clear destination."],
      ["Publish one showcase", "Share one branded URL or embed the collection wherever it belongs."]
    ],
    capabilities: ["Multi-demo collections", "Chapters", "Branded URLs", "Collection analytics"],
    accent: "green"
  },
  screenshot: {
    label: "Screenshot",
    title: "Capture and share beautiful product screenshots in seconds",
    description:
      "Snap, beautify and share screenshots instantly as a download or link. No design skills necessary.",
    outcome: "Turn a raw screen into a polished product moment.",
    steps: [
      ["Capture the screen", "Start with the product moment worth sharing."],
      ["Beautify the frame", "Add a clean background, annotation, or device frame."],
      ["Share the result", "Download the image or send a link that stays easy to revisit."]
    ],
    capabilities: ["Instant capture", "Beautiful backgrounds", "Annotations", "Download or link"],
    accent: "teal"
  },
  "ai-data-edit": {
    label: "AI Data Edit",
    title: "Edit and personalize demo data instantly with AI",
    description:
      "Transform one base demo into tailored, high-impact versions in seconds. Update data, text, structure, and visuals using AI instead of manual rebuilding.",
    outcome: "Make every demo feel specific without creating a new capture.",
    steps: [
      ["Describe the change", "Tell the editor what should be updated in plain language."],
      ["Review the result", "Preview the data and layout changes before they reach viewers."],
      ["Publish the variant", "Share a polished, personalized version from the same source demo."]
    ],
    capabilities: [
      "Natural-language edits",
      "Data replacement",
      "Visual updates",
      "Version control"
    ],
    accent: "purple"
  },
  "ai-demo-audit": {
    label: "AI Demo Audit",
    title: "Audit and optimize demo performance with AI",
    description:
      "Get instant AI-powered performance scores, actionable recommendations, and one-click implementation to transform underperforming demos into high-converting experiences.",
    outcome: "Turn engagement signals into changes your team can act on.",
    steps: [
      ["Score the experience", "See how clarity, pacing, and conversion signals perform."],
      ["Prioritize fixes", "Get recommendations ordered by expected viewer impact."],
      ["Apply and measure", "Implement the best changes and compare the next release."]
    ],
    capabilities: [
      "Performance score",
      "Actionable findings",
      "One-click fixes",
      "Before-and-after insight"
    ],
    accent: "blue"
  },
  "ai-translation": {
    label: "AI Translation",
    title: "AI Translation",
    description:
      "Localize your interactive demos into multiple languages so viewers around the world can engage in their preferred language.",
    outcome: "Give every market a native-feeling product explanation.",
    steps: [
      ["Choose a language", "Select the locale that matches the next audience."],
      ["Translate the story", "Localize captions, chapters, and supporting content with AI."],
      ["Share the right version", "Send a localized link while keeping one source of truth."]
    ],
    capabilities: [
      "Multiple locales",
      "AI translation",
      "Consistent terminology",
      "Localized links"
    ],
    accent: "teal"
  },
  "ai-voice-cloning": {
    label: "AI Voice Cloning",
    title: "AI Voice Cloning",
    description:
      "Add narration that sounds like you, so your interactive demos feel personal, human, and familiar.",
    outcome: "Keep the warmth of a live walkthrough in a self-serve experience.",
    steps: [
      ["Choose a voice", "Select a trusted voice profile for the story."],
      ["Write the narration", "Add concise context to the moments that need a human cue."],
      ["Preview and publish", "Listen through the flow and share a polished version."]
    ],
    capabilities: ["Voice profiles", "Natural narration", "Per-step audio", "Preview controls"],
    accent: "orange"
  },
  "ai-voiceover": {
    label: "AI Voiceover",
    title: "AI Voiceover",
    description:
      "Generate realistic narration for your interactive demos instantly using AI voices.",
    outcome: "Add clear spoken guidance without recording a new take.",
    steps: [
      ["Add a script", "Write the short explanation viewers need at each step."],
      ["Pick a voice", "Choose a tone and language that fit the audience."],
      ["Tune the timing", "Preview, adjust, and publish the voiceover with the demo."]
    ],
    capabilities: ["AI voices", "Multilingual output", "Per-step scripts", "Fast revisions"],
    accent: "purple"
  },
  annotations: {
    label: "Annotations",
    title: "Annotations",
    description:
      "Add arrows, shapes, and text to highlight key actions and guide viewers through an interactive demo.",
    outcome: "Make the important action unmistakable on every screen.",
    steps: [
      ["Point to the detail", "Choose the part of the interface that deserves attention."],
      ["Add context", "Use a concise note, arrow, or shape to explain why it matters."],
      ["Keep it readable", "Preview the annotation at the size viewers will see."]
    ],
    capabilities: [
      "Arrows and shapes",
      "Text callouts",
      "Step-level styling",
      "Viewer-safe overlays"
    ],
    accent: "blue"
  },
  autoplay: {
    label: "Autoplay",
    title: "Autoplay",
    description:
      "Automatically advance your interactive demos and loop them without any viewer interaction.",
    outcome: "Let a product story play naturally when the viewer is ready to watch.",
    steps: [
      ["Set the timing", "Choose how long each step stays visible."],
      ["Preview the loop", "Check that the transitions feel calm and intentional."],
      ["Share the experience", "Publish an autoplay link or embed for passive discovery."]
    ],
    capabilities: ["Per-step timing", "Loop playback", "Mute-friendly", "Embed support"],
    accent: "teal"
  },
  "background-music": {
    label: "Background Music",
    title: "Background Music",
    description:
      "Make your interactive demos more engaging with subtle, royalty-free background music.",
    outcome: "Set the tone without competing with the product story.",
    steps: [
      ["Choose the mood", "Select a track that supports the energy of the demo."],
      ["Set the level", "Keep music quiet enough that guidance remains clear."],
      ["Respect the viewer", "Preview muted and reduced-motion-friendly states before sharing."]
    ],
    capabilities: ["Royalty-free tracks", "Volume control", "Looping audio", "Mute by default"],
    accent: "orange"
  },
  blur: {
    label: "Blur",
    title: "Blur",
    description:
      "Hide sensitive on-screen data in interactive demos using automatic and manual blur.",
    outcome: "Share the workflow while keeping private information out of view.",
    steps: [
      ["Find sensitive data", "Identify the fields and screens that should stay private."],
      ["Blur the region", "Apply a precise blur that follows the captured interface."],
      ["Verify every step", "Review the full flow before publishing the demo."]
    ],
    capabilities: ["Manual blur", "Persistent masks", "Step review", "Private-by-default capture"],
    accent: "green"
  },
  chapters: {
    label: "Chapters",
    title: "Chapters",
    description:
      "Add contextual sections that guide, qualify, gate, or drive action within your interactive demos.",
    outcome: "Help viewers understand where they are and what to do next.",
    steps: [
      ["Group the flow", "Turn related steps into a short, named chapter."],
      ["Set the intent", "Use context, qualification, or a call to action to shape the section."],
      ["Measure the path", "See which chapters keep viewers moving forward."]
    ],
    capabilities: [
      "Named sections",
      "Gates and forms",
      "Chapter navigation",
      "Completion analytics"
    ],
    accent: "purple"
  },
  "conditional-branching": {
    label: "Conditional Branching",
    title: "Conditional Branching",
    description:
      "Let viewers choose their own path in an interactive demo, so each persona sees the most relevant flow.",
    outcome: "Make one experience useful for several audiences at once.",
    steps: [
      ["Define the choices", "Start from the decisions your viewers already make."],
      ["Connect the paths", "Point each answer to the content that matches it."],
      ["Review the outcomes", "Test every branch before the link goes live."]
    ],
    capabilities: ["Branching logic", "Persona paths", "Fallback routes", "Path analytics"],
    accent: "orange"
  },
  embed: {
    label: "Embed Interactive Demos",
    title: "Embed Interactive Demos",
    description:
      "Place Supademo interactive demos directly into your site, docs, or app — inline or as a popup — with support for event-driven interaction.",
    outcome: "Put the product explanation beside the decision it supports.",
    steps: [
      ["Choose the surface", "Pick a docs page, product screen, or marketing section."],
      ["Add the embed", "Use the generated snippet with a bounded, accessible frame."],
      ["Track engagement", "Listen for viewer events and connect the next action."]
    ],
    capabilities: ["Inline embeds", "Popup embeds", "Event callbacks", "Responsive frames"],
    accent: "blue"
  },
  "expiring-share-links": {
    label: "Expiring Share Links",
    title: "Expiring Share Links",
    description:
      "Share interactive demos with links that automatically expire after a set time period.",
    outcome: "Keep sensitive previews available only for as long as they are useful.",
    steps: [
      ["Set an expiry", "Choose the shortest window that fits the handoff."],
      ["Share the link", "Send one controlled URL to the intended audience."],
      ["Revoke or renew", "Change access as the conversation moves forward."]
    ],
    capabilities: ["Time-bound access", "Revocation", "Preview controls", "Share audit"],
    accent: "green"
  },
  forms: {
    label: "Forms",
    title: "Forms",
    description:
      "Capture lead details and qualification info directly inside an interactive demo, right when viewers are most engaged.",
    outcome: "Ask for the next detail at the moment intent is highest.",
    steps: [
      ["Choose the moment", "Place a lightweight form where the viewer has context."],
      ["Ask only what matters", "Keep fields focused and bounded for a fast completion."],
      ["Route the response", "Send the lead to the right follow-up or CRM workflow."]
    ],
    capabilities: ["Embedded fields", "Qualification questions", "Consent copy", "Lead routing"],
    accent: "teal"
  },
  "invisible-hotspots": {
    label: "Invisible Hotspots",
    title: "Invisible Hotspots",
    description:
      "Make HTML-based Supademos interactive without visible cues, creating realistic sandbox-style experiences.",
    outcome: "Preserve the feel of a real interface while keeping guidance out of the way.",
    steps: [
      ["Mark the target", "Select the interface region that should respond."],
      ["Set the destination", "Connect the target to the next state or chapter."],
      ["Test the affordance", "Confirm the area is discoverable and keyboard reachable."]
    ],
    capabilities: [
      "Invisible click zones",
      "HTML interactions",
      "Keyboard access",
      "Safe destinations"
    ],
    accent: "purple"
  },
  "trackable-share-links": {
    label: "Trackable Share Links",
    title: "Trackable Share Links",
    description:
      "Generate a unique link per viewer so you can track engagement without duplicating your interactive demo.",
    outcome: "Know which handoff created interest without multiplying your library.",
    steps: [
      ["Create a recipient link", "Give each viewer a bounded, unique URL."],
      ["Share with context", "Use the link in the message or workflow where it belongs."],
      ["Follow the signal", "Review engagement at the person and demo level."]
    ],
    capabilities: ["Unique links", "Viewer attribution", "Engagement tracking", "Share history"],
    accent: "blue"
  },
  "typewriter-effect": {
    label: "Typewriter Effect",
    title: "Typewriter Effect",
    description:
      "Animate text into input fields so viewers instantly know what to enter during an interactive demo.",
    outcome: "Show the intended input without adding another instruction panel.",
    steps: [
      ["Choose the field", "Select the input that benefits from an example."],
      ["Set the text", "Add a short, realistic value that demonstrates the action."],
      ["Tune the pace", "Keep the animation quick enough to feel helpful."]
    ],
    capabilities: [
      "Input animation",
      "Per-step text",
      "Timing controls",
      "Reduced-motion fallback"
    ],
    accent: "orange"
  }
};

const featureHeroImages: Record<string, string> = {
  "ai-data-edit": "https://supademo.com/features/ai-data-edit/hero.avif",
  "ai-demo-audit": "https://supademo.com/features/ai-demo-audit/hero.avif",
  "ai-translation": "https://supademo.com/features/ai-translation/hero.avif",
  "ai-voice-cloning": "https://supademo.com/features/ai-voice-cloning/hero.avif",
  "ai-voiceover": "https://supademo.com/features/ai-voiceover/hero.avif",
  analytics: "https://supademo.com/features/analytics/analytics-4.avif",
  annotations: "https://supademo.com/features/annotations/hero.avif",
  autoplay: "https://supademo.com/features/autoplay/hero.avif",
  "background-music": "https://supademo.com/features/background-music/hero.avif",
  blur: "https://supademo.com/features/blur/hero.avif",
  chapters: "https://supademo.com/features/chapters/hero.avif",
  "conditional-branching": "https://supademo.com/features/conditional-branching/hero.avif",
  "demo-editor": "https://supademo.com/features/editor/editor-2.avif",
  "demo-hub": "https://supademo.com/images/scale-03.avif",
  "demo-recorder": "https://supademo.com/features/demo-recorder/demo-recorder-1.avif",
  embed: "https://supademo.com/features/embed/hero.avif",
  "expiring-share-links": "https://supademo.com/features/expiring-share-links/hero.avif",
  figma: "https://supademo.com/images/recorder-figma.webp",
  forms: "https://supademo.com/features/forms/hero.avif",
  "guided-html-demo": "https://supademo.com/images/hero-guided-demos.avif",
  "invisible-hotspots": "https://supademo.com/features/invisible-hotspots/hero.avif",
  personalization: "https://supademo.com/features/personalization/personalization-6.avif",
  "route-hub": "https://supademo.com/images/hero-route-hub.avif",
  "sandbox-demos": "https://supademo.com/images/hero-sandbox-demos.avif",
  "screen-recorder": "https://supademo.com/features/screen-recorder/record-feature-1.avif",
  screenshot: "https://supademo.com/tools/screenshot-editor.avif",
  sharing: "https://supademo.com/features/sharing/sharing-hero-min.avif",
  "showcase-collection": "https://supademo.com/images/hero-demo-hubs.avif",
  "trackable-share-links": "https://supademo.com/features/trackable-share-links/hero.avif",
  "typewriter-effect": "https://supademo.com/features/typewriter-effect/hero.avif"
};

const featureSupportingImages = [
  "https://supademo.com/images/hero-guided-demos.avif",
  "https://supademo.com/images/hero-sandbox-demos.avif",
  "https://supademo.com/images/hero-route-hub.avif",
  "https://supademo.com/images/hero-demo-hubs.avif"
] as const;

type ReferenceFeatureRow = {
  title: string;
  description: string;
  cta: string;
  image: string;
  alt: string;
};

const referenceDemoEditorRows: readonly ReferenceFeatureRow[] = [
  {
    title: "Intuitive Demo Editor",
    description:
      "Build professional interactive demos with our intuitive, no-code editor. Easily add hotspots, annotations, and customize every aspect of your demo without any technical skills required.",
    cta: "Start Editing",
    image: "https://supademo.com/features/editor/editor-3.avif",
    alt: "Supademo demo editor with no-code editing controls"
  },
  {
    title: "Customizable Chapters",
    description:
      "Organize your demos into logical chapters and sections. Create a structured narrative that guides viewers through your product features in a clear, organized way.",
    cta: "Create Chapters",
    image: "https://supademo.com/features/editor/editor-4.avif",
    alt: "Supademo demo chapters editor"
  },
  {
    title: "Clickable Hotspots",
    description:
      "Add interactive clickable hotspots to highlight key features and guide user attention. Customize hotspot styles, animations, and behaviors to create engaging demo experiences.",
    cta: "Add Hotspots",
    image: "https://supademo.com/features/editor/editor-1.avif",
    alt: "Supademo clickable hotspot editing"
  }
];

const referencePersonalizationRows: readonly ReferenceFeatureRow[] = [
  {
    title: "Customize text and visuals",
    description:
      "Personalize every aspect of your demos with custom text, images, and branding. Create tailored experiences that resonate with each viewer and reflect your brand identity.",
    cta: "Start Customizing",
    image: "https://supademo.com/features/personalization/personalization-1.avif",
    alt: "Personalized Supademo text and visual editor"
  },
  {
    title: "Overlay AI and cloned voiceovers",
    description:
      "Add engaging audio narration to your demos with AI-generated voiceovers or record your own. Support multiple languages and create accessible, engaging demo experiences.",
    cta: "Try Voiceovers",
    image: "https://supademo.com/features/personalization/personalization-2.avif",
    alt: "Supademo AI voiceover controls"
  },
  {
    title: "Inject tokens and dynamic variables",
    description:
      "Create dynamic demos with tokens and variables. Automatically personalize content with viewer names, company information, and custom data to make every demo feel uniquely crafted.",
    cta: "Learn About Variables",
    image: "https://supademo.com/features/personalization/personalization-3.avif",
    alt: "Supademo dynamic variables in a demo"
  },
  {
    title: "Share unique trackable links",
    description:
      "Create unique, trackable links and receive notifications and analytics as viewers engage and complete steps within your Supademo.",
    cta: "Explore Analytics",
    image: "https://supademo.com/features/personalization/personalization-4.avif",
    alt: "Supademo trackable share link settings"
  },
  {
    title: "Get session and viewer-specific insights",
    description:
      "Understand how each prospect interacts with your demos for focussed marketing/sales effort analysis. Monitor individual session durations, clicks, engagement, and more.",
    cta: "Start Tracking",
    image: "https://supademo.com/features/personalization/personalization-5.avif",
    alt: "Supademo viewer session analytics"
  }
];

const referenceDemoCapabilities = [
  [
    "Add custom branding",
    "Create a cohesive and memorable brand presence with a custom domain, logo, CTA and colors."
  ],
  [
    "Add zoom and animations",
    "Directing viewer focus to crucial product areas through zooming and panning, particularly useful for highlighting small interface elements on complex pages."
  ],
  [
    "Add voiceovers and translations",
    "Instantly translate your Supademo into multiple languages. Bring your Supademo to life with personalized voiceovers or AI-generated voices."
  ],
  [
    "Built-in email capture and surveys",
    "Add surveys and email forms to your Supademo to collect valuable viewer data."
  ],
  [
    "Redact and annotate with ease",
    "Features smart masking for sensitive information protection, cropping capabilities, plus text and shape customization options for enhanced privacy compliance."
  ],
  [
    "Password protect or restrict access",
    "Password protect your content or set up domain-based whitelisting or blacklisting for sensitive access."
  ]
] as const;

const referenceDemoEditorFaqs = [
  [
    "What editing features are available in Supademo's demo editor?",
    "Supademo's no-code editor provides comprehensive editing capabilities for text, hotspots, chapters, annotations, voiceovers, branding, and more."
  ],
  [
    "Can I update my interactive demos without re-recording?",
    "Yes. Update the content, styling, navigation, and guidance in the editor without capturing the workflow again."
  ],
  [
    "What are chapters and hotspots in Supademo?",
    "Chapters organize a story into clear sections, while hotspots let viewers discover and navigate important actions in each step."
  ],
  [
    "How do I add custom branding to my demos?",
    "Open the editor's branding controls to add your logo, colors, CTA, and custom domain before publishing."
  ],
  [
    "Can I add voiceovers and translations to my demos?",
    "Yes. Add your own narration or generate AI voiceovers, then translate the experience into the languages your audience needs."
  ]
] as const;

const referencePersonalizationFaqs = [
  [
    "What are dynamic variables in Supademo?",
    "Dynamic variables let one demo use viewer, company, or custom data so each person sees a more relevant experience."
  ],
  [
    "How do AI voiceovers work in Supademo?",
    "Add a short script, choose a voice and language, and preview the generated narration at each step."
  ],
  [
    "How do trackable share links help with personalization?",
    "Unique links connect engagement signals to the intended recipient while keeping one source demo easy to update."
  ],
  [
    "Can I personalize demos for different industries or use cases?",
    "Yes. Combine custom content, tokens, and audience-specific links to tailor the story without duplicating the demo."
  ],
  [
    "How many languages does Supademo support for translations?",
    "Supademo supports multiple languages so teams can create localized, accessible product experiences for global audiences."
  ]
] as const;

const guidedHtmlFeatureCards = [
  {
    title: "AI Demo Editor",
    description:
      "Customize content for your prospect's industry or use case with AI prompts. Whether you need to update data or swap logos, you can edit like a pro—without needing a designer or developer.",
    image: "https://supademo.com/features/html/html-2.avif",
    alt: "AI Demo Editor",
    className: "is-editor"
  },
  {
    title: "Sandbox Demos",
    description:
      "Create isolated demo environments for prospects to experience your product in a realistic sandbox, without risk to live systems or data.",
    image: "https://supademo.com/features/html/html-3.avif",
    alt: "Sandbox Demos",
    className: "is-sandbox"
  },
  {
    title: "Dynamic Tokens & Variables",
    description:
      "Instantly personalize hotspots, titles, or HTML content with {{name}}, {{role}}, or any custom variable—delivering tailor-made experiences for each prospect at scale.",
    image: "https://supademo.com/features/html/html-4.avif",
    alt: "Dynamic Tokens & Variables",
    className: "is-tokens"
  }
] as const;

const guidedHtmlRows = [
  {
    title: "Clone Your Product with No Code",
    description:
      "Create pixel-perfect HTML and CSS clones of your product in minutes. Capture your application's exact look and feel without any coding required, perfect for creating reliable demo environments.",
    tags: ["No-Code Cloning", "Pixel-Perfect", "HTML/CSS Capture"],
    cta: "Start Cloning",
    image: "https://supademo.com/features/html/html-6.avif",
    alt: "Clone product interface with no code"
  },
  {
    title: "Edit Text, Logos and Content",
    description:
      "Easily modify any content in your cloned demo. Update text, swap logos, change images, and personalize data without re-recording. Make your demos relevant for every prospect.",
    tags: ["Content Editing", "Dynamic Updates", "Personalization"],
    cta: "Start Editing",
    image: "https://supademo.com/features/html/html-7.avif",
    alt: "Edit text, logos and content"
  },
  {
    title: "Redact or Delete Elements",
    description:
      "Protect sensitive information by easily redacting or removing elements from your HTML demos. Ensure compliance and security while maintaining a realistic demo experience.",
    tags: ["Data Protection", "Element Removal", "Security First"],
    cta: "Explore Security",
    image: "https://supademo.com/features/html/html-8.avif",
    alt: "Redact or delete sensitive elements"
  },
  {
    title: "Share and embed anywhere",
    description:
      "Share your cloned product demo as a tracked link or embed it anywhere online - without worrying about missing source files, image hosting, or breaking code changes.",
    tags: ["Trackable Links", "Embed Anywhere", "Analytics"],
    cta: "Explore Sharing",
    image: "https://supademo.com/features/html/html-1.avif",
    alt: "Share and embed HTML demos anywhere"
  }
] as const;

const guidedHtmlUseCases = [
  {
    label: "Sales & Enablement",
    title: "Qualify and close deals faster",
    description:
      "Close more deals by pre-qualifying prospects and involving decision makers through interactive product demos.",
    image: "https://supademo.com/images/usecase-sales.avif"
  },
  {
    label: "Marketing & Growth",
    title: "Convert interest into action",
    description:
      "Show the value of your product before a call with interactive experiences that make every campaign click count.",
    image: "https://supademo.com/images/usecase-marketing.avif"
  },
  {
    label: "Customer Success",
    title: "Guide customers to value",
    description:
      "Give customers a self-serve path to the feature, workflow, or answer they need next.",
    image: "https://supademo.com/images/usecase-customer-success.avif"
  },
  {
    label: "Onboarding",
    title: "Make the first session count",
    description:
      "Turn product onboarding into an interactive walkthrough that is easy to follow and revisit.",
    image: "https://supademo.com/images/usecase-onboarding.avif"
  },
  {
    label: "Support",
    title: "Resolve questions visually",
    description:
      "Replace long explanations with a focused, clickable answer that meets users in the product.",
    image: "https://supademo.com/images/usecase-support.avif"
  },
  {
    label: "Product",
    title: "Share the product story early",
    description:
      "Help stakeholders understand new workflows while the product is still taking shape.",
    image: "https://supademo.com/images/usecase-product.avif"
  },
  {
    label: "Training",
    title: "Teach workflows by doing",
    description:
      "Create repeatable learning paths that help every teammate practice the product, not just watch it.",
    image: "https://supademo.com/images/usecase-training.avif"
  }
] as const;

const guidedHtmlFaqs = [
  {
    question: "What are HTML-based interactive demos?",
    answer:
      "HTML-based interactive demos are pixel-perfect clones or replicas of a software-based product. By directly cloning the HTML and CSS of the original product, HTML-based interactive demos allow users to explore and interact with the product without needing to create an account or access the full live version."
  },
  {
    question: "How do HTML-based demos differ from screenshot and video-based demos?",
    answer:
      "While the recording process is the same for both types of interactive demos, HTML-clone demos provide a more realistic and interactive experience. Viewers can click individual elements, preserve hover states and animations, personalize content after recording, and see a higher-fidelity version of the product."
  },
  {
    question: "What are the key benefits of HTML-based interactive demos?",
    answer:
      "HTML-based interactive demos provide a realistic try-before-you-buy experience, reduce the need for live demo environments, make updates easy from one captured source, and provide deeper analytics on how viewers interact with the demo."
  },
  {
    question: "How are HTML-based product demos created through Supademo?",
    answer:
      "Supademo's HTML-based interactive demos can be created in minutes with the Chrome extension. Turn on the extension, capture the workflow you want to explain, then edit the content, add guidance, and share the finished demo."
  }
] as const;

const sandboxFeatureCards = [
  {
    title: "Realistic sandbox demos in minutes",
    description:
      "Hit record and click through pages, features, and elements you want to include in your sandbox. Supademo auto-links steps and generates your sandbox in minutes.",
    image: "https://supademo.com/images/how-to-1.avif",
    alt: "Realistic sandbox demos in minutes"
  },
  {
    title: "Superior functionality at a fair price",
    description:
      "Supademo costs less than enterprise alternatives while delivering superior functionality that is faster, more intuitive, and more maintainable.",
    image: "https://supademo.com/images/how-to-2.avif",
    alt: "Superior functionality at a fair price"
  },
  {
    title: "Data compliance and security",
    description:
      "Enterprise-grade security and SOC 2 Type II compliance keep your data safe, while sandbox isolation protects your production systems.",
    image: "https://supademo.com/images/how-to-3.avif",
    alt: "Data compliance and security"
  }
] as const;

const sandboxCapabilityCards = [
  [
    "HTML & CSS Cloning",
    "Capture pixel-perfect replicas of your product interface without compromising design or functionality.",
    "<>"
  ],
  [
    "Zero Maintenance",
    "Create once, use forever. No updates, patches, or ongoing maintenance required for your demo environment.",
    "✧"
  ],
  [
    "Production Safe",
    "Complete sandbox isolation ensures your production systems remain secure and unaffected.",
    "▣"
  ],
  [
    "Instant Deployment",
    "Deploy interactive demos immediately without staging environments or developer resources.",
    "◫"
  ],
  [
    "Interactive Elements",
    "Enable full user interaction with buttons, forms, and workflows in a risk-free environment.",
    "▱"
  ],
  [
    "Global Accessibility",
    "Share demos globally with fast loading times and reliable performance across all devices.",
    "◎"
  ]
] as const;

const sandboxUseCases = [
  [
    "Live Sales Demos",
    "Deliver compelling live demonstrations without worrying about system failures, connectivity issues, or data concerns."
  ],
  [
    "Proof of Concepts",
    "Quickly customize demos for specific use cases and industries, showing exactly how your product solves their problems."
  ],
  [
    "Post-Demo Leave-Behinds",
    "Provide prospects with interactive experiences they can explore at their own pace after your presentation."
  ],
  [
    "Partner Enablement",
    "Equip your channel partners with professional demo environments they can use to sell your solution effectively."
  ]
] as const;

const sandboxFaqs = [
  [
    "What are sandbox demos and how do they differ from guided demos?",
    "Sandbox demos are interactive, self-guided product environments created through HTML and CSS cloning that produce pixel-perfect replicas of your product interface. Unlike guided demos with predetermined paths, sandbox demos allow prospects to freely explore and interact with buttons, forms, and workflows in a risk-free environment that doesn't touch your production systems."
  ],
  [
    "Do sandbox demos require engineering resources to create?",
    "No, sandbox demos require zero engineering support. You simply record by clicking through your product, and Supademo auto-links steps and generates your sandbox in minutes. There's no need for staging environments, dev tickets, or ongoing maintenance. Create once and use forever without updates or patches."
  ],
  [
    "What are the best use cases for sandbox demos?",
    "Sandbox demos excel at live sales demonstrations (no system failures or connectivity issues), proof of concepts (quickly customized for specific industries), post-demo leave-behinds (interactive experiences prospects can explore at their pace), and partner enablement (professional demo environments for channel partners to use with their prospects)."
  ],
  [
    "How secure are sandbox demos?",
    "Sandbox demos offer enterprise-grade security with SOC 2 Type II compliance and complete sandbox isolation from your production systems. Your actual product data and systems remain protected while prospects interact with pixel-perfect replicas. You can also add password protection for additional access control."
  ],
  [
    "Can I customize sandbox demos for different prospects?",
    "Yes, you can personalize sandbox demos using dynamic variables to swap text, logos, images, and data for specific prospects or industries. This allows you to create tailored proof-of-concept experiences in minutes rather than weeks, showing exactly how your product solves each prospect's unique challenges."
  ]
] as const;

const figmaHowCards = [
  {
    title: "Customized styles",
    description:
      "Add and customize hotspots to point to specific area/component, incorporate callouts, or highlight areas.",
    image: "https://supademo.com/images/how-to-1.avif"
  },
  {
    title: "Responsive walkthroughs",
    description:
      "Share and view your prototype walkthroughs on desktop, mobile, tablet without compromising quality and UX.",
    image: "https://supademo.com/images/how-to-2.avif"
  },
  {
    title: "Easy updates",
    description:
      "Incorporate changes and new design iterations without the hassle of rebuilding complex screen linkages and interactions from scratch.",
    image: "https://supademo.com/images/how-to-3.avif"
  }
] as const;

const figmaFeatureRows = [
  {
    title: "Overlay AI and manual voiceovers",
    description:
      "Bring your Figma prototypes to life with AI-generated voiceovers or record your own custom narration. Add audio guidance to create more engaging and accessible prototype experiences.",
    tags: ["AI Voiceovers", "Custom Audio", "Multi-language Support"],
    cta: "Explore Personalization",
    href: "/features/personalization",
    image: "https://supademo.com/images/figma-voiceovers.webp",
    alt: "AI and Manual Voiceovers for Figma prototypes"
  },
  {
    title: "Clickable, guided hotspots",
    description:
      "Add interactive clickable hotspots to your Figma prototypes to guide users through key features and create engaging user experiences with smooth navigation.",
    tags: ["Interactive Elements", "Custom Hotspots", "User Guidance"],
    cta: "Explore Hotspots",
    href: "/features/invisible-hotspots",
    image: "https://supademo.com/images/figma-hotspot.webp",
    alt: "Clickable hotspots in Figma prototypes"
  },
  {
    title: "Customizable chapters and forms",
    description:
      "Organize your Figma prototypes into customizable chapters for better navigation and structure. Make it easy for viewers to jump between sections and focus on what matters most.",
    tags: ["Chapter Navigation", "Custom Structure", "Easy Updates"],
    cta: "Learn About Chapters",
    href: "/features/chapters",
    image: "https://supademo.com/images/figma-updates.webp",
    alt: "Customizable chapters in Figma prototypes"
  },
  {
    title: "Share unique trackable links",
    description:
      "Create unique, trackable links and receive notifications and analytics as viewers engage and complete steps within your Supademo.",
    tags: ["Personalized Links", "Analytics", "Notifications"],
    cta: "Explore Analytics",
    href: "/features/analytics",
    image: "https://supademo.com/images/sharing-trackable.avif",
    alt: "Share unique trackable links"
  },
  {
    title: "Get session and viewer-specific insights",
    description:
      "Understand how each prospect interacts with your demos for focussed marketing/sales effort analysis. Monitor individual session durations, clicks, engagement, and more.",
    tags: ["Viewer Tracking", "Session Data", "Lead Scoring"],
    cta: "Explore Analytics",
    href: "/features/analytics",
    image: "https://supademo.com/images/analytics-viewer.webp",
    alt: "Individual viewer analytics and tracking"
  }
] as const;

const figmaFaqs = [
  [
    "What is an interactive Figma prototype?",
    "A Figma prototype allows you to connect different frames or artboards together to simulate the flow and basic interactions of a user interface design. However, traditional Figma prototypes often lack the polish and realism of a true product experience."
  ],
  [
    "Is Figma good for prototyping?",
    "While Figma is a powerful design tool, using it for prototyping has limitations. Traditional Figma demos don't provide a realistic product feel, are time-consuming to build, complex to link screens together, and require deep technical know-how. With Supademo, you can elevate your Figma prototypes into seamless, truly interactive product demos."
  ],
  [
    "How do you make a clickable prototype?",
    "In Figma, you can create clickable prototypes by linking frames together using the Prototype tool. However, this traditional method is tedious, not easily updatable, lacks modern functionality like branching journeys or dynamic content, and ultimately feels like a non-working design demo rather than a polished product experience."
  ],
  [
    "How to make a walkthrough in Figma?",
    "Using the Supademo Figma plugin, anyone can customize & personalize guided walkthroughs and interactive Figma demos with trackable links, embedded forms, branching, AI voiceovers, or animated hotspot text — helping streamline communication, design feedback, validation, and testing. You can also share your guided walkthrough or interactive demo anywhere — as a personalized link, inline embed, or as an MP4/GIF export."
  ],
  [
    "Is Supademo available for Figma Web and Figma Desktop?",
    "Yes, the Supademo Figma plugin is available for Figma Web and Figma Desktop."
  ],
  [
    "What are the benefits of using an interactive demo tool like Supademo for Figma prototypes?",
    "Creating Figma prototypes with Supademo gives you dynamic hotspots and text annotations, custom domains or professional URLs, AI-powered voiceovers and translations, overlays for context or CTAs, visual indicators for clickable elements, and responsive experiences for mobile and desktop screens."
  ]
] as const;

const figmaTrustLogos = [
  ["Orbitax", "https://supademo.com/logos/orbitax-logo.svg"],
  ["Rev.io", "https://supademo.com/logos/revio.avif"],
  ["Ledger", "https://supademo.com/logos/ledger-logo.svg"],
  ["Plaid", "https://supademo.com/logos/plaid.svg"],
  ["Equitable", "https://supademo.com/logos/equitable.svg"],
  ["MidFirst Bank", "https://supademo.com/logos/midfirst.svg"],
  ["Spare", "https://supademo.com/logos/spare.svg"],
  ["Jotform", "https://supademo.com/logos/jotform.svg"],
  ["Anvil", "https://supademo.com/logos/useanvil.svg"],
  ["beehiiv", "https://supademo.com/logos/beehiiv.avif"],
  ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
  ["NetApp", "https://supademo.com/logos/netapp.svg"],
  ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
  ["Typeform", "https://supademo.com/logos/typeform.svg"],
  ["VRIFY", "https://supademo.com/logos/vrify.svg"],
  ["Siemens", "https://supademo.com/logos/simens.svg"],
  ["Alibaba", "https://supademo.com/logos/alibaba.avif"],
  ["Turo", "https://supademo.com/logos/turo.avif"],
  ["Concentrix", "https://supademo.com/logos/concentrix.svg"],
  ["Easy", "https://supademo.com/logos/easy.svg"]
] as const;

const sandboxExploreColumns = [
  [
    "Demo Recorder",
    [
      ["Guided HTML Demo", "/features/guided-html-demo"],
      ["Sandbox Demos", "/features/sandbox-demos"],
      ["Screen Recorder", "/features/screen-recorder"],
      ["Screenshot", "/features/screenshot"]
    ]
  ],
  [
    "Demo Editor",
    [
      ["Personalization", "/features/personalization"],
      ["Typewriter Effect", "/features/typewriter-effect"],
      ["Invisible Hotspots", "/features/invisible-hotspots"],
      ["Chapters", "/features/chapters"],
      ["Blur", "/features/blur"],
      ["Annotations", "/features/annotations"],
      ["Background Music", "/features/background-music"],
      ["Forms", "/features/forms"],
      ["Conditional Branching", "/features/conditional-branching"]
    ]
  ],
  [
    "Sharing",
    [
      ["Analytics", "/features/analytics"],
      ["In-App Demo Hub", "/features/demo-hub"],
      ["Showcase Collections", "/features/showcase-collection"],
      ["RouteHub", "/features/route-hub"],
      ["Embed Interactive Demos", "/features/embed"],
      ["Autoplay", "/features/autoplay"],
      ["Expiring Share Links", "/features/expiring-share-links"],
      ["Trackable Share Links", "/features/trackable-share-links"]
    ]
  ],
  [
    "Supademo AI",
    [
      ["AI Demo Agents", "/ai/demo-agents"],
      ["AI Voiceover", "/features/ai-voiceover"],
      ["AI Voice Cloning", "/features/ai-voice-cloning"],
      ["AI Translation", "/features/ai-translation"],
      ["AI Data Edit", "/features/ai-data-edit"],
      ["AI Demo Audit", "/features/ai-demo-audit"]
    ]
  ]
] as const;

const routeHubFeatureRows = [
  {
    title: "Personalized experiences adapted for each unique viewer",
    description:
      "RouteHub lets you build multi-path demo experiences from a single link. Viewers identify their role, goals, or use case, and the experience automatically adapts what the demos, videos, and content they see next.",
    subcopy: "Define the paths once. Every buyer gets the right journey.",
    cta: "Try RouteHub",
    image: "https://supademo.com/features/route-hub/block-1.avif",
    alt: "Personalized RouteHub experience"
  },
  {
    title: "Interactive demos, PDFs, videos, and content in one experience",
    description:
      "Control how and which content appears after viewer selection: a pre-set collection of personalized demos or an AI-suggested library of content based on your data.",
    subcopy:
      "Whether you want a focused guided journey or a self-serve exploration hub, RouteHub adapts to your use case.",
    cta: "See layout options",
    image: "https://supademo.com/features/route-hub/block-2.avif",
    alt: "RouteHub content layout options"
  },
  {
    title: "Adapted for every stage of the customer lifecycle",
    description:
      "One RouteHub replaces fragmented content distribution with guided, personalized delivery.",
    subcopy:
      "Sales, marketing, onboarding, and customer success teams all benefit from one smart link that lets viewers self-route by role, industry, goal, or maturity level. No more guessing which content to send or maintaining dozens of static links.",
    cta: "See RouteHub use cases",
    image: "https://supademo.com/features/route-hub/block-3.avif",
    alt: "RouteHub customer lifecycle content"
  }
] as const;

const routeHubFaqs = [
  [
    "What is RouteHub in Supademo?",
    "RouteHub is a personalized routing experience that adapts what interactive demos and content a viewer sees based on their inputs, profile, or behavior. It can deliver guided flows and multi-demo hubs from a single link."
  ],
  [
    "How is RouteHub different from conditional branching?",
    "Conditional branching controls what happens next inside a single demo. RouteHub operates at a higher level and routes viewers across multiple demos, showcases, and resources based on viewer selections."
  ],
  [
    "Can RouteHub show multiple demos at once?",
    "Yes. RouteHub supports multiple layouts, including guided single-flow mode, sidebar navigation, playlists, and grid or hub views where several recommended demos are shown together."
  ],
  [
    "Where can RouteHub be used?",
    "RouteHub can power sales demo distribution, marketing demo centers, product education hubs, onboarding journeys, and customer enablement portals. Anywhere personalized interactive content improves buyer or user experience."
  ]
] as const;

const analyticsFeatureRows = [
  {
    title: "Track workspace analytics",
    description:
      "Track key metrics like viewer counts, average engagement, and completion rates. Quickly identify top-performing demos and double down on successful demo strategies.",
    tags: ["Workspace Metrics", "Aggregate Data", "Performance Tracking"],
    cta: "Explore Workspace Analytics",
    image: "https://supademo.com/features/analytics/analytics-2.avif",
    alt: "Workspace-level analytics dashboard"
  },
  {
    title: "Track individual Supademo performance",
    description:
      "Access analytics of a specific demo you've published and discover patterns in viewer behavior, including attention span, CTA clicks, and drop-off points. Use this information to improve your demo for better completion rates.",
    tags: ["Demo Metrics", "Completion Rates", "Engagement Tracking"],
    cta: "Explore Demo Tracking",
    image: "https://supademo.com/features/analytics/analytics-3.avif",
    alt: "Individual demo analytics"
  },
  {
    title: "Get session and viewer-specific insights",
    description:
      "Understand how each prospect interacts with your demos for focussed marketing/sales effort analysis. Monitor individual session durations, clicks, engagement, and more.",
    tags: ["Viewer Tracking", "Session Data", "Lead Scoring"],
    cta: "Explore Viewer Tracking",
    image: "https://supademo.com/features/analytics/analytics-1.avif",
    alt: "Individual viewer analytics and tracking"
  },
  {
    title: "Identify your hottest prospects",
    description:
      "Evaluate and rank prospects based on engagement levels to focus sales efforts on the most interested leads, boosting conversion chances.",
    tags: ["Lead Scoring", "Prospect Ranking", "Sales Focus"],
    cta: "Track Prospects",
    image: "https://supademo.com/images/analytics-lead-scoring.webp",
    alt: "Lead scoring and prospect identification"
  },
  {
    title: "Connect to your sales and marketing stack",
    description:
      "Automatically collect and sync viewer engagement data from Supademo to platforms like HubSpot, Salesforce, and Marketo, enabling teams to identify and act on highly engaged prospects.",
    tags: ["HubSpot", "Salesforce", "Marketo"],
    cta: "View Integrations",
    image: "https://supademo.com/images/integrations-hero.svg",
    alt: "Sales and marketing integrations"
  }
] as const;

const analyticsFaqs = [
  [
    "What metrics does Supademo track for interactive demos?",
    "Supademo provides comprehensive analytics including viewer counts, average engagement rates, completion rates, session durations, CTA clicks, and drop-off points. You can track these metrics at both the workspace level (across all demos) and for individual demos to identify patterns in viewer behavior and optimize your demo strategy."
  ],
  [
    "How can I score my leads using Supademo analytics?",
    "You can use engagement metrics as powerful intent signals to identify hot leads. Analyze session duration, completion rates, drop-off points, device type, and CTA clicks to classify prospect interest levels. Viewers who complete demos, spend more time, or click CTAs demonstrate higher intent and should be prioritized by your sales team."
  ],
  [
    "Can I integrate Supademo analytics with my CRM or marketing tools?",
    "Yes, Supademo automatically syncs viewer engagement data to platforms like HubSpot, Salesforce, and Marketo. This integration enables your sales and marketing teams to act on engagement insights directly within their existing workflow, identify highly engaged prospects, and trigger automated follow-up sequences based on demo interactions."
  ],
  [
    "What is the difference between workspace and individual demo analytics?",
    "Workspace analytics aggregate data across your entire demo portfolio, helping you identify top-performing demos and successful strategies at a high level. Individual demo analytics focus on specific published demos, revealing detailed patterns in viewer behavior including attention span, CTA clicks, drop-off points, and completion rates for that particular demo."
  ],
  [
    "How can I use analytics to improve my demo performance?",
    "Use drop-off point data to identify where viewers lose interest and optimize those steps. Monitor completion rates to gauge overall effectiveness, track CTA clicks to measure conversion intent, and analyze session durations to understand engagement depth. Compare metrics across demos to identify what content resonates best with your audience."
  ]
] as const;

const demoHubExamples = [
  [
    "Supademo",
    "https://supademo.com/supademo_logo.svg",
    "Embed self-serve interactive guides inside of your app"
  ],
  [
    "Strava",
    "https://supademo.com/logos/strava.avif",
    "Drive adoption by highlighting new features"
  ],
  [
    "Freshworks",
    "https://supademo.com/logos/freshworks.avif",
    "Consolidate common support tickets into self-paced tutorials"
  ],
  [
    "HubSpot",
    "https://supademo.com/logos/hubspot.svg",
    "Scale self-serve onboarding for self-serve PLG signups"
  ],
  [
    "HelpScout",
    "https://supademo.com/logos/helpscout.svg",
    "Let developers access 24/7 support materials, regardless of location"
  ],
  [
    "Typeform",
    "https://supademo.com/logos/typeform-black.avif",
    "Build an engaging learning academy for first-time users"
  ]
] as const;

const demoHubComparison = [
  [
    [
      "Brittle, high-maintenance flows",
      "Tooltip chains break with UI changes and often require technical setup and maintenance, limiting iteration and improvements."
    ],
    [
      "Resilient, in-app demos that don't break",
      "Create interactive tours with zero dependency on in-app elements. Quickly add, remove, or categorize demos without technical work."
    ]
  ],
  [
    [
      "Expensive usage-based pricing and limited tours",
      "Limited tour limits lead to vague, high level overviews. Meanwhile, expensive, usage-based pricing penalizes your product as you scale."
    ],
    [
      "Scalable, cost-predictable tours",
      "Create a library of unlimited demos from high-level feature tours to granular workflows. At predictable, simple, all-in pricing."
    ]
  ],
  [
    [
      "Tours interrupt flow and get skipped",
      "Forced-sequence tours that break exploration and likely get skipped. Tours pop up when the user doesn't need them and disappear when they need them."
    ],
    [
      "On-demand, searchable assistance in-app",
      "Contextual, searchable demo hubs that trigger specific tours at the moment of need — not hijacked exploration with forced sequences that users skip."
    ]
  ],
  [
    [
      "Cognitive overload and poor recall",
      "Front-loaded feature dumps that cram too much information into long chains, overwhelming memory and leaving little retained."
    ],
    [
      "Lightweight tours that promote learn-by-doing",
      "Short, interactive actions that replace front-loaded feature dumps, reducing cognitive load and improving retention and task completion."
    ]
  ]
] as const;

const demoHubGuideSteps = [
  [
    "Record demos and tours",
    "Use Supademo's Chrome extension or desktop app to record interactive demos of your product workflows and features.",
    "▣"
  ],
  [
    "Add code snippet",
    "Add a simple code snippet to unlock multiple in-app demos and tours, overlayed inside of apps or websites.",
    "✧"
  ],
  [
    "Launch Demo Hubs in-app",
    "Add relevant demos to your Demo Hub to give users access to searchable, on-demand demos in your apps and sites.",
    "➤"
  ]
] as const;

const demoHubFaqs = [
  [
    "What is an in-app Demo Hub?",
    "A Demo Hub is an in-app library of interactive product demos and tours that users can access on demand, directly inside your website or app. It lets users explore tutorials, guides, and feature spotlights whenever they need help."
  ],
  [
    "How is a Demo Hub different from traditional in-app product tours?",
    "Traditional tours are often forced, linear walkthroughs that interrupt user workflows. Demo Hubs are contextual, user-triggered, and searchable—allowing users to find the exact guidance they need without breaking their flow."
  ],
  [
    "Do I need a developer to set up a Demo Hub?",
    "You may need a developer's assistance for initial setup, which involves adding a one-line script to your app or website. After that, zero technical or design skills are needed. Simply record demos using Supademo's Chrome extension or desktop app, and add/manage/organize your demos in minutes."
  ],
  [
    "Can I include multiple demos in one Hub?",
    "Yes. You can create unlimited demos and organize them by product, page, use case, or user type. Demo Hubs are built to scale with your product and support multiple variations."
  ],
  [
    "How do users access Demo Hubs inside my app?",
    "Users can open a Demo Hub through a customizable widget or by clicking any element or trigger you define in your app. This makes support and learning instantly accessible."
  ],
  [
    "Can I create multiple Demo Hubs inside one application or website?",
    "Yes, you can create multiple Demo Hubs within a single app. Each Hub can be customized for different pages, products, user roles, or use cases. For example, you might set up one Hub for onboarding new users, another for advanced feature tutorials, and a third for developer documentation."
  ],
  [
    "What are some common use cases for Demo Hubs?",
    "Demo Hubs are great for onboarding new users, spotlighting new features, delivering role-based workflow tutorials, and consolidating common support topics into self-serve demos."
  ],
  [
    "Are there limits on viewers or the number of demos I can create?",
    "No. Demo Hubs include unlimited viewers and unlimited demos with predictable, all-in pricing—no usage-based fees or growth penalties."
  ]
] as const;

const demoHubTrustLogos = [
  ["Alibaba", "https://supademo.com/logos/alibaba.avif"],
  ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
  ["Typeform", "https://supademo.com/logos/typeform.svg"],
  ["NetApp", "https://supademo.com/logos/netapp.svg"],
  ["RB2B", "https://supademo.com/logos/rb2b.svg"],
  ["Turo", "https://supademo.com/logos/turo.avif"],
  ["Concentrix", "https://supademo.com/logos/concentrix.svg"],
  ["VRIFY", "https://supademo.com/logos/vrify.svg"],
  ["Posh", "https://supademo.com/logos/poshvip.svg"],
  ["Siemens", "https://supademo.com/logos/simens.svg"]
] as const;

const showcaseFeatureSteps = [
  [
    "Create modular sections",
    "Quickly create sections within Showcases to organize your Supademos by product, feature, use case, or persona.",
    "https://supademo.com/features/showcase/showcase-4.avif",
    "Create modular sections"
  ],
  [
    "Add Supademos",
    "Search and add relevant Supademos to each Showcase section to allow viewers to click through mulitple, related product demos in one place.",
    "https://supademo.com/features/showcase/showcase-5.avif",
    "Add Supademos"
  ],
  [
    "Share or embed anywhere",
    "Easily embed your Showcase within onboarding, knowledge bases and more. Or share as a standard or tracking link for detailed analytics.",
    "https://supademo.com/features/showcase/showcase-6.avif",
    "Share or embed anywhere"
  ]
] as const;

const showcaseUseCases = [
  {
    title: "Modular onboarding",
    description:
      "Create structured onboarding experiences with modular showcase collections. Guide new users through your product with organized, step-by-step demos that drive activation and reduce time-to-value.",
    tags: ["User Onboarding", "Modular Content", "Activation Guides"],
    cta: "Build Onboarding",
    image: "https://supademo.com/features/showcase/showcase-1.avif",
    alt: "Modular onboarding showcases"
  },
  {
    title: "Multi-flow product tours",
    description:
      "Showcase your product's full capabilities with comprehensive multi-demo tours. Organize features by persona, use case, or workflow to create engaging, digestible product education.",
    tags: ["Product Tours", "Feature Showcases", "Persona-Based"],
    cta: "Create Tours",
    image: "https://supademo.com/features/showcase/showcase-2.avif",
    alt: "Detailed product tours"
  },
  {
    title: "Self-paced leave behinds",
    description:
      "Build comprehensive leave-behind resources with multiple related demos. Give prospects a complete view of your solution they can explore at their own pace after sales calls.",
    tags: ["Leave Behinds", "Multi-Demo Collections", "Sales Resources"],
    cta: "Start Sharing",
    image: "https://supademo.com/features/sharing/sharing-4.avif",
    alt: "Self-paced leave behinds"
  }
] as const;

const showcaseFaqs = [
  [
    "What is a Showcase collection in Supademo?",
    "A Showcase collection is a multi-demo experience that combines related Supademos into one cohesive presentation. You can organize demos into modular sections by product, feature, use case, or persona, allowing viewers to explore multiple interactive product demonstrations through a single URL or embed."
  ],
  [
    "How do I organize multiple demos in a Showcase?",
    "Creating a Showcase involves three steps: first, create modular sections to organize your content; second, search and add relevant Supademos to each section; third, share or embed anywhere. You can distribute Showcases via embedded links on websites or help centers, standard sharing links, or tracking links with detailed analytics."
  ],
  [
    "What are the best use cases for Showcase collections?",
    "Showcases are ideal for modular onboarding (structured experiences that drive activation and reduce time-to-value), multi-flow product tours (comprehensive feature showcases organized by persona or workflow), and self-paced leave-behinds (resources prospects can explore after sales calls to understand your full solution)."
  ],
  [
    "Can I track analytics across all demos in a Showcase?",
    "Yes, Supademo provides unified analytics for Showcase collections including aggregate views, engagement rates, and completion metrics across all included demos. You can also track which specific demos within the Showcase are most popular and where viewers spend the most time."
  ],
  [
    "How many demos can I include in a single Showcase?",
    "There's no limit to the number of demos you can include in a Showcase. You can organize unlimited demos across multiple sections, making Showcases perfect for comprehensive product libraries, learning academies, or extensive onboarding resources. The modular structure keeps content organized and easy to navigate."
  ]
] as const;

const showcaseTrustLogos = [
  ["Spare", "https://supademo.com/logos/spare.svg"],
  ["Jotform", "https://supademo.com/logos/jotform.svg"],
  ["Anvil", "https://supademo.com/logos/useanvil.svg"],
  ["beehiiv", "https://supademo.com/logos/beehiiv.avif"],
  ["Ledger", "https://supademo.com/logos/ledger-logo.svg"],
  ["Visma", "https://supademo.com/logos/visma.avif"],
  ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
  ["EngDB", "https://supademo.com/logos/engdb.svg"],
  ["Relevance AI", "https://supademo.com/logos/relevanceai.svg"],
  ["easy", "https://supademo.com/logos/easy.svg"],
  ["Alibaba", "https://supademo.com/logos/alibaba.avif"],
  ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
  ["Typeform", "https://supademo.com/logos/typeform.svg"],
  ["NetApp", "https://supademo.com/logos/netapp.svg"],
  ["RB2B", "https://supademo.com/logos/rb2b.svg"],
  ["Turo", "https://supademo.com/logos/turo.avif"],
  ["Concentrix", "https://supademo.com/logos/concentrix.svg"],
  ["VRIFY", "https://supademo.com/logos/vrify.svg"],
  ["Posh VIP", "https://supademo.com/logos/poshvip.svg"],
  ["Siemens", "https://supademo.com/logos/simens.svg"]
] as const;

const sharingFeatureRows = [
  {
    title: "Share Supademo as a link",
    description: "Easily share Supademo and Showcase collections over email, apps, or chat.",
    tags: ["Email Sharing", "Quick Links", "Showcase Collections"],
    cta: "Start Sharing",
    image: "https://supademo.com/images/explore-image-03.avif",
    alt: "Share Supademo as a link"
  },
  {
    title: "Share unique trackable links",
    description:
      "Create unique, trackable links and receive notifications and analytics as viewers engage and complete steps within your Supademo.",
    tags: ["Personalized Links", "Analytics", "Notifications"],
    cta: "Explore Analytics",
    image: "https://supademo.com/features/sharing/sharing-4.avif",
    alt: "Share unique trackable links"
  },
  {
    title: "Embed anywhere online",
    description:
      "Embed individual Supademos or multi-demo Showcases to support docs, websites, in-app modals, LMSes, and more with unique code snippets.",
    tags: ["Website Embeds", "Support Docs", "In-App Modals"],
    cta: "Learn About Embedding",
    image: "https://supademo.com/features/sharing/sharing-1.avif",
    alt: "Embed anywhere online"
  },
  {
    title: "Share multiple demos as a single Showcase",
    description:
      "Build comprehensive leave-behind resources with multiple related demos. Give prospects a complete view of your solution they can explore at their own pace after sales calls.",
    tags: ["Leave Behinds", "Multi-Demo Collections", "Sales Resources"],
    cta: "Learn About Showcases",
    image: "https://supademo.com/features/showcase/showcase-2.avif",
    alt: "Modular leave behinds"
  },
  {
    title: "Create personalized demos with variables",
    description:
      "Create personalized demos with variables to dynamically tailor text, links, or images for each viewer—perfect for outreach, onboarding, or sales.",
    tags: ["Dynamic Variables", "Personalization", "Custom Content"],
    cta: "Learn About Variables",
    image: "https://supademo.com/features/personalization/personalization-3.avif",
    alt: "Create personalized demos with variables"
  },
  {
    title: "Convert to step-by-step SOP guide",
    description:
      "Transform your Supademo into a vertically scrolling product guide or SOP. Copy and paste into docs, playbooks or training in seconds.",
    tags: ["SOP Generator", "Training Guides", "Documentation"],
    cta: "Try SOP Export",
    image: "https://supademo.com/features/sharing/sharing-3.avif",
    alt: "Convert to step-by-step SOP guide"
  },
  {
    title: "Password-protect interactive demos",
    description:
      "Secure your Supademo with a password so private content—like internal training, sandbox demos, or early feature previews—is only seen by the right people.",
    tags: ["Security", "Private Content", "Access Control"],
    cta: "Learn About Security",
    image: "https://supademo.com/images/sharing-password.webp",
    alt: "Password-protect interactive demos"
  },
  {
    title: "Convert to video or GIF",
    description:
      "Export your Supademo as a high-quality MP4 or looping GIF—perfect for repurposing demos across YouTube, social, email, or landing pages, no editing needed.",
    tags: ["Video Export", "GIF Export", "Repurposing"],
    cta: "Try Export",
    image: "https://supademo.com/images/sharing-video-gif.webp",
    alt: "Convert to video or GIF"
  }
] as const;

const sharingFaqs = [
  [
    "How can I share my Supademo with prospects?",
    "Supademo offers multiple sharing options: share as direct links via email or chat, embed demos on websites, help centers, in-app modals, or LMS platforms using custom code snippets, create trackable links with analytics, or bundle multiple demos into a Showcase collection. You can also export demos as MP4 videos or GIFs for social media."
  ],
  [
    "Can I password-protect my interactive demos?",
    "Yes, Supademo allows you to secure demos with password protection so private content like internal training materials, sandbox demos, or early feature previews is only accessible to authorized viewers. This is ideal for controlling access to sensitive information while still leveraging interactive demo capabilities."
  ],
  [
    "What export formats does Supademo support?",
    "Supademo supports exporting demos as high-quality MP4 videos or looping GIFs, perfect for repurposing content across YouTube, social media, email campaigns, or landing pages. You can also convert demos into vertically scrolling SOP guides that can be copied directly into documentation, playbooks, or training materials."
  ],
  [
    "How do I embed a Supademo on my website?",
    "Supademo provides multiple embed options including inline embeds, modal/lightbox embeds, and floating widgets. Simply copy the embed code from your demo's share settings and paste it into your website's HTML. You can customize the embed size, autoplay settings, and trigger behavior to match your site's design."
  ],
  [
    "What are trackable links and how do they work?",
    "Trackable links are unique URLs that capture viewer engagement data including who viewed your demo, how long they watched, which steps they completed, and where they dropped off. You receive real-time notifications when prospects engage, enabling timely and personalized follow-up based on their demonstrated interest."
  ]
] as const;

function GuidedHtmlHeroCanvas() {
  return (
    <div
      className="guided-html-hero-canvas"
      aria-label="Interactive product demo preview"
      role="img"
    >
      <div className="guided-html-canvas-browser" aria-hidden="true">
        <div className="guided-html-canvas-toolbar">
          <span className="guided-html-canvas-dot" />
          <span className="guided-html-canvas-dot" />
          <span className="guided-html-canvas-dot" />
          <span className="guided-html-canvas-url" />
          <span className="guided-html-canvas-pill" />
        </div>
        <div className="guided-html-canvas-body">
          <aside className="guided-html-canvas-sidebar">
            <strong>ACME</strong>
            <span className="is-active">Dashboard</span>
            <span>Insights</span>
            <span>Transactions</span>
            <span>Activities</span>
            <span>Settings</span>
          </aside>
          <div className="guided-html-canvas-content">
            <div className="guided-html-canvas-heading">
              <span>Welcome Back</span>
              <b>+ Add Funds</b>
            </div>
            <div className="guided-html-canvas-stat-grid">
              <span>$368,200</span>
              <span>$115,367.36</span>
              <span>$200,134</span>
            </div>
            <div className="guided-html-canvas-chart">
              <span className="guided-html-chart-line" />
              <span className="guided-html-chart-line is-second" />
              <span className="guided-html-chart-axis" />
            </div>
          </div>
          <div className="guided-html-canvas-tooltip">
            <strong>Hello there 👋</strong>
            <p>Welcome to an interactive tutorial of setting up new training sources.</p>
            <span>
              Click the hotspots or the next/previous buttons to proceed at your own pace.
            </span>
            <div className="guided-html-canvas-tooltip-actions" aria-hidden="true">
              <i>←</i>
              <i>→</i>
            </div>
          </div>
          <div className="guided-html-canvas-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function GuidedHtmlFeaturePage() {
  return (
    <main className="guided-html-page" id="main">
      <MarketingHeader />

      <section className="guided-html-hero" aria-labelledby="guided-html-title">
        <div className="guided-html-hero-blob guided-html-hero-blob-left" aria-hidden="true" />
        <div className="guided-html-hero-blob guided-html-hero-blob-right" aria-hidden="true" />
        <div className="guided-html-hero-inner">
          <div className="guided-html-hero-copy">
            <h1 id="guided-html-title">Create pixel-perfect HTML interactive demos</h1>
            <p>
              Clone and share your product in fully interactive, browser-based product experiences
              that feel like using the real interface.
            </p>
            <div className="guided-html-actions">
              <a className="marketing-button" href="/signup">
                Create your first Supademo <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <GuidedHtmlHeroCanvas />
        </div>
      </section>

      <section className="guided-html-feature-trio" aria-labelledby="guided-html-feature-title">
        <div className="guided-html-section-heading">
          <h2 id="guided-html-feature-title">Powerful features to scale demo creation</h2>
        </div>
        <div className="guided-html-feature-grid">
          {guidedHtmlFeatureCards.map((card) => (
            <article className={`guided-html-feature-card ${card.className}`} key={card.title}>
              <div className="guided-html-feature-media">
                <img src={card.image} alt={card.alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <a className="guided-html-centered-cta" href="/signup">
          Get started <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="guided-html-demo-stage" aria-label="Guided HTML demo preview">
        <div className="guided-html-demo-stage-glow" aria-hidden="true" />
      </section>

      <section
        className="guided-html-capability-section"
        aria-label="Guided HTML demo capabilities"
      >
        <div className="guided-html-capability-list">
          {guidedHtmlRows.map((row, index) => (
            <article
              className={`guided-html-capability-row ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={row.title}
            >
              <div className="guided-html-capability-media">
                <img src={row.image} alt={row.alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <div className="guided-html-capability-copy">
                <h2>{row.title}</h2>
                <p>{row.description}</p>
                <div className="guided-html-tag-list" aria-label={`${row.title} benefits`}>
                  {row.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a className="guided-html-row-cta" href="/signup">
                  {row.cta} <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="guided-html-use-case-section"
        aria-labelledby="guided-html-use-case-title"
      >
        <div className="guided-html-use-case-inner">
          <h2 id="guided-html-use-case-title">
            Powerful uses cases for every team at your company
          </h2>
          <nav className="guided-html-use-case-tabs" aria-label="Guided HTML demo use cases">
            {guidedHtmlUseCases.map((useCase, index) => (
              <a
                className={index === 0 ? "is-active" : undefined}
                href={`#guided-case-${index}`}
                key={useCase.label}
              >
                {useCase.label}
              </a>
            ))}
          </nav>
          <div className="guided-html-use-case-panels">
            {guidedHtmlUseCases.map((useCase, index) => (
              <article
                id={`guided-case-${index}`}
                className="guided-html-use-case-panel"
                key={useCase.label}
              >
                <div className="guided-html-use-case-copy">
                  <h3>{useCase.title}</h3>
                  <p>{useCase.description}</p>
                  <a href="/signup">
                    Supademo for {useCase.label} <span aria-hidden="true">→</span>
                  </a>
                </div>
                <div className="guided-html-use-case-media">
                  <img
                    src={useCase.image}
                    alt={`${useCase.label} interactive demo`}
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="guided-html-explore" aria-labelledby="guided-html-explore-title">
        <div className="guided-html-explore-inner">
          <h2 id="guided-html-explore-title">Explore More Features</h2>
          <div className="guided-html-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="guided-html-explore-links">
                  {links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="guided-html-faq-section" aria-labelledby="guided-html-faq-title">
        <div className="guided-html-faq-inner">
          <div className="guided-html-faq-intro">
            <h2 id="guided-html-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="guided-html-faq-list">
            {guidedHtmlFaqs.map((faq, index) => (
              <details open={index === 0} key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

function SandboxTrustRail() {
  return <ShowcaseTrustRail className="showcase-trust sandbox-trust-rail" />;
}

function SandboxFeaturePage() {
  return (
    <main className="sandbox-page" id="main">
      <MarketingHeader />

      <section className="sandbox-hero" aria-labelledby="sandbox-title">
        <div className="sandbox-hero-inner">
          <div className="sandbox-hero-copy">
            <h1 id="sandbox-title">
              Build elegant sandbox
              <br />
              demos with no code
            </h1>
            <p>
              Transform your sales process with pixel-perfect demo environments—without engineering
              support, staging environments, or maintenance headaches.
            </p>
            <div className="sandbox-actions">
              <a className="marketing-button" href="/signup">
                Create your first Supademo <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <div className="sandbox-hero-art" role="img" aria-label="Sandbox product demo preview">
            <div className="sandbox-browser-frame">
              <div className="sandbox-browser-bar" aria-hidden="true">
                <span />
                <span />
                <span />
                <div>sandbox.supademo.com</div>
              </div>
              <img
                src="https://supademo.com/images/hero-sandbox-demos.avif"
                alt="Interactive sandbox demo preview"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      <SandboxTrustRail />

      <section className="sandbox-feature-trio" aria-labelledby="sandbox-feature-title">
        <div className="sandbox-section-heading">
          <h2 id="sandbox-feature-title">Build elegant sandbox demos with no code</h2>
        </div>
        <div className="sandbox-feature-grid">
          {sandboxFeatureCards.map((card) => (
            <article className="sandbox-feature-card" key={card.title}>
              <div className="sandbox-feature-media">
                <img src={card.image} alt={card.alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <a className="sandbox-centered-cta" href="/signup">
          Create your first Supademo <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="sandbox-engineering" aria-labelledby="sandbox-engineering-title">
        <div className="sandbox-section-heading">
          <h2 id="sandbox-engineering-title">Eliminate engineering bottlenecks</h2>
          <p>
            Build pixel-perfect sandbox demonstrations with HTML and CSS cloning. No staging
            environments, dev tickets, or maintenance required.
          </p>
        </div>
        <div className="sandbox-capability-grid">
          {sandboxCapabilityCards.map(([title, description, icon]) => (
            <article className="sandbox-capability-card" key={title}>
              <span className="sandbox-capability-icon" aria-hidden="true">
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sandbox-use-cases" aria-labelledby="sandbox-use-cases-title">
        <div className="sandbox-section-heading">
          <h2 id="sandbox-use-cases-title">Perfect for every stage of your sales process</h2>
          <p>
            From live demonstrations to partner enablement, sandbox demos provide the interactive
            experiences your prospects need to understand your product value.
          </p>
        </div>
        <div className="sandbox-use-case-grid">
          {sandboxUseCases.map(([title, description]) => (
            <article className="sandbox-use-case-card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sandbox-scale" aria-labelledby="sandbox-scale-title">
        <div className="sandbox-section-heading">
          <h2 id="sandbox-scale-title">Scale how your team demonstrates products</h2>
          <p>
            Drive conversions by personalizing your product demo with dynamic variables, conditional
            branching, custom branding and demo chapters.
          </p>
        </div>
        <SandboxScaleCarousel />
      </section>

      <section className="sandbox-explore" aria-labelledby="sandbox-explore-title">
        <div className="sandbox-explore-inner">
          <h2 id="sandbox-explore-title">Explore More Features</h2>
          <div className="sandbox-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="sandbox-explore-links">
                  {links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sandbox-demo-stage" aria-label="Live sandbox demo preview">
        <div className="sandbox-demo-stage-browser">
          <div className="sandbox-demo-stage-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <div>Ahrefs Example Sandbox Demo</div>
          </div>
          <img
            src="https://supademo.com/images/hero-sandbox-demos.avif"
            alt="Sandbox demo example"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section className="sandbox-faq" aria-labelledby="sandbox-faq-title">
        <div className="sandbox-faq-intro">
          <h2 id="sandbox-faq-title">FAQs</h2>
          <p>
            Commonly asked questions about Supademo. Have other questions? Reach out and our team
            will be happy to help.
          </p>
          <img
            src="https://supademo.com/images/faq-section-illustration.avif"
            alt="FAQ illustration"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="sandbox-faq-list">
          {sandboxFaqs.map(([question, answer], index) => (
            <details open={index === 0} key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="sandbox-testimonial" aria-label="Customer testimonial">
        <div className="sandbox-testimonial-card">
          <div className="sandbox-testimonial-company">
            <img
              src="https://supademo.com/logos/easy.svg"
              alt="Easy logo"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span>easy</span>
          </div>
          <blockquote>
            “Supademo has been a huge asset across multiple departments and workflows across easy.
            We use Supademo across multiple departments, which cover all of our software solutions.”
          </blockquote>
          <div className="sandbox-testimonial-person">
            <img
              src="https://supademo.com/headshots/felix-headshot.avif"
              alt="Felix True"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span>
              <strong>Felix True</strong>
              <small>Head of Presales</small>
            </span>
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

function FigmaFeaturePage() {
  return (
    <main className="figma-page" id="main">
      <MarketingHeader />

      <section className="figma-hero" aria-labelledby="figma-title">
        <div className="figma-hero-inner">
          <div className="figma-hero-copy">
            <h1 id="figma-title">Create guided walkthroughs to elevate Figma prototypes</h1>
            <p>
              Add smooth animations, AI voiceovers, CTAs, embedded forms, viewer analytics, and more
              - directly into your Figma designs for free!
            </p>
            <div className="figma-hero-actions">
              <a
                className="marketing-button"
                href="https://www.figma.com/community/plugin/1382781944686485388/supademo-create-interactive-prototypes-from-figma"
              >
                Install Figma plugin <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <div className="figma-hero-art" role="img" aria-label="Figma plugin interface">
            <img
              src="https://supademo.com/images/recorder-figma.webp"
              alt="Figma plugin interface"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <section className="figma-demo-stage" aria-label="Interactive Figma demo">
        <div className="figma-demo-frame">
          <iframe
            title="Interactive Supademo"
            src="https://app.supademo.com/embed/clx9ee14906s31xfwqhk5addw"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </section>

      <section className="figma-how" aria-labelledby="figma-how-title">
        <div className="figma-how-heading">
          <h2 id="figma-how-title">The easiest way to make Figma walkthroughs</h2>
        </div>
        <div className="figma-how-grid">
          {figmaHowCards.map((card) => (
            <article className="figma-how-card" key={card.title}>
              <div className="figma-how-media">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <a
          className="marketing-button figma-how-cta"
          href="https://www.figma.com/community/plugin/1382781944686485388/supademo-create-interactive-prototypes-from-figma"
        >
          Install Figma plugin <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="figma-feature-rows" aria-label="Figma prototype capabilities">
        <div className="figma-feature-rows-inner">
          {figmaFeatureRows.map((row, index) => (
            <section
              className={`figma-feature-row${index % 2 === 1 ? " is-reversed" : ""}`}
              key={row.title}
            >
              <article className="figma-feature-card">
                <div className="figma-feature-media">
                  <img src={row.image} alt={row.alt} loading="lazy" referrerPolicy="no-referrer" />
                </div>
                <div className="figma-feature-copy">
                  <h2>{row.title}</h2>
                  <p>{row.description}</p>
                  <div className="figma-feature-tags" aria-label={`${row.title} capabilities`}>
                    {row.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <a className="figma-feature-cta" href={row.href}>
                    {row.cta} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            </section>
          ))}
        </div>
      </section>

      <section className="figma-explore" aria-labelledby="figma-explore-title">
        <div className="figma-explore-inner">
          <h2 id="figma-explore-title">Explore More Features</h2>
          <div className="figma-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="figma-explore-links">
                  {links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseTrustRail className="showcase-trust figma-trust" logos={figmaTrustLogos} />

      <section className="showcase-faq figma-faq" aria-labelledby="figma-faq-title">
        <div className="showcase-faq-inner">
          <div className="showcase-faq-intro">
            <h2 id="figma-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="showcase-faq-list">
            {figmaFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

function RouteHubFeaturePage() {
  return (
    <main className="route-hub-page" id="main">
      <MarketingHeader />

      <section className="route-hub-hero" aria-labelledby="route-hub-title">
        <div className="route-hub-hero-inner">
          <div className="route-hub-hero-copy">
            <span className="route-hub-hero-badge">RouteHub</span>
            <h1 id="route-hub-title">Route every viewer to the right content automatically</h1>
            <p>
              Let viewers self-select what matters. RouteHub instantly delivers the right
              interactive demos, content, and answers based on each viewer&apos;s role, goals, or
              use case.
            </p>
            <div className="route-hub-hero-actions">
              <a className="marketing-button" href="/signup">
                Get started free <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="#product-tour">
                Try product tour
              </a>
            </div>
          </div>
          <div className="route-hub-hero-art" role="img" aria-label="RouteHub product preview">
            <iframe
              title="Route every viewer to the right content automatically interactive demo"
              src="https://app.supademo.com/route/cmnyr9ytw00ahwm0j41w2gz85"
              loading="eager"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </section>

      <section className="route-hub-roi" aria-labelledby="route-hub-roi-title">
        <div className="route-hub-roi-heading">
          <h2 id="route-hub-roi-title">
            How much revenue could <span>RouteHub</span> close for you?
          </h2>
        </div>
        <RouteHubCalculator />
      </section>

      <section className="route-hub-feature-sections" aria-label="RouteHub capabilities">
        {routeHubFeatureRows.map((row, index) => (
          <article
            className={`route-hub-feature-row ${index % 2 === 1 ? "is-reversed" : ""}`}
            key={row.title}
          >
            <div className="route-hub-feature-copy">
              <p className="route-hub-eyebrow">RouteHub</p>
              <h2>{row.title}</h2>
              <p>{row.description}</p>
              <p className="route-hub-feature-subcopy">{row.subcopy}</p>
              <a className="route-hub-feature-cta" href="/signup">
                {row.cta} <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="route-hub-feature-media">
              <img src={row.image} alt={row.alt} loading="lazy" referrerPolicy="no-referrer" />
            </div>
          </article>
        ))}
      </section>

      <section
        className="route-hub-demo-stage"
        id="product-tour"
        aria-labelledby="route-hub-demo-title"
      >
        <div className="route-hub-demo-heading">
          <p className="route-hub-eyebrow">Try it yourself</p>
          <h2 id="route-hub-demo-title">Experience RouteHub interactively</h2>
          <p>
            Click through an interactive tour to see how RouteHub personalizes content delivery for
            every viewer.
          </p>
        </div>
        <div className="route-hub-demo-browser">
          <div className="route-hub-browser-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <div>RouteHub interactive tour</div>
          </div>
          <img
            src="https://supademo.com/images/hero-route-hub.avif"
            alt="RouteHub interactive tour"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <a className="route-hub-demo-overlay" href="/signup">
            <span aria-hidden="true">▶</span> Try product demo
          </a>
        </div>
      </section>

      <section className="route-hub-explore" aria-labelledby="route-hub-explore-title">
        <h2 id="route-hub-explore-title">Explore More Features</h2>
        <div className="route-hub-explore-grid">
          {sandboxExploreColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              <div className="route-hub-explore-links">
                {links.map(([label, href]) => (
                  <a href={href} key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="route-hub-faq" aria-labelledby="route-hub-faq-title">
        <div className="route-hub-faq-intro">
          <p className="route-hub-eyebrow">Need to know</p>
          <h2 id="route-hub-faq-title">FAQs</h2>
          <p>
            Commonly asked questions about route every viewer to the right content automatically.
            Have other questions? Reach out and our team will be happy to help.
          </p>
          <img
            src="https://supademo.com/images/faq-section-illustration.avif"
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="route-hub-faq-list">
          {routeHubFaqs.map(([question, answer], index) => (
            <details open={index === 0} key={question}>
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

function DemoHubTrustRail() {
  return (
    <section className="demo-hub-trust" aria-labelledby="demo-hub-trust-title">
      <div className="demo-hub-trust-inner">
        <div className="demo-hub-trust-copy">
          <h2 id="demo-hub-trust-title">
            Trusted by 200,000+ top operators and 3,000+ paying organizations
          </h2>
          <div className="demo-hub-trust-awards" aria-label="Supademo awards">
            <img
              src="https://supademo.com/images/supademo-rating-03.webp"
              alt="Supademo Top 100 and Top 50 awards"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <img
              src="https://supademo.com/images/supademo-rating-02.webp"
              alt="Supademo leader and momentum awards"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="demo-hub-trust-selector" aria-label="Companies that trust Supademo">
          <span>Explore</span>
          <details>
            <summary>
              Healthcare <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <a href="#demo-hub-trust-logos">Healthcare</a>
              <a href="#demo-hub-trust-logos">Software</a>
              <a href="#demo-hub-trust-logos">Finance</a>
            </div>
          </details>
          <span>companies that trust Supademo</span>
        </div>
        <div className="demo-hub-trust-logos" id="demo-hub-trust-logos">
          {demoHubTrustLogos.map(([label, image]) => (
            <img
              key={label}
              src={image}
              alt={`${label} logo`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoHubFeaturePage() {
  return (
    <main className="demo-hub-page" id="main">
      <MarketingHeader />

      <section className="demo-hub-hero" aria-labelledby="demo-hub-title">
        <div className="demo-hub-hero-dots" aria-hidden="true" />
        <div className="demo-hub-hero-inner">
          <div className="demo-hub-hero-copy">
            <a className="demo-hub-hero-badge" href="#examples">
              In-App Demo Hub
            </a>
            <h1 id="demo-hub-title">
              In-app product tours that
              <br />
              your users won&apos;t dismiss
            </h1>
            <p>
              Replace disruptive product tours with engaging Demo Hubs. Unlimited tours, unlimited
              viewers, instant setup. In your app, on your website, and in your docs.
            </p>
            <div className="demo-hub-hero-actions">
              <a className="marketing-button" href="/signup">
                Get started free <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="#examples">
                Explore example demo hubs
              </a>
            </div>
          </div>
          <div className="demo-hub-hero-media" aria-label="Interactive Demo Hub preview" role="img">
            <img
              src="/demo-hub-hero.jpg"
              alt="Interactive Demo Hub invoice walkthrough"
              loading="eager"
            />
          </div>
        </div>

        <section
          className="demo-hub-examples"
          id="examples"
          aria-labelledby="demo-hub-examples-title"
        >
          <div className="demo-hub-examples-inner">
            <div className="demo-hub-examples-heading">
              <img
                src="https://supademo.com/images/try-live-examples.svg"
                alt="Try live examples"
              />
            </div>
            <h2 id="demo-hub-examples-title" className="sr-only">
              Try live examples
            </h2>
            <div className="demo-hub-example-grid">
              {demoHubExamples.map(([label, image, description]) => (
                <a className="demo-hub-example-card" href="/signup" key={label}>
                  <img
                    src={image}
                    alt={`${label} logo`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span>{description}</span>
                  <b aria-hidden="true">→</b>
                </a>
              ))}
            </div>
            <div className="demo-hub-example-tags" aria-label="Demo Hub formats">
              <span>▣ In-app product demos &amp; tours</span>
              <span>▤ Enablement demos on websites</span>
              <span>◉ Onboarding kits on support docs</span>
            </div>
          </div>
        </section>
      </section>

      <DemoHubTrustRail />

      <section className="demo-hub-comparison" aria-labelledby="demo-hub-comparison-title">
        <div className="demo-hub-section-heading">
          <h2 id="demo-hub-comparison-title">Traditional in-app product tours are broken</h2>
          <p>
            Stop the skip-fest: replace interruptive in-app product tours with a contextual demo hub
            that users open when they&apos;re ready.
          </p>
        </div>
        <div className="demo-hub-comparison-labels" aria-hidden="true">
          <h3>
            <span>⌁</span> Traditional Product Tours
          </h3>
          <h3>
            <span>✓</span> In-App Demo Hub
          </h3>
        </div>
        <div className="demo-hub-comparison-grid">
          {demoHubComparison.flatMap(([traditional, hub], index) => [
            <article
              className="demo-hub-comparison-card is-traditional"
              key={`traditional-${index}`}
            >
              <h4>{traditional[0]}</h4>
              <p>{traditional[1]}</p>
            </article>,
            <article className="demo-hub-comparison-card is-hub" key={`hub-${index}`}>
              <h4>{hub[0]}</h4>
              <p>{hub[1]}</p>
            </article>
          ])}
        </div>
        <a className="demo-hub-example-cta" href="#demo-hub-tour">
          Open example Demo Hub
        </a>
      </section>

      <section
        className="demo-hub-guidance"
        id="demo-hub-tour"
        aria-labelledby="demo-hub-guidance-title"
      >
        <div className="demo-hub-section-heading">
          <h2 id="demo-hub-guidance-title">
            Easy, contextual guidance across apps, websites or docs
          </h2>
        </div>
        <div className="demo-hub-guide-steps">
          {demoHubGuideSteps.map(([title, description, icon]) => (
            <article key={title}>
              <span className="demo-hub-guide-icon" aria-hidden="true">
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div className="demo-hub-tour-preview">
          <img src="/demo-hub-hero.jpg" alt="Website sales enablement Demo Hub" loading="lazy" />
          <a className="demo-hub-tour-overlay" href="/signup">
            <span aria-hidden="true">▶</span> Try product demo
          </a>
        </div>
      </section>

      <section className="demo-hub-explore" aria-labelledby="demo-hub-explore-title">
        <h2 id="demo-hub-explore-title">Explore More Features</h2>
        <div className="demo-hub-explore-grid">
          {sandboxExploreColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              <div className="demo-hub-explore-links">
                {links.map(([label, href]) => (
                  <a href={href} key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="demo-hub-faq" aria-labelledby="demo-hub-faq-title">
        <div className="demo-hub-faq-inner">
          <div className="demo-hub-faq-intro">
            <h2 id="demo-hub-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="demo-hub-faq-list">
            {demoHubFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
      <a className="demo-hub-launcher" href="#examples" aria-label="Try live examples">
        <span aria-hidden="true">Try it ↘</span>
        <b aria-hidden="true">S</b>
      </a>
    </main>
  );
}

function SharingFeaturePage() {
  return (
    <main className="sharing-page" id="main">
      <MarketingHeader variant="sharing" />

      <section className="sharing-hero" aria-labelledby="sharing-title">
        <div className="sharing-hero-glow sharing-hero-glow-left" aria-hidden="true" />
        <div className="sharing-hero-glow sharing-hero-glow-right" aria-hidden="true" />
        <div className="sharing-hero-inner">
          <div className="sharing-hero-copy">
            <h1 id="sharing-title">Share your interactive demos anywhere</h1>
            <p>
              Whether you want to email Supademo to a prospect, embed in your help center, or share
              an onboarding playbook, we&apos;ve got you covered.
            </p>
            <div className="sharing-hero-actions">
              <a className="marketing-button" href="/signup">
                <span className="sharing-hero-label">Create your first Supademo</span>
                <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                <span className="sharing-hero-label">Request a demo</span>
              </a>
            </div>
          </div>
          <div className="sharing-hero-art" role="img" aria-label="Supademo sharing interface">
            <img
              src="https://supademo.com/features/sharing/sharing-hero-min.avif"
              alt="Supademo sharing interface"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <section className="sharing-feature-band" aria-label="Supademo sharing features">
        <div className="sharing-feature-list">
          {sharingFeatureRows.map((row, index) => (
            <article
              className={`sharing-feature-row ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={row.title}
            >
              <div className="sharing-feature-card">
                <div className="sharing-feature-media">
                  <img src={row.image} alt={row.alt} loading="lazy" referrerPolicy="no-referrer" />
                </div>
                <div className="sharing-feature-copy">
                  <h2>{row.title}</h2>
                  <p>{row.description}</p>
                  <div className="sharing-tag-list" aria-label={`${row.title} benefits`}>
                    {row.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <a className="sharing-row-cta" href="/signup">
                    {row.cta} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sharing-explore" aria-labelledby="sharing-explore-title">
        <div className="sharing-explore-panel">
          <h2 id="sharing-explore-title">Explore More Features</h2>
          <div className="sharing-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => {
              const categoryHref =
                title === "Demo Recorder"
                  ? "/features/demo-recorder"
                  : title === "Demo Editor"
                    ? "/features/demo-editor"
                    : title === "Sharing"
                      ? "/features/sharing"
                      : "/ai";
              return (
                <div key={title}>
                  <a className="sharing-explore-category" href={categoryHref}>
                    <span>{title}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                  <div className="sharing-explore-links">
                    {links.map(([label, href]) => (
                      <a href={href} key={label}>
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sharing-faq" aria-labelledby="sharing-faq-title">
        <div className="sharing-faq-inner">
          <div className="sharing-faq-intro">
            <h2 id="sharing-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="sharing-faq-list">
            {sharingFaqs.map(([question, answer], index) => (
              <details className="sharing-faq-item" open={index === 0} key={question}>
                <summary>
                  <span className="sharing-faq-question">{question}</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseTrustRail />
      <MarketingFooter variant="showcase" />
    </main>
  );
}

function ShowcaseTrustRail({
  className = "showcase-trust",
  logos = showcaseTrustLogos
}: {
  className?: string;
  logos?: readonly (readonly [string, string])[];
}) {
  return (
    <section className={className} aria-labelledby="showcase-trust-title">
      <div className="showcase-trust-heading">
        <h2 id="showcase-trust-title">
          Trusted by 200,000+ top operators and 3,000+ paying organizations
        </h2>
        <div className="showcase-trust-awards" aria-label="Supademo awards">
          <img
            src="https://supademo.com/images/supademo-rating-03.webp"
            alt="G2 and Google awards"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <img
            src="https://supademo.com/images/supademo-rating-02.webp"
            alt="G2 and Google ratings"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      <div className="showcase-trust-chooser" aria-label="Featured companies that trust Supademo">
        <span>Explore</span>
        <details>
          <summary>Featured</summary>
          <div>
            <a href="#showcase-trust-logos">Featured</a>
            <a href="#showcase-trust-logos">Software</a>
            <a href="#showcase-trust-logos">Finance</a>
          </div>
        </details>
        <span>companies that trust Supademo</span>
      </div>
      <div className="showcase-trust-logos" id="showcase-trust-logos">
        {logos.map(([label, image]) => (
          <img
            key={label}
            src={image}
            alt={`${label} Logo`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
    </section>
  );
}

function ShowcaseFeaturePage() {
  return (
    <main className="showcase-page" id="main">
      <MarketingHeader />

      <section className="showcase-hero" aria-labelledby="showcase-title">
        <div className="showcase-hero-dots" aria-hidden="true" />
        <div className="showcase-hero-inner">
          <div className="showcase-hero-copy">
            <a className="showcase-hero-badge" href="#showcase-embed">
              Showcase Collection
            </a>
            <h1 id="showcase-title">Share multiple interactive demos in one showcase</h1>
            <p>
              Showcase collections enable you to combine and share related Supademos into a
              cohesive, multi-demo experience.
            </p>
            <div className="showcase-hero-actions">
              <a className="marketing-button" href="/signup">
                Get started free <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="#showcase-embed">
                Explore example showcase
              </a>
            </div>
          </div>
          <div
            id="showcase-embed"
            className="showcase-hero-embed"
            aria-label="Interactive showcase preview"
          >
            <iframe
              title="Interactive showcase preview"
              src="https://strava.supademo.com/showcase/embed/clkwvaf1k2j3szg8xvfy0vr3e?embed_v=2&utm_source=embed"
              loading="eager"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </section>

      <ShowcaseTrustRail />

      <section className="showcase-intro" aria-labelledby="showcase-intro-title">
        <div className="showcase-section-heading">
          <h2 id="showcase-intro-title">Intuitive, multi-demo Showcases in minutes</h2>
        </div>
        <div className="showcase-step-grid">
          {showcaseFeatureSteps.map(([title, description, image, alt]) => (
            <article className="showcase-step-card" key={title}>
              <div className="showcase-step-media">
                <img src={image} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <a className="showcase-centered-cta" href="/signup">
          Create your first Showcase <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="showcase-use-cases" aria-label="Showcase collection examples">
        <div className="showcase-use-case-list">
          {showcaseUseCases.map((useCase, index) => (
            <article
              className={`showcase-use-case-row ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={useCase.title}
            >
              <div className="showcase-collection-media">
                <img
                  src={useCase.image}
                  alt={useCase.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="showcase-collection-copy">
                <h2>{useCase.title}</h2>
                <p>{useCase.description}</p>
                <div className="showcase-tag-list" aria-label={`${useCase.title} benefits`}>
                  {useCase.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a className="showcase-row-cta" href="/signup">
                  {useCase.cta} <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-use-case-section" aria-labelledby="showcase-use-case-title">
        <div className="showcase-use-case-inner">
          <h2 id="showcase-use-case-title">Powerful uses cases for every team at your company</h2>
          <ShowcaseUseCaseTabs />
        </div>
      </section>

      <section className="showcase-explore" aria-labelledby="showcase-explore-title">
        <h2 id="showcase-explore-title">Explore More Features</h2>
        <div className="showcase-explore-grid">
          {sandboxExploreColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              <div className="showcase-explore-links">
                {links.map(([label, href]) => (
                  <a href={href} key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="showcase-faq" aria-labelledby="showcase-faq-title">
        <div className="showcase-faq-inner">
          <div className="showcase-faq-intro">
            <h2 id="showcase-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="showcase-faq-list">
            {showcaseFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

function AnalyticsFeaturePage() {
  return (
    <main className="analytics-page" id="main">
      <MarketingHeader />

      <section className="analytics-hero" aria-labelledby="analytics-title">
        <div className="analytics-hero-inner">
          <div className="analytics-hero-copy">
            <h1 id="analytics-title">Identify your most promising prospects</h1>
            <p>
              Evaluate and improve the performance of your Supademo by tracking viewers, engagement,
              and completion rates and more.
            </p>
            <div className="analytics-hero-actions">
              <a className="marketing-button" href="/signup">
                Create your first Supademo <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <div className="analytics-hero-art" role="img" aria-label="Supademo analytics dashboard">
            <img
              src="https://supademo.com/features/analytics/analytics-4.avif"
              alt="Supademo analytics dashboard"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <section className="analytics-feature-band" aria-label="Analytics capabilities">
        <div className="analytics-feature-list">
          {analyticsFeatureRows.map((row, index) => (
            <article
              className={`analytics-feature-card ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={row.title}
            >
              <div className="analytics-feature-copy">
                <h2>{row.title}</h2>
                <p>{row.description}</p>
                <div className="analytics-tag-list" aria-label={`${row.title} benefits`}>
                  {row.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a className="analytics-row-cta" href="/signup">
                  {row.cta} <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="analytics-feature-media">
                <img src={row.image} alt={row.alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analytics-use-cases" aria-labelledby="analytics-use-cases-title">
        <div className="analytics-use-cases-inner">
          <h2 id="analytics-use-cases-title">Powerful uses cases for every team at your company</h2>
          <AnalyticsUseCaseTabs />
        </div>
      </section>

      <section className="analytics-explore" aria-labelledby="analytics-explore-title">
        <h2 id="analytics-explore-title">Explore More Features</h2>
        <div className="analytics-explore-grid">
          {sandboxExploreColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              <div className="analytics-explore-links">
                {links.map(([label, href]) => (
                  <a href={href} key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-faq" aria-labelledby="analytics-faq-title">
        <div className="analytics-faq-inner">
          <div className="analytics-faq-intro">
            <h2 id="analytics-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="analytics-faq-list">
            {analyticsFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

function ReferenceFeatureDetailPage({ slug, detail }: { slug: string; detail: FeatureDetail }) {
  const isEditor = slug === "demo-editor";
  const rows = isEditor ? referenceDemoEditorRows : referencePersonalizationRows;
  const faqs = isEditor ? referenceDemoEditorFaqs : referencePersonalizationFaqs;
  const primaryCta = { label: "Create your first Supademo", href: "/signup" };

  return (
    <>
      <main className={`reference-feature-page reference-feature-${slug}`} id="main">
        <MarketingHeader />

        <section
          className="feature-detail-hero reference-feature-hero"
          aria-labelledby="feature-detail-title"
        >
          <div className="feature-detail-hero-copy">
            <p className="feature-detail-eyebrow">{detail.label}</p>
            <p className="feature-detail-breadcrumb">Supademo / Features / {detail.label}</p>
            <h1 id="feature-detail-title">
              {detail.title === "Improve engagement with personalized demos" ? (
                <>
                  Improve engagement
                  <br />
                  with personalized demos
                </>
              ) : (
                detail.title
              )}
            </h1>
            <p>{detail.description}</p>
            <div className="marketing-hero-actions">
              <a className="marketing-button" href={primaryCta.href}>
                {primaryCta.label}
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <FeaturePreview detail={detail} />
        </section>

        <section className="reference-feature-primary" aria-label={`${detail.label} capabilities`}>
          <div className="reference-feature-primary-inner">
            {rows.map((row, index) => (
              <article
                className={`reference-feature-row ${index % 2 === 1 ? "is-reversed" : ""}`}
                key={row.title}
              >
                <div className="reference-feature-row-media">
                  <img
                    src={row.image}
                    alt={row.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="reference-feature-row-copy">
                  <p className="feature-detail-eyebrow">0{index + 1}</p>
                  <h2>{row.title}</h2>
                  <p>{row.description}</p>
                  <a className="marketing-text-action" href="/signup">
                    {row.cta} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {isEditor ? (
          <section className="reference-feature-capabilities" aria-label="Demo editor capabilities">
            <div className="reference-feature-capabilities-inner">
              {referenceDemoCapabilities.map(([title, description], index) => (
                <article className="reference-feature-capability-card" key={title}>
                  <span>0{index + 1}</span>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="showcase-use-case-section reference-feature-use-cases"
          aria-labelledby="reference-feature-use-cases-title"
        >
          <div className="showcase-use-case-inner">
            <h2 id="reference-feature-use-cases-title">
              Powerful uses cases for every team at your company
            </h2>
            <ShowcaseUseCaseTabs />
          </div>
        </section>

        <div
          className="showcase-explore reference-feature-explore"
          aria-labelledby="reference-feature-explore-title"
        >
          <h2 id="reference-feature-explore-title">Explore More Features</h2>
          <div className="showcase-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="showcase-explore-links">
                  {links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section
          className="showcase-faq reference-feature-faq"
          aria-labelledby="reference-feature-faq-title"
        >
          <div className="showcase-faq-inner">
            <div className="showcase-faq-intro">
              <h2 id="reference-feature-faq-title">FAQs</h2>
              <p>
                Commonly asked questions about Supademo. Have other questions? Reach out and our
                team will be happy to help.
              </p>
              <img
                src="https://supademo.com/images/faq-section-illustration.avif"
                alt="FAQ illustration"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="showcase-faq-list">
              {faqs.map(([question, answer], index) => (
                <details open={index === 0} key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <ShowcaseTrustRail />
      </main>
      <MarketingFooter variant="showcase" />
    </>
  );
}

export function getFeatureDetail(slug: string): FeatureDetail | null {
  const detail = featureDetails[slug];
  return detail ? { ...detail, heroImage: detail.heroImage ?? featureHeroImages[slug] } : null;
}

export function getFeatureDetailMetadata(slug: string) {
  const detail = getFeatureDetail(slug);
  if (slug === "sharing") {
    return {
      title: "Share, Embed, Export Your Product Demos | Supademo",
      description:
        "Whether you want to email Supademo to a prospect, embed in your help center, or share an onboarding playbook, we've got you covered."
    };
  }
  return detail
    ? { title: `${detail.title} | Supademo`, description: detail.description }
    : { title: "Supademo features", description: "Interactive product demo features." };
}

function FeaturePreview({ detail }: { detail: FeatureDetail }) {
  return (
    <div
      className={`feature-detail-preview feature-detail-preview-${detail.accent}${detail.heroImage ? " feature-detail-preview-has-image" : ""}`}
      role="img"
      aria-label={`${detail.label} product preview`}
    >
      <div className="feature-detail-preview-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>{detail.label}</strong>
      </div>
      {detail.heroImage ? (
        <div className="feature-detail-preview-media" aria-hidden="true">
          <img
            className="feature-detail-preview-image"
            src={detail.heroImage}
            alt=""
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
      {!detail.heroImage ? (
        <div className="feature-detail-preview-body">
          <aside>
            <i />
            <i />
            <i />
            <i />
          </aside>
          <section>
            <small>SUPADEMO / WORKSPACE</small>
            <h2>{detail.outcome}</h2>
            <div className="feature-detail-preview-lines">
              <span />
              <span />
              <span />
            </div>
            <div className="feature-detail-preview-card">
              <b>01</b>
              <strong>{detail.steps[0][0]}</strong>
              <span>Continue →</span>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ScreenRecorderHero() {
  return (
    <section className="screen-recorder-hero" aria-labelledby="screen-recorder-title">
      <div className="screen-recorder-hero-inner">
        <div className="screen-recorder-hero-copy">
          <div className="screen-recorder-badge">
            <span aria-hidden="true">▣</span>
            Free screen recording for teams
          </div>
          <h1 id="screen-recorder-title">
            4K screen recorder built
            <br />
            to replace <span>Camtasia</span>
          </h1>
          <p>
            Record your screen and webcam in up to 4K, edit for free, and share instantly. A free
            replacement for Loom, Vidyard, Screen Studio, Camtasia, and more, with interactive demos
            when you want to go beyond video.
          </p>
          <div className="screen-recorder-actions">
            <a className="marketing-button" href="/signup">
              Start recording free <span aria-hidden="true">→</span>
            </a>
            <a
              className="marketing-button marketing-button-outline"
              href="/compare/loom-alternative"
            >
              See Supademo vs. Loom
            </a>
          </div>
        </div>
        <div className="screen-recorder-embed" aria-label="Screen recorder product demo">
          <iframe
            title="Screen recorder product demo"
            src="https://app.supademo.com/embed/cmk440yi0003kxx0i97l9xqog"
            loading="eager"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </section>
  );
}

const screenRecorderFaqs = [
  [
    "What can I record with Supademo's free screen recorder?",
    "Record your screen, your webcam, or both together in up to 4K. Resize and reposition the webcam bubble anywhere on screen, add custom backgrounds and auto-zoom, then trim, crop, and share. It all runs in the browser with nothing to install."
  ],
  [
    "Can I record my screen and camera at the same time?",
    "Yes. Supademo records your screen and webcam together, and you can resize, restyle, and reposition the webcam bubble anywhere on screen, plus add custom backgrounds and auto-zoom."
  ],
  [
    "Can I edit my recordings for free?",
    "Yes. Trimming, cutting, cropping, muting, thumbnails, and speed controls are all included free. There's no paid plan to unlock the editor."
  ],
  [
    "How long can I record for free?",
    "Record for up to 10 minutes per video on the free plan, with no per-seat fees or time pressure while you are recording."
  ],
  [
    "Can I switch from Loom to Supademo?",
    "Yes. Export your existing Loom videos as MP4 files with the free Loom video downloader, then upload them to Supademo and keep editing and sharing for free."
  ]
] as const;

function ScreenRecorderFeaturePage() {
  return (
    <main className="screen-recorder-page" id="main">
      <MarketingHeader />
      <ScreenRecorderHero />

      <section className="screen-recorder-metrics" aria-labelledby="screen-recorder-metrics-title">
        <div className="screen-recorder-metrics-inner">
          <h2 id="screen-recorder-metrics-title">Everything you need to record, for free</h2>
          <div className="screen-recorder-metrics-grid">
            <div>
              <strong>0K</strong>
              <p>Crisp screen and webcam recording, even on free plans</p>
            </div>
            <div>
              <strong>0m</strong>
              <p>Per recording on the free plan, no time pressure</p>
            </div>
            <div>
              <strong>0</strong>
              <p>Free videos to record, edit, and share</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="screen-recorder-complete"
        aria-labelledby="screen-recorder-complete-title"
      >
        <div className="screen-recorder-complete-inner">
          <div className="screen-recorder-complete-heading">
            <h2 id="screen-recorder-complete-title">A complete screen and webcam recorder</h2>
            <p>
              Everything you need for professional screen recording, editing, and sharing, with none
              of the usual paywalls.
            </p>
          </div>
          <ScreenRecorderFeatureCarousel />
        </div>
      </section>

      <section className="screen-recorder-compare" aria-labelledby="screen-recorder-compare-title">
        <div className="screen-recorder-compare-inner">
          <div className="screen-recorder-compare-heading">
            <h2 id="screen-recorder-compare-title">
              Why is Supademo better than other screen recorders?
            </h2>
            <p>
              Supademo records and edits in up to 4K for free, with longer recordings and no
              per-seat fees, so most teams can drop a paid recorder entirely.
            </p>
          </div>
          <div className="screen-recorder-compare-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Other recorders like Loom</th>
                  <th>Supademo (free)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Video quality</th>
                  <td>Often 720p</td>
                  <td>Up to 4K</td>
                </tr>
                <tr>
                  <th scope="row">Free videos</th>
                  <td>Capped, e.g. 25</td>
                  <td>50</td>
                </tr>
                <tr>
                  <th scope="row">Recording length</th>
                  <td>Time-capped, e.g. 5 min</td>
                  <td>10 minutes</td>
                </tr>
                <tr>
                  <th scope="row">Webcam</th>
                  <td>Fixed sizes</td>
                  <td>Freeform, any size and position</td>
                </tr>
                <tr>
                  <th scope="row">Editing</th>
                  <td>Paid plans only</td>
                  <td>Included free: trim, cut, crop, mute, speed</td>
                </tr>
                <tr>
                  <th scope="row">Pricing</th>
                  <td>Pay per-seat</td>
                  <td>Pay per workspace creator only</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="screen-recorder-compare-actions">
            <a className="marketing-button" href="/signup">
              Start recording free <span aria-hidden="true">→</span>
            </a>
            <a
              className="marketing-button marketing-button-outline"
              href="/compare/loom-alternative"
            >
              See all recorder comparisons
            </a>
          </div>
        </div>
      </section>

      <section className="screen-recorder-switch" aria-labelledby="screen-recorder-switch-title">
        <div className="screen-recorder-switch-inner">
          <div className="screen-recorder-switch-copy">
            <p className="screen-recorder-eyebrow">Switching from Loom?</p>
            <h2 id="screen-recorder-switch-title">Bring your recordings with you</h2>
            <p>
              Moving off Loom takes minutes. Export your existing Looms as MP4 files with our free
              Loom video downloader, then pick up in Supademo, with no 5-minute limits or per-seat
              fees and free editing from day one.
            </p>
            <div className="screen-recorder-switch-actions">
              <a className="marketing-button" href="/signup">
                Start recording free
              </a>
              <a
                className="marketing-button marketing-button-outline"
                href="/tools/loom-video-downloader"
              >
                Loom video downloader
              </a>
            </div>
          </div>
          <div className="screen-recorder-switch-media">
            <img
              src="https://supademo.com/features/screen-recorder/loom-downloader.png"
              alt="Supademo's free Loom video downloader exporting recordings as MP4"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <section className="screen-recorder-testimonial" aria-label="Customer testimonial">
        <div className="screen-recorder-testimonial-card">
          <img
            className="screen-recorder-testimonial-logo"
            src="https://supademo.com/logos/easy.svg"
            alt="Company logo"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <blockquote>
            “Supademo has been a huge asset across multiple departments and workflows across easy.
            We use Supademo across multiple departments, which cover all of our software solutions.”
          </blockquote>
          <div className="screen-recorder-testimonial-person">
            <img
              src="https://supademo.com/headshots/felix-headshot.avif"
              alt="Felix True"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div>
              <strong>Felix True</strong>
              <span>Head of Presales</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="sandbox-scale screen-recorder-scale"
        aria-labelledby="screen-recorder-scale-title"
      >
        <div className="sandbox-section-heading">
          <h2 id="screen-recorder-scale-title">Scale how your team demonstrates products</h2>
          <p>
            Drive conversions by personalizing your product demo with dynamic variables, conditional
            branching, custom branding and demo chapters.
          </p>
        </div>
        <SandboxScaleCarousel />
      </section>

      <section
        className="figma-explore screen-recorder-explore"
        aria-labelledby="screen-recorder-explore-title"
      >
        <div className="figma-explore-inner">
          <h2 id="screen-recorder-explore-title">Explore More Features</h2>
          <div className="figma-explore-grid">
            {sandboxExploreColumns.map(([title, links]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="figma-explore-links">
                  {links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="showcase-faq screen-recorder-faq"
        aria-labelledby="screen-recorder-faq-title"
      >
        <div className="showcase-faq-inner">
          <div className="showcase-faq-intro">
            <h2 id="screen-recorder-faq-title">Screen recorder FAQs</h2>
            <p>
              Common questions about Supademo's free screen recorder and switching from tools like
              Loom, Vidyard, and Camtasia. Have other questions? Reach out and our team will be
              happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="showcase-faq-list">
            {screenRecorderFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}

const demoRecorderPlatforms = [
  {
    title: "Chrome Extension Recording",
    description:
      "Record interactive demos directly in your browser with our Chrome extension. Capture any web application with a simple click and create professional demos in minutes.",
    tags: [
      "One-Click Screenshots",
      "Shareable Screen and Camera Links",
      "Record Guided HTML Demos",
      "Record Guided Screenshot/Video Demos",
      "Record Sandbox Demos"
    ],
    cta: "Get Chrome Extension",
    href: "https://chromewebstore.google.com/detail/supademo-ai-interactive-d/jblbcpkejogbghfdglhfjlplchcnmohm",
    image: "https://supademo.com/features/demo-recorder/demo-recorder-5.avif",
    alt: "Chrome extension demo recorder",
    imageFirst: true
  },
  {
    title: "Mac Desktop Recording",
    description:
      "Record desktop applications, code editors, and any software on your Mac. Create comprehensive demos of native applications with our powerful desktop recorder.",
    tags: ["Desktop Recording", "Native Apps", "Mac Support"],
    cta: "Download for Mac",
    href: "/signup",
    image: "https://supademo.com/features/demo-recorder/demo-recorder-3.avif",
    alt: "Mac desktop app recorder",
    imageFirst: false
  },
  {
    title: "Windows Desktop Recording",
    description:
      "Capture demos on Windows with our desktop application. Record enterprise software, desktop tools, and any Windows application with ease.",
    tags: ["Windows Support", "Desktop Apps", "Enterprise Ready"],
    cta: "Download for Windows",
    href: "/signup",
    image: "https://supademo.com/features/demo-recorder/demo-recorder-2.avif",
    alt: "Windows desktop app recorder",
    imageFirst: true
  },
  {
    title: "Figma Plugin",
    description:
      "Transform your Figma designs into interactive prototypes with our Figma plugin. Create walkable demos directly from your design files without leaving Figma.",
    tags: ["Figma Integration", "Design to Demo", "Prototype Creation"],
    cta: "Install Figma Plugin",
    href: "https://www.figma.com/community/plugin/1382781944686485388/figma-to-interactive-prototype-supademo",
    image: "https://supademo.com/features/demo-recorder/demo-recorder-4.avif",
    alt: "Figma plugin for creating demos",
    imageFirst: false
  },
  {
    title: "Upload Video and Screenshots",
    description:
      "Already have screenshots or videos? Upload them to Supademo and transform them into interactive step-by-step demos. Perfect for existing content repurposing.",
    tags: ["Video Upload", "Screenshot Import", "Content Reuse"],
    cta: "Start Uploading",
    href: "/signup",
    image: "https://supademo.com/features/demo-recorder/demo-recorder-6.avif",
    alt: "Upload videos and screenshots",
    imageFirst: true
  }
] as const;

const demoRecorderFaqs = [
  [
    "What methods can I use to record demos with Supademo?",
    "Supademo offers multiple recording options: a Chrome Extension for capturing any web application directly in your browser, Mac and Windows desktop apps for recording native applications and software, a Figma plugin for transforming designs into interactive prototypes, and an upload feature to convert existing screenshots or videos into interactive demos."
  ],
  [
    "What types of interactive demos can I create with Supademo?",
    "You can create several types of demos including guided HTML demos, guided screenshot and video demos, sandbox environments for self-guided exploration, and interactive prototypes from Figma designs. Each format serves different use cases from sales enablement to customer onboarding."
  ],
  [
    "How long does it take to create an interactive demo?",
    "Creating a demo takes just minutes. Simply open Supademo's recorder, click through your product or workflow, and Supademo automatically captures each step and generates text descriptions."
  ],
  [
    "What is the difference between HTML demos and screenshot demos?",
    "HTML demos capture a pixel-perfect front-end clone of your product with full interactivity including hover states, animations, and clickable elements. Screenshot demos use captured images and video to tell a focused, guided story."
  ],
  [
    "Can I upload existing videos and screenshots?",
    "Yes. Upload existing videos or screenshots and transform them into interactive, step-by-step demos without re-recording the original workflow."
  ]
] as const;

function DemoRecorderFeaturePage() {
  const detail = getFeatureDetail("demo-recorder") ?? featureDetails["demo-recorder"];
  return (
    <main className="feature-detail-page demo-recorder-page" id="main">
      <MarketingHeader />
      <section className="feature-detail-hero" aria-labelledby="demo-recorder-title">
        <div className="feature-detail-hero-copy">
          <h1 id="demo-recorder-title">{detail.title}</h1>
          <p>
            Bring life to your product demos to close more
            <br />
            deals, drive enablement and scale product
            <br />
            onboarding.
          </p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/signup">
              Create your first Supademo
            </a>
            <a className="marketing-button marketing-button-outline" href="/product-demo">
              Request a demo
            </a>
          </div>
        </div>
        <FeaturePreview detail={detail} />
      </section>

      <section className="demo-recorder-demo-stage" aria-label="Interactive Supademo preview">
        <div className="demo-recorder-demo-frame">
          <iframe
            title="Interactive Supademo"
            src="https://app.supademo.com/embed/cma012xa5071z090hj7ltq31x"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </section>

      <section className="demo-recorder-platforms" aria-label="Demo recording options">
        <div className="demo-recorder-platforms-inner">
          {demoRecorderPlatforms.map((platform) => (
            <section className="demo-recorder-platform-row" key={platform.title}>
              <article className="demo-recorder-platform-card">
                <div
                  className={`demo-recorder-platform-media${platform.imageFirst ? " is-first" : " is-second"}`}
                >
                  <img
                    src={platform.image}
                    alt={platform.alt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="demo-recorder-platform-copy">
                  <h2>{platform.title}</h2>
                  <p>{platform.description}</p>
                  <div
                    className="demo-recorder-platform-tags"
                    aria-label={`${platform.title} capabilities`}
                  >
                    {platform.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <a className="demo-recorder-platform-cta" href={platform.href}>
                    <span>{platform.cta}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            </section>
          ))}
        </div>
      </section>

      <section
        className="showcase-use-case-section demo-recorder-use-cases"
        aria-labelledby="demo-recorder-use-cases-title"
      >
        <div className="showcase-use-case-inner">
          <h2 id="demo-recorder-use-cases-title">
            Powerful uses cases for every team at your company
          </h2>
          <ShowcaseUseCaseTabs />
        </div>
      </section>

      <section className="showcase-explore" aria-labelledby="demo-recorder-explore-title">
        <h2 id="demo-recorder-explore-title">Explore More Features</h2>
        <div className="showcase-explore-grid">
          {sandboxExploreColumns.map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              <div className="showcase-explore-links">
                {links.map(([label, href]) => (
                  <a href={href} key={label}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="showcase-faq" aria-labelledby="demo-recorder-faq-title">
        <div className="showcase-faq-inner">
          <div className="showcase-faq-intro">
            <h2 id="demo-recorder-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="showcase-faq-list">
            {demoRecorderFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseTrustRail />
      <MarketingFooter variant="showcase" />
    </main>
  );
}

export function MarketingFeatureDetail({ slug }: { slug: string }) {
  if (slug === "guided-html-demo") return <GuidedHtmlFeaturePage />;
  if (slug === "sandbox-demos") return <SandboxFeaturePage />;
  if (slug === "figma") return <FigmaFeaturePage />;
  if (slug === "screen-recorder") return <ScreenRecorderFeaturePage />;
  if (slug === "route-hub") return <RouteHubFeaturePage />;
  if (slug === "demo-hub") return <DemoHubFeaturePage />;
  if (slug === "analytics") return <AnalyticsFeaturePage />;
  if (slug === "sharing") return <SharingFeaturePage />;
  if (slug === "showcase-collection") return <ShowcaseFeaturePage />;
  if (slug === "demo-recorder") return <DemoRecorderFeaturePage />;

  if (slug === "demo-editor" || slug === "personalization") {
    const detail = getFeatureDetail(slug);
    if (detail) return <ReferenceFeatureDetailPage slug={slug} detail={detail} />;
  }

  const detail = getFeatureDetail(slug) ?? featureDetails["guided-html-demo"];
  const primaryCta =
    slug === "figma"
      ? {
          label: "Install Figma plugin",
          href: "https://www.figma.com/community/plugin/1382781944686485388/supademo-create-interactive-prototypes-from-figma"
        }
      : { label: "Create your first Supademo", href: "/signup" };
  return (
    <main className="feature-detail-page" id="main">
      <MarketingHeader />
      {slug === "screen-recorder" ? (
        <ScreenRecorderHero />
      ) : (
        <section className="feature-detail-hero" aria-labelledby="feature-detail-title">
          <div className="feature-detail-hero-copy">
            <p className="feature-detail-eyebrow">{detail.label}</p>
            <p className="feature-detail-breadcrumb">Supademo / Features / {detail.label}</p>
            <h1 id="feature-detail-title">{detail.title}</h1>
            <p>{detail.description}</p>
            <div className="marketing-hero-actions">
              <a className="marketing-button" href={primaryCta.href}>
                {primaryCta.label}
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <FeaturePreview detail={detail} />
        </section>
      )}

      <section className="feature-detail-outcome" aria-labelledby="feature-detail-outcome-title">
        <p className="feature-detail-eyebrow">Built around the viewer</p>
        <h2 id="feature-detail-outcome-title">{detail.outcome}</h2>
        <div className="feature-detail-capabilities">
          {detail.capabilities.map((capability, index) => (
            <article key={capability}>
              <span>0{index + 1}</span>
              <h3>{capability}</h3>
              <p>Keep the experience clear, useful, and easy to revisit.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-detail-steps" aria-labelledby="feature-detail-steps-title">
        <div className="feature-detail-section-heading">
          <p className="feature-detail-eyebrow">Simple by design</p>
          <h2 id="feature-detail-steps-title">A focused path from capture to share</h2>
        </div>
        <div className="feature-detail-step-grid">
          {detail.steps.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-detail-showcase" aria-labelledby="feature-detail-showcase-title">
        <div className="feature-detail-section-heading">
          <p className="feature-detail-eyebrow">Built for the whole journey</p>
          <h2 id="feature-detail-showcase-title">
            Everything your audience needs, in one clear experience.
          </h2>
        </div>
        <div className="feature-detail-showcase-list">
          {detail.steps.map(([title, description], index) => (
            <article
              className={`feature-detail-showcase-row ${index % 2 === 1 ? "is-reversed" : ""}`}
              key={`showcase-${title}`}
            >
              <div className="feature-detail-showcase-copy">
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <a className="marketing-text-action" href="/signup">
                  Start creating <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="feature-detail-showcase-art">
                <img
                  src={featureSupportingImages[index % featureSupportingImages.length]}
                  alt={`${title} example`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="feature-detail-use-cases"
        aria-labelledby="feature-detail-use-cases-title"
      >
        <div className="feature-detail-section-heading">
          <p className="feature-detail-eyebrow">Made to scale with you</p>
          <h2 id="feature-detail-use-cases-title">A focused toolkit, without the busywork.</h2>
        </div>
        <div className="feature-detail-use-case-grid">
          {detail.capabilities.map((capability, index) => (
            <article key={`use-${capability}`}>
              <span>0{index + 1}</span>
              <h3>{capability}</h3>
              <p>Keep your team aligned with a repeatable, viewer-friendly workflow.</p>
              <a href="/signup">
                Try it for free <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-detail-faq" aria-labelledby="feature-detail-faq-title">
        <div className="feature-detail-faq-copy">
          <p className="feature-detail-eyebrow">Questions, answered</p>
          <h2 id="feature-detail-faq-title">Make your next demo easy to follow.</h2>
          <p>
            Start with the workflow that matters most, then expand as your team learns what viewers
            need.
          </p>
        </div>
        <div className="feature-detail-faq-list">
          {[
            [
              "Can I try this feature before I publish?",
              "Yes. Preview the experience as a viewer, check every step, and publish only when the flow is ready."
            ],
            [
              "Does this work with my existing demos?",
              "Start from a capture or an existing demo and keep the original source available while you improve the story."
            ],
            [
              "Can teammates collaborate on the same workflow?",
              "Share a workspace, keep the source of truth in one place, and give each teammate a clear next action."
            ],
            [
              "How do I measure whether it is working?",
              "Use viewer engagement, completion, and path signals to see which moments create momentum."
            ]
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="feature-detail-cta" aria-labelledby="feature-detail-cta-title">
        <div>
          <p className="feature-detail-eyebrow">Make the product easier to experience</p>
          <h2 id="feature-detail-cta-title">Start with one workflow. The rest gets easier.</h2>
        </div>
        <a className="marketing-button marketing-button-light" href="/signup">
          Create your first demo <span aria-hidden="true">→</span>
        </a>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
