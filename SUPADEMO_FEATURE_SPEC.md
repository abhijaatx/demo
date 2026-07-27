# Supademo-Style Product Feature Specification

This document defines the capabilities required to build a full Supademo-style interactive demo platform. It describes product requirements and observable capabilities, not Supademo's private implementation.

## 1. Product foundation

- Multi-tenant SaaS architecture
- Organizations, workspaces, teams, and projects
- User authentication and account recovery
- Admin, Creator, Editor, Viewer, and Guest roles
- Workspace-level permissions
- Content ownership and access control
- Folders, subfolders, tags, search, and filtering
- Draft, published, archived, and deleted states
- Autosave and recovery
- Version history and restore
- Responsive web application
- Light and dark interface themes
- Accessibility support for keyboard, screen readers, contrast, and captions

## 2. Demo creation and capture

### Web capture

- Browser extension for recording web applications
- Capture clicks, navigation, screenshots, DOM context, and metadata
- Capture HTML, screenshot, or video demos
- Support authenticated workflows where permitted
- Pause, resume, undo, and restart recording
- Select individual browser tabs or windows
- Capture full-page and viewport screenshots
- Handle dynamic content and loading states
- Allow users to remove or replace captured steps

### Desktop capture

- Desktop recording application
- Window and screen selection
- System audio and microphone capture
- Webcam and picture-in-picture capture
- Cursor and click visualization
- Recording pause/resume
- Video trimming and cropping

### Mobile capture

- Upload mobile and tablet screenshots
- Support portrait and landscape layouts
- Device-frame presentation options
- Mobile step ordering and annotation

### Other inputs

- Upload images, screenshots, and video
- Import Figma frames or designs
- Create demos from existing media
- Duplicate existing demos as templates

## 3. Demo formats

- Guided screenshot demos
- Guided video demos
- Guided HTML demos
- Sandbox HTML demos
- Mobile demos
- Screenshot links
- Video demos
- Multi-demo Showcase collections
- In-app product tours
- In-app Demo Hub libraries
- RouteHub-driven experiences
- AI-powered conversational demos

## 4. Demo editor

- No-code visual editor
- Canvas preview
- Screen and step timeline
- Drag-and-drop step ordering
- Add, delete, duplicate, replace, and reorder steps
- Step-level text editing
- Step-level voiceover editing
- Undo and redo
- Autosave
- Preview as viewer
- Desktop, tablet, and mobile previews
- Aspect-ratio controls
- Media fit and crop controls
- Screen replacement without re-recording
- Draft/published comparison
- Version restore

## 5. Interactive components

- Clickable hotspots
- Multiple hotspots per screen
- Invisible hotspots
- Custom hotspot destinations
- Hotspot labels and descriptions
- Hotspot animations
- Next and previous navigation
- Custom navigation buttons
- Chapter navigation
- Progress indicators
- Slide counters
- External URL actions
- Internal step links
- Open-in-new-tab actions
- Conditional branching
- Persona-based branches
- Multi-path flows
- Autoplay
- Looping playback
- Keyboard navigation
- Touch navigation
- Fullscreen mode

## 6. Visual and explanatory components

- Text blocks
- Tooltips
- Callouts
- Arrows
- Lines
- Rectangles and circles
- Highlight overlays
- Icons
- Images
- Logos
- Buttons
- Badges
- Captions
- Step labels
- Custom fonts
- Text alignment and formatting
- Color and opacity controls
- Border and corner-radius controls
- Shadows
- Blur effects
- Redaction masks
- Crop tools
- Zoom effects
- Pan effects
- Typewriter text effect
- Background music
- Voiceover audio

## 7. Chapters and flow structure

- Intro chapters
- Context chapters
- Instruction chapters
- Lead-capture chapters
- Survey chapters
- Gated chapters
- Branching chapters
- CTA chapters
- Outro chapters
- Chapter titles and descriptions
- Chapter images
- Chapter buttons
- Links to internal steps
- Links to external URLs
- Chapter-level branding
- Chapter-level variables

## 8. Forms, leads, and conversion

- Email capture
- Name and company fields
- Custom form fields
- Required and optional fields
- Consent checkbox
- Survey questions
- Multiple-choice fields
- Free-text responses
- Conditional form questions
- Form validation
- Form submission confirmation
- Password gates
- Email gates
- CTA tracking
- Meeting-booking CTAs
- Trial-start CTAs
- Contact-sales CTAs
- Redirect after completion
- CRM lead creation
- Lead notifications

## 9. Personalization

- Dynamic variables
- Viewer name
- Viewer email
- Company name
- Role and persona
- Industry
- Region and language
- Use-case-specific copy
- Personalized CTAs
- Personalized chapters
- Personalized links
- URL query-string variables
- Personalized share links
- CRM-sourced variables
- Reusable variable definitions
- Fallback values for missing variables

## 10. AI features

### AI content creation

- Generate hotspot copy
- Rewrite text by tone or audience
- Generate demo scripts
- Summarize screens
- Suggest titles and descriptions
- Suggest CTAs
- Generate chapter structure
- Recommend missing steps

### AI audio and localization

- AI voiceovers
- Multiple voices and accents
- Voice style and speed controls
- Voice cloning with consent controls
- Automatic translation
- Translation into 15+ languages
- Localized text and voiceover tracks
- Per-language publishing

### AI editing

- AI data editing in cloned demos
- Find and replace content
- Change names, companies, amounts, and labels
- Apply persona-specific data
- Bulk content updates

### AI Demo Audit

- Demo quality score
- Step-length analysis
- Copy-quality analysis
- Visual-framing analysis
- CTA analysis
- Engagement-design analysis
- Use-case alignment analysis
- Drop-off recommendations
- One-click AI improvements
- Before/after comparison

### AI Demo Agent

- Conversational text interface
- Voice-led interface
- Knowledge-base ingestion
- Demo, video, PDF, presentation, and document retrieval
- Follow-up questions
- Product Q&A
- Buyer qualification
- Intent detection
- Lead scoring
- Content recommendation
- RouteHub integration
- Meeting booking
- Trial-start action
- Human handoff
- Conversation transcript
- Agent analytics
- Agent guardrails
- Source attribution
- Multi-language support

## 11. HTML cloning and sandbox technology

- Clone product screens into editable HTML
- Capture styles, assets, typography, and layout
- Sanitize captured HTML and JavaScript
- Replace live links with simulated actions
- Simulate forms and product interactions
- Seed realistic demo data
- Provide editable data objects
- Reset sandbox state
- Isolate viewer sessions
- Protect sandbox execution
- Support responsive layouts
- Support guided and free-exploration modes
- Add custom routes and navigation
- Track sandbox interactions
- Prevent access to production data

## 12. Sharing and publishing

- Public share links
- Private share links
- Trackable share links
- Expiring share links
- Password-protected links
- Custom domains
- Custom slugs
- Branded viewer pages
- Remove platform branding
- Social preview metadata
- SEO metadata controls
- Embed codes
- Showcase links
- QR-code sharing
- Download or export options where permitted
- Publish/unpublish controls

## 13. Embedding and developer integration

- Inline iframe embeds
- Popup/modal embeds
- Responsive embeds
- Showcase embeds
- HTML demo embeds
- JavaScript popup SDK
- Button and link triggers
- React support
- Vue support
- Angular support
- Svelte support
- Google Tag Manager support
- In-app tour triggering
- Custom trigger conditions
- Dynamic embed variables

### Embed event API

Support browser `postMessage` events for:

- `Supademo:load`
- `Supademo:started`
- `Supademo:slideChange`
- `Supademo:progress`
- `Supademo:completed`
- `Supademo:close`

Events should expose demo ID, title, current step, total steps, progress percentage, first/last-step state, and completion timestamp where relevant.

## 14. Demo Hub and RouteHub

### In-app Demo Hub

- Embeddable demo library
- Search and filtering
- Categories and tags
- Persona-based collections
- Feature-based collections
- On-demand user access
- In-context guidance
- Recommended demos
- Recently viewed demos
- Completion state
- Admin-managed content

### RouteHub

- Visual routing builder
- Conditional routing rules
- Funnel-stage routing
- Persona routing
- Industry routing
- Intent-based routing
- Demo-to-demo transitions
- Video/document routing
- AI-agent routing
- CTA routing
- Human handoff routing
- Route analytics

## 15. Analytics and telemetry

- Total views
- Unique viewers
- Identified viewers
- Sessions
- Session duration
- Starts
- Completions
- Completion rate
- Step-level completion
- Time per step
- Drop-off points
- Replay behavior
- Hotspot clicks
- CTA clicks
- Form submissions
- Survey responses
- Device and browser data
- Referrer and source data
- Trackable-link performance
- Embed performance
- Workspace dashboards
- Demo dashboards
- Viewer-level timelines
- Lead-intent scoring
- AI-agent conversation analytics
- CSV export
- API/webhook export
- Retention controls
- Consent and privacy controls

## 16. Integrations

### CRM and marketing

- HubSpot
- Salesforce
- Marketo
- Pipedrive
- Segment
- Zapier

### Analytics and notifications

- Google Analytics
- Google Tag Manager
- Slack
- Webhooks
- Custom event forwarding

### Forms and scheduling

- Calendly
- Cal.com
- HubSpot Forms
- Tally
- Typeform
- Jotform
- Google Forms
- SurveyMonkey

### Documentation and support

- Notion
- Confluence
- GitBook
- Mintlify
- Guru
- Zendesk
- Intercom
- Freshdesk
- Help Scout
- Helpjuice
- Document360
- Slite

### Websites and publishing

- Webflow
- Framer
- Wix
- Squarespace
- Ghost
- Bubble
- Medium
- Canva
- Product Hunt
- G2
- SourceForge

### Digital sales rooms

- Flowla
- Journey.io
- Paage.io
- Distribute

## 17. Team collaboration

- Shared workspaces
- Creator seats
- View-only collaborators
- Role-based access
- Collaborative comments
- Threaded comments
- Emoji reactions
- Resolve/reopen comments
- Mentions and notifications
- Shared folders
- Content approvals
- Publishing permissions
- Workspace branding
- Workspace analytics
- Centralized seat management

## 18. Enterprise administration

- Multiple workspaces
- Workspace-level settings
- Workspace-level branding
- Admin dashboard
- Role-based access control
- SAML 2.0 SSO
- Okta integration
- Microsoft Azure integration
- Google SSO integration
- OneLogin integration
- Automatic SSO user joining
- Audit logs
- Data export
- Custom data retention
- Custom data residency
- Centralized content governance
- Custom security policies
- Dedicated support
- Private support channel
- Training and onboarding
- Uptime SLA

## 19. Security and privacy

- TLS encryption in transit
- AES-256 encryption at rest
- Tenant data isolation
- Secure object storage
- Signed/private asset URLs
- Workspace-level authorization
- Secure API keys
- API-key rotation
- Audit logging
- SSO and identity-provider controls
- GDPR support
- SOC 2 Type II controls
- Data processing agreement
- Consent management
- Data deletion workflows
- Configurable retention periods
- AI provider data-retention controls
- Customer data excluded from model training
- Secure sandbox isolation
- Protection against malicious uploaded content

## 20. Platform and operational requirements

- CDN-backed media delivery
- Image and video transcoding
- Thumbnail generation
- Background processing jobs
- Queue-based analytics ingestion
- Search indexing
- Caching
- Autoscaling
- Error monitoring
- Audit and application logs
- Usage metering
- Rate limiting
- Backup and disaster recovery
- Feature flags
- Multi-region deployment option
- Status monitoring
- Automated testing
- Browser compatibility testing
- Mobile responsive testing

## 21. Suggested implementation phases

### Phase 1: Core MVP

- Authentication
- Workspace and user management
- Screenshot upload
- Demo player
- Hotspots
- Basic editor
- Share links
- Inline embeds
- Basic analytics

### Phase 2: Professional demo platform

- Browser recorder
- Video recording
- Chapters
- Branching
- Forms and lead capture
- Branding
- Trackable and expiring links
- Showcases
- Comments
- CRM and Slack integrations

### Phase 3: Advanced personalization

- Dynamic variables
- Conditional experiences
- In-app Demo Hub
- RouteHub
- HTML cloning
- AI text, scripts, translation, and voiceover
- Advanced analytics

### Phase 4: Sandbox and AI platform

- Secure sandbox demos
- AI Demo Agents
- AI Demo Audit
- Voice cloning
- AI data editing
- Conversational qualification
- Intelligent handoff

### Phase 5: Enterprise

- Multiple workspaces
- SAML SSO
- RBAC expansion
- Audit logs
- Data residency
- Data retention policies
- Enterprise exports
- Dedicated administration and governance

## 22. Minimum team needed for a full product

- Product manager
- Product designer
- Frontend engineers
- Backend engineers
- Browser-extension engineer
- Media infrastructure engineer
- DevOps/platform engineer
- Security engineer
- Data/analytics engineer
- AI/ML engineer
- QA and automation engineer

A credible MVP can be built by a small team. A reliable platform containing HTML cloning, sandboxing, AI agents, analytics, integrations, and enterprise security requires a much larger, specialized engineering effort.

## 23. Research-led functionality additions

The following requirements were added after reviewing public Supademo feedback, Reddit discussions, Product Hunt comments, G2 reviews, and official competitor documentation. Evidence and rationale are maintained in `PRODUCT_RESEARCH.md`.

### Creation reliability and recovery

- Explicit Screenshot, HTML, and Video recording modes
- Recording mode lock; no automatic mode switch without confirmation
- Visible recording indicator
- Per-step capture confirmation
- Missed-click and duplicate-click detection
- Local recording journal
- Resume interrupted recording
- Long-recording health and memory controls
- Capture diagnostics and repair
- Reliable autosave with visible state
- Local draft recovery
- Conflict detection and resolution
- Offline editing warning and safe retry

### Full-page and scrolling capture

- Full-page screenshot capture
- Stitched scrolling capture
- Scrollable HTML capture
- Scroll position and scroll-depth preservation
- Fixed/sticky element handling
- Preview and crop before upload
- Capture-size and page-complexity safeguards

### Demo maintenance and recapture

- Source URL and capture-provenance metadata
- Single-step recapture
- Collection and bulk recapture
- Old-versus-new visual comparison
- Anchor and hotspot preservation with confidence score
- Manual remapping when automatic anchoring is uncertain
- Broken-target and missing-asset diagnostics
- Demo freshness status
- Optional approved-source change monitoring
- “Used by” impact view for shared captures
- Update existing published links and embeds without replacing snippets
- Reusable synchronized capture and component collections

### Bulk editing and library maintenance

- Multi-step and multi-demo selection
- Bulk text, voice, theme, visibility, locale, variable, and branding changes
- Bulk recapture and asset replacement
- Dry-run preview and affected-item count
- Partial-failure report and retry
- Undo or restore point for bulk operations
- Content-health dashboard for stale, broken, untranslated, or inaccessible demos

### A/B experiments

- Experiments over immutable published variants
- Stable experiment URL and embed
- Configurable traffic split
- Control and treatment variants
- Start, pause, resume, stop, and scheduled end
- Primary metric and guardrail metrics
- Completion, CTA, lead, and intent outcomes
- Sample-size and uncertainty reporting
- Minimum-runtime guardrails
- Segment and device breakdown
- Winner promotion without changing the public URL
- Experiment history and audit log

### Advanced mobile experiences

- Live desktop, tablet, and mobile preview
- Responsive HTML strategy
- Scale-to-width and scale-to-fit strategies
- Pinch-to-zoom and pan strategy
- Mobile swipe-story strategy
- Custom image/video mobile fallback
- Optional mobile-specific hotspot position and visibility
- Multiple hotspots on mobile
- Touch-safe target validation
- Mobile publication diagnostics

### Presenter and event mode

- Per-step private presenter notes
- Clean audience view
- Dual-screen presenter view
- Keyboard navigation and presenter shortcuts
- Toggle hotspot beacons and guidance
- Click-anywhere progress option
- Free-navigation mode for live calls
- Kiosk/event mode
- Automatic reset between event viewers
- Associate presentation with account, contact, or CRM opportunity
- Record presentation activity separately from anonymous self-guided views

### Multi-format output and portability

- MP4 export
- Animated GIF export
- PDF step guide export
- Accessible SOP/document export
- Numbered plain-text export
- Email-safe static or animated preview linked to the demo
- Export templates and brand settings
- Background export jobs and expiring downloads
- Installable offline PWA/player
- Encrypted offline demo packages
- Offline package expiry, update, and revocation metadata
- Portable self-hosted package for approved plans
- Optional analytics relay for self-hosted packages
- Export manifest and integrity verification

### Embed performance and lifecycle

- Lazy-load preview overlay
- Configurable overlay image, blur, and CTA
- Disable preload option
- Inline, full-page, and popup embeds
- JavaScript load, open, close, destroy, and reload methods
- Lifecycle callbacks
- Multiple embeds on one page
- Host-page performance budget
- Graceful fallback when scripts are blocked

### Review and approval workflow

- Preview links that do not affect production analytics
- Reviewer-only access
- Review request and due date
- Required approvers
- Approval, rejection, and change-request states
- Step- and component-level comments
- Approval history
- Publish gate when approval is required
- Review comparison between draft and published version

### Assessments and training

- Quiz blocks
- Single-choice and multiple-choice questions
- Free-text questions with manual review option
- Correct-answer explanations
- Score and pass threshold
- Attempt limits and retry policy
- Completion status
- Assessment analytics
- Optional certificate generation
- LMS-ready xAPI event model
- SCORM/xAPI package export after the core model is validated

### Deeper analytics

- Click heatmaps
- Hotspot interaction heatmaps
- Scroll-depth analytics
- Path and branch comparison
- Segment and cohort comparison
- Mobile-versus-desktop comparison
- Account and stakeholder engagement timeline
- Buying-committee discovery
- CRM opportunity influence
- Content-freshness and maintenance analytics
- Experiment analytics
- Assessment completion and score analytics

### Faster AI-assisted creation

- Convert an existing product video into candidate steps
- Detect candidate clicks, scene changes, and narration segments
- Generate a draft from Figma frames or uploaded mockups
- Generate a storyboard from a product description or use case
- Suggest a flow from a captured screen collection
- Suggest missing screens and alternate paths
- Require creator preview and confirmation before applying
- Preserve provenance for generated steps and text

### Granular media timing

- Transition type, duration, and easing per step
- Narration start/end offsets
- Silence insertion and removal
- Audio ducking envelopes
- Caption timing editor
- Motion and voice timeline
- Crossfade and gap controls
- Preview at exact player timing
- Reduced-motion and muted fallback behavior

### Privacy and search indexing

- Explicit search-engine indexing control per publication
- `noindex` default for private, preview, gated, personalized, and expiring links
- Publication privacy summary
- Robots and canonical metadata controls
- Preview links excluded from production analytics
- Clear warning before making a previously private demo public

### Packaging-enabling capabilities

- Solo or single-demo entitlement model
- Free reviewer/view-only membership support
- External viewers independent from creator-seat count
- Data and demo portability after plan changes
- Billing provider separated from feature authorization

## 24. Simple creator UI standard

The product must expose advanced capabilities through a simple, presentation-like interface. Detailed interaction requirements are defined in `UI_REQUIREMENTS.md`.

### Default mental model

- Record
- Edit
- Share

### Default editor layout

- Step thumbnails and chapters on the left
- Selected screen on the central canvas
- Contextual properties on the right
- Save state, Preview, and Share in the top bar
- Timeline hidden unless editing video, audio, or motion

### Simplicity requirements

- One clear primary action per view
- Simple mode by default
- Advanced settings shown contextually
- No more than seven equally weighted toolbar actions
- Plain product language rather than implementation terminology
- Inline editing before modal workflows
- Templates and presets before raw configuration
- Visible autosave and recording state
- Empty, loading, error, disabled, and permission states
- Keyboard-accessible operation
- WCAG 2.2 AA target
- Responsive viewer and mobile preview
- Feature additions must not add top-level navigation without explicit product justification

### Core usability targets

- A first-time user can create and publish a basic screenshot demo without documentation.
- The median first-demo journey target is five minutes or less after sign-in.
- Replacing a screen, adding a hotspot, previewing, and republishing stays within the editor.
- Simple demo creation never requires opening Advanced settings.
- Common direct-manipulation feedback begins within 100 milliseconds under the supported performance fixture.

## 25. Research-led release priorities

### Priority 0 — Trust and ease of use

- Simple deck-like UI
- Capture reliability
- Autosave and recovery
- Mobile preview and rendering
- Flexible template-led customization
- Publishing privacy controls
- Preview-only review links

### Priority 1 — Growth and maintenance

- Recapture and content freshness
- Reusable synchronized captures
- Bulk editing
- A/B testing
- Presenter and offline modes
- Multi-format exports
- Lazy-load embeds
- Advanced analytics and assessments
- AI-assisted creation from existing materials

### Priority 2 — Differentiation

- Portable self-hosted packages
- Automated source-change monitoring
- SCORM/xAPI packages
- AI-assisted library-wide maintenance
- Account buying-committee and opportunity-influence analytics
