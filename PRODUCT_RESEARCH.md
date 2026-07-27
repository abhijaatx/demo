# Interactive Demo Product Research

## Purpose

This document records public user feedback and competitor patterns used to extend `SUPADEMO_FEATURE_SPEC.md`. It is a directional product input, not a statistically representative market study. Reddit threads can contain vendor promotion, review-site summaries can compress nuance, and competitor documentation describes intended behavior rather than independently verified quality.

Research snapshot: July 2026.

## Strong signals from Supademo users

### Simplicity is the product advantage

Supademo reviews consistently praise its easy, intuitive interface and quick demo creation. A G2 reviewer specifically described the mental model as familiar, like editing a presentation deck. Product Hunt feedback also emphasizes fast creation and refinement.

Product decision:

- Keep the default workflow as `Record → Edit → Share`.
- Use a presentation-style editor: step rail, central canvas, contextual inspector.
- Hide complex HTML, branching, AI, analytics, and sandbox options behind progressive disclosure.
- Optimize onboarding for publishing a useful first demo in under five minutes.

Evidence:

- [G2 Supademo pros and cons](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [G2 review describing a familiar deck-like interface and missing A/B testing](https://www.g2.com/products/supademo/reviews?page=6&qs=pros-and-cons)
- [Product Hunt Supademo reviews](https://www.producthunt.com/products/supademo)
- [Capterra Supademo review](https://www.capterra.com/p/10005933/Supademo/)

### Reliability matters more than feature count

Recurring complaints mention missed clicks, unexpected switching between screenshot and video recording, sluggish long recordings, unreliable autosave, and cumbersome fine adjustments.

Product decision:

- Make recording mode explicit and locked until the user changes it.
- Show a visible capture receipt after every click/step.
- Add local recording journals, resume/recovery, and duplicate-event protection.
- Make autosave state prominent and provide conflict/recovery history.
- Add capture diagnostics and a repair flow rather than forcing rerecording.

Evidence:

- [G2 Supademo recording, autosave, and editing feedback](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [G2 Supademo reviews page 6](https://www.g2.com/products/supademo/reviews?page=6&qs=pros-and-cons)
- [Reddit discussion about confusing editors and broken hotspots](https://www.reddit.com/r/SaaS/comments/1rr1uqh/anyone_else_frustrated_with_navattics_setup_time/)

### Users want greater control without a steeper learning curve

Feedback asks for more intro/outro customization, richer callout contents and layering, better hotspot alignment, granular transition/voice timing, bulk editing, and clearer clickable-button highlighting.

Product decision:

- Preserve simple defaults and add an optional Advanced inspector.
- Add reusable themes and bulk editing instead of forcing per-step repetition.
- Add alignment, keyboard nudging, layer management, and timeline controls.
- Allow richer intro/outro layouts while keeping accessible templates as the default.

Evidence:

- [G2 Supademo limited customization feedback](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [Product Hunt editing-control feedback](https://www.producthunt.com/products/supademo)

### Mobile viewing and preview need first-class treatment

Users report formatting issues, collapsed or limited hotspots, and lack of convenient mobile preview. Competitors address this with zoom, swipe, scaled, responsive, and fallback strategies.

Product decision:

- Offer live mobile preview while editing.
- Support responsive, scaled, pinch-to-zoom, swipe-story, and image/video fallback strategies.
- Allow mobile-specific hotspot positions and visibility without duplicating a demo.
- Include mobile behavior in publication validation.

Evidence:

- [G2 Supademo mobile feedback](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [Navattic responsive strategies](https://docs.navattic.com/build/responsive)
- [Navattic mobile demo strategies](https://docs.navattic.com/build/mobile)

### Privacy and publishing defaults must be explicit

Review summaries mention automatic indexing as a privacy/usability concern. Demo platforms also handle gated, expiring, and preview-only links.

Product decision:

- Default gated, private, preview, and personalized links to `noindex`.
- Make search-engine indexing an explicit per-publication setting.
- Provide preview links that collect no production analytics.
- Show a publication privacy summary before publishing.

Evidence:

- [G2 Supademo demo-management and auto-indexing feedback](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [Navattic preview and publishing behavior](https://docs.navattic.com/help/glossary)

## Strong signals from the wider interactive-demo market

### Demo maintenance and recapture

Fast-moving products make demos stale. Competitors now support recapturing the source page, comparing old/new captures, preserving anchors, restoring versions, and syncing updated publications to existing embeds.

Product decision:

- Store source URL and capture provenance where safe.
- Detect stale/broken assets and targets.
- Support single-step and bulk recapture.
- Show visual old/new diff and preserve hotspot anchors when confidence is high.
- Show impact before updating shared captures used by multiple demos.
- Republish existing links/embeds without requiring customers to replace snippets.

Evidence:

- [Navattic recapture and bulk editing](https://docs.navattic.com/changelog)
- [Navattic maintenance behavior for live embeds](https://docs.navattic.com/use-cases/in-app-demos)

### A/B experimentation

Supademo reviewers explicitly ask for A/B testing. Storylane exposes traffic splitting and measures completion, CTA clicks, lead capture, and intent.

Product decision:

- Add A/B experiments over immutable published variants.
- Support configurable traffic split, holdout, start/end, primary metric, guardrails, and winner promotion.
- Report sample size and uncertainty; avoid declaring winners prematurely.
- Preserve stable embed/share URLs during experiments and promotion.

Evidence:

- [G2 review requesting A/B testing](https://www.g2.com/products/supademo/reviews?page=6&qs=pros-and-cons)
- [Storylane A/B testing documentation](https://docs.storylane.io/analytics-and-performance/a-b-testing)

### Multi-format repurposing and offline use

Users want advanced export and offline options. Competitors export video, GIF, PDF, and numbered text, and provide downloadable offline players for conferences or unstable connections.

Product decision:

- Export a published demo as MP4, GIF, PDF, and accessible SOP/document.
- Add an installable offline PWA/player with encrypted downloaded packages and expiry/revocation metadata.
- Add a portable self-host package for approved plans, with explicit limitations and optional analytics relay.
- Generate email-safe animated/static thumbnails that link to the interactive version.

Evidence:

- [G2 Supademo review asking for advanced offline exports](https://www.g2.com/products/supademo/reviews?qs=pros-and-cons)
- [Navattic GIF, video, PDF, and text exports](https://docs.navattic.com/changelog)
- [Navattic offline demos](https://docs.navattic.com/demos/offline)
- [Reddit discussion about locally hosted interactive demos](https://www.reddit.com/r/SaaS/comments/1uk2k2s/locally_hosted_interactive_demos/)

### Presenter mode for sales and events

Interactive demos are frequently used during live calls and events. Competitors provide presenter notes, clean audience views, quick keyboard controls, opportunity association, and offline presentation.

Product decision:

- Add per-step presenter notes.
- Add presenter mode with notes on a private second screen and a clean audience screen.
- Add shortcuts to toggle guides, beacons, and free navigation.
- Add kiosk/event mode with auto-reset and optional offline operation.
- Allow a presentation to be associated with an account/opportunity.

Evidence:

- [Navattic present mode and presenter notes](https://docs.navattic.com/launchpad/share/present)
- [Storylane presenter mode](https://docs.storylane.io/sandbox-demo/sandbox-configuration/present-mode)

### Embed performance and lifecycle control

Competitors support lazy-load overlays, disabled preloading, full-page embeds, popup embeds, and JavaScript lifecycle controls.

Product decision:

- Add lazy-load preview overlays and optional no-preload behavior.
- Add inline, full-page, and popup embed modes.
- Expose load/open/close/destroy APIs and lifecycle callbacks.
- Publish an embed performance budget and prevent the SDK from blocking host-page interaction.

Evidence:

- [Navattic embed types and lifecycle controls](https://docs.navattic.com/share/embed)
- [Storylane overlay embeds](https://docs.storylane.io/sharing-demos/website-embed)

### Richer analytics and assessments

Users ask for deeper reporting and quiz-style engagement. Experimentation also needs comparison analytics rather than isolated demo metrics.

Product decision:

- Add click heatmaps, scroll depth, path comparison, cohorts, account/stakeholder engagement, and content-freshness analytics.
- Add quizzes with correct answers, scoring, pass thresholds, explanations, attempts, and completion certificates where enabled.
- Add SCORM/xAPI export or LMS reporting only after the core assessment model is stable.

Evidence:

- [G2 Supademo review summaries and seller response discussing richer reporting and quiz engagement](https://www.g2.com/products/supademo/reviews?page=5)
- [Storylane A/B testing metrics](https://docs.storylane.io/analytics-and-performance/a-b-testing)

### Faster creation from existing material

Users and competitors are exploring creation from videos, mockups, descriptions, and captured collections, reducing the need for a working product or manual step setup.

Product decision:

- Convert an existing product video into candidate steps and hotspots.
- Generate a draft from approved Figma frames or uploaded mockups.
- Generate a storyboard from a product description, URL, or use case, but require creator review before capture/publication.
- Apply AI suggestions in preview mode and never silently overwrite a draft.

Evidence:

- [Reddit discussion about generating walkthroughs from descriptions/mockups](https://www.reddit.com/r/SaaS/comments/1umld26/built_a_product_that_makes_product_explainers/)
- [Storylane video-to-demo direction and Figma/manual imports](https://docs.storylane.io/quick-start-guide)
- [Navattic Copilot and demo suggestions](https://docs.navattic.com/changelog)

### Reusable synchronized content and review workflow

As demo libraries grow, users need reusable captures, safer bulk changes, approvals, preview links, and impact awareness.

Product decision:

- Support shared capture/component collections with opt-in synchronization.
- Add “used by” impact views before changing or deleting shared content.
- Add bulk edit for themes, text, voices, variables, visibility, and branding.
- Add review requests, required approvers, preview-only links, approval history, and publish gates.

Evidence:

- [Navattic capture collections, preview, restore, and search concepts](https://docs.navattic.com/help/glossary)
- [Navattic recapture and bulk editing](https://docs.navattic.com/changelog)

## Packaging-related signal

Reddit discussions repeatedly criticize recurring cost for a single demo, per-seat pricing, and losing hosted demos after cancellation. This is not primarily an engineering feature, but the architecture should avoid forcing one packaging model.

Product decision:

- Support a solo/single-demo entitlement.
- Keep external viewers free at the entitlement layer.
- Support free reviewer/view-only seats.
- Make exports and customer data portable.
- Keep billing-provider logic separate from feature authorization.

Evidence:

- [Reddit discussion about paying monthly for one demo](https://www.reddit.com/r/SaaS/comments/1qz7vr2/sick_of_paying_40month_for_supademo_just_to_make/)
- [Reddit discussion about interactive-demo pricing](https://www.reddit.com/r/salesengineers/comments/1t9sxqr/anyone_else_feel_interactive_demo_tools_got/)
- [Reddit discussion about hosted demo continuity](https://www.reddit.com/r/SaaS/comments/1qridk9/selfhosted_vs_hosted_product_demos_which_pain/)

## Prioritized additions

### P0 — Required for initial product trust

- Simple presentation-style UI and progressive disclosure
- Reliable autosave, visible save status, conflict recovery, and local draft journal
- Explicit recording mode, capture confirmation, recovery, and long-session performance
- Mobile preview and mobile-specific rendering strategies
- Flexible but template-led intro/outro and callout customization
- Explicit indexing/privacy controls
- Preview-only links without production analytics

### P1 — High-value product capabilities

- Recapture, visual diff, anchor preservation, freshness diagnostics, and shared-content impact analysis
- A/B testing with statistically responsible reporting
- MP4, GIF, PDF, SOP/text, email-thumbnail, and offline-player exports
- Presenter notes, presenter mode, kiosk mode, and opportunity association
- Bulk editing and synchronized reusable capture collections
- Lazy-load embeds and complete SDK lifecycle controls
- Click heatmaps, scroll depth, cohorts, and account engagement
- Quiz/assessment blocks and LMS-ready event model
- Video/mockup/description-to-draft workflows
- Granular transition, narration, and timeline controls

### P2 — Differentiation after the core is stable

- Portable self-hosted demo packages with optional analytics relay
- Automated freshness monitoring against approved source URLs
- SCORM/xAPI packages and completion certificates
- AI-assisted bulk maintenance across a demo library
- Advanced account buying-committee maps and CRM opportunity influence
