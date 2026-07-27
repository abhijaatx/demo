# Simple Product UI Requirements

## Product design goal

The product must feel as approachable as a presentation editor even though it supports advanced capture, branching, analytics, HTML clones, sandboxing, and AI.

The default experience should resemble Supademo's strongest user-perceived quality: a clean interface that lets a non-technical creator record, edit, and share a useful demo without training.

This is a behavior and information-architecture requirement, not a request to copy Supademo's proprietary visual design.

## Core mental model

Every creator journey follows three stages:

1. **Record** — capture, upload, or import screens.
2. **Edit** — arrange steps and add guidance.
3. **Share** — preview, publish, embed, or export.

The current stage must always be visible. Advanced workflows may add detail inside a stage but must not introduce a separate mental model unless necessary.

## Primary navigation

The default workspace navigation contains no more than:

- Home
- Demos
- Hubs
- Analytics
- Leads

Workspace settings, integrations, members, billing, and enterprise administration belong behind a Settings entry. AI features are actions inside the relevant workflow rather than a large collection of unrelated top-level pages.

## Dashboard rules

- Show one obvious primary action: **Create demo**.
- Let users resume recent work immediately.
- Default to a clean card/list view with search and simple filters.
- Put folders and advanced filters behind lightweight controls.
- Use plain-language states such as Draft, Published, Needs update, Processing, and Failed.
- Keep destructive and infrequent actions in an overflow menu.
- Do not expose internal concepts such as manifests, revisions, queue jobs, object keys, or provider models.

## Editor layout

Use a familiar presentation-editor layout:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Back  Demo title  Saved                         Preview  Share    │
├──────────────┬──────────────────────────────┬────────────────────┤
│ Step rail    │                              │ Context inspector  │
│              │         Main canvas          │                    │
│ 01           │                              │ Only settings for  │
│ 02           │                              │ selected object    │
│ 03           │                              │                    │
├──────────────┴──────────────────────────────┴────────────────────┤
│ Optional timeline appears only for video/audio/motion editing    │
└──────────────────────────────────────────────────────────────────┘
```

Editor requirements:

- Left: ordered step thumbnails and chapters.
- Center: the selected screen and direct manipulation.
- Right: properties only for the current selection.
- Top: back, title, save state, undo/redo, Preview, and Share.
- Bottom timeline: hidden unless editing media, narration, or timed motion.
- Avoid permanently visible toolbars for features unrelated to the current selection.

## Progressive disclosure

### Simple mode, shown by default

- Add or replace a screen
- Add hotspot
- Edit text
- Reorder steps
- Blur sensitive information
- Add voiceover
- Preview
- Share

### Advanced controls, revealed contextually

- Branching and conditions
- Variables and personalization
- Fine-grained motion timing
- Layer management
- HTML editing
- Sandbox state/actions
- AI batch operations
- Experiment configuration
- Embed event/API controls

Advanced features must never alter a simple demo merely because the creator opened their settings.

## Interaction rules

- One primary action per page or dialog.
- Use buttons with labels for important actions; icon-only controls are limited to familiar, repeated editor actions and require tooltips.
- Prefer inline editing and side panels over chains of modal dialogs.
- Do not place more than seven equally weighted actions in one toolbar.
- Keep advanced features within three purposeful interactions from their relevant object.
- Preserve selection, focus, scroll, zoom, and undo history after non-destructive operations.
- Autosave continuously and show `Saving`, `Saved`, `Offline`, or `Conflict` in plain language.
- Never use a success toast as the only evidence that important data was saved.
- Every asynchronous operation shows progress, safe navigation behavior, and recovery options.

## Capture UI rules

- The chosen capture mode—Screenshot, HTML, or Video—is explicit and remains locked until the user changes it.
- A persistent indicator shows when capture is active.
- Each successful captured step produces immediate visual and audible/accessible confirmation.
- Pause, Undo last, Finish, and Cancel remain available throughout recording.
- Long recordings show step count, health, and recoverable upload state.
- The recorder must never switch capture mode automatically without confirmation.

## Mobile behavior

- The editor provides one-click desktop, tablet, and phone preview.
- Creators select a mobile strategy: Responsive, Scale, Zoom/Pan, Swipe story, or Fallback media.
- Mobile-specific overrides are optional and visually marked.
- The player provides touch targets of at least 44×44 CSS pixels where possible.
- Pinch-to-zoom and swipe behavior must not conflict with browser navigation or accessibility zoom.

## Advanced-feature UX

- Use presets and templates before exposing raw configuration.
- Explain outcomes, not implementation terms. Prefer “Send half of viewers to each version” over “50/50 allocation.”
- Show a safe preview before AI edits, bulk changes, recapture, redaction, publication, or experiment launch.
- Show “used by” impact before modifying shared assets or captures.
- Validate complex branch/route graphs continuously and link each error to its source.
- Keep a non-visual outline alternative for graph editors.

## Publishing and privacy UI

- The Share panel contains four clear tabs: Link, Embed, Export, and Present.
- Show current publication state and last published time.
- Summarize access: Public, Email gate, Password, Expiring, Preview only, or Private.
- Show search-engine indexing as a plain-language toggle; default gated/private/preview content to no-index.
- Preview links are visually distinct and explicitly do not affect production analytics.
- Publish and destructive access changes require a concise impact summary.

## Empty, loading, and error states

- Empty states explain the next useful action without marketing filler.
- Skeletons should resemble final structure and avoid excessive animation.
- Errors state what happened, whether work is safe, and what the user can do next.
- Technical details and correlation IDs may be available under a disclosure for support, but never expose secrets.
- Permission-denied states do not imply that a hidden resource exists.

## Language and content style

- Use short, direct labels and sentences.
- Prefer familiar nouns: Demo, Step, Screen, Hotspot, Chapter, Viewer, Lead.
- Avoid internal jargon: node graph, derivative asset, ingestion, job, manifest, tenancy.
- Use sentence case.
- Confirmation dialogs name the object and consequence.
- AI-generated content is labeled subtly and remains fully editable.

## Visual style

- Neutral surfaces with one restrained brand accent.
- Strong spacing and hierarchy instead of decorative borders.
- Minimal shadows and motion.
- Motion communicates relationship or state and honors reduced-motion preferences.
- Default text and controls meet WCAG 2.2 AA contrast.
- Use consistent 8px-based spacing and a small, documented type scale.
- Brand customization affects viewer-facing demos more than the creator application's chrome.

## Usability quality gates

Before a milestone containing creator UI is accepted:

- A first-time user can create and publish a basic screenshot demo without documentation.
- The median moderated first-demo journey target is five minutes or less after sign-in.
- A user can replace a step, add a hotspot, preview, and republish without leaving the editor.
- No changed page has competing primary actions.
- Simple-demo creation does not require opening Advanced settings.
- Keyboard-only and screen-reader journeys are complete.
- Layout works at 1280×720 and larger creator viewports; viewer UI works from 320px width.
- Common direct-manipulation feedback begins within 100ms under the supported local performance fixture.
- Autosave and recording state are always understandable without opening a log or status page.

## Agent enforcement

For any task changing creator or viewer UI, the implementing agent must:

1. Read this file before implementation.
2. State which primary journey and UI region are affected.
3. Reuse design-system components and interaction patterns.
4. Include normal, empty, loading, error, disabled, and permission-denied states where applicable.
5. Test keyboard, responsive, and assistive-technology behavior.
6. Explain any new top-level navigation item or persistent toolbar control; absence of a strong reason means it should not be added.
7. Include screenshots or visual-regression output in the review handoff.
