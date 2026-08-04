# Supademo-Style Platform: 200-Task Engineering Roadmap

This roadmap converts `SUPADEMO_FEATURE_SPEC.md` and `architecture.md` into an implementation sequence suitable for a high-quality engineering team. Tasks are intentionally ordered so the product remains runnable after every task and each milestone creates a demonstrable increment.

## How agents must execute this roadmap

Before starting a task, the implementing agent must read:

1. `AGENTS.md`
2. `architecture.md`
3. `SUPADEMO_FEATURE_SPEC.md`
4. `PRODUCT_RESEARCH.md`
5. `UI_REQUIREMENTS.md` for any creator- or viewer-facing change
6. This task's dependencies and quality bar

Execution rules:

- Implement one task at a time unless an authorized human explicitly groups tasks.
- Begin by confirming that all dependencies are complete in the current codebase.
- Do not silently expand scope. Record newly discovered work as a proposed follow-up task.
- Keep every commit deployable and preserve backward compatibility unless a task explicitly authorizes a breaking change.
- Database migrations must support rolling deployments and include rollback/recovery notes.
- Add tests at the lowest useful level and at least one integration or end-to-end test for each user-visible vertical slice.
- Update relevant docs, API schemas, environment examples, and architecture decisions in the same task.
- Run the applicable functional and security checks from `AGENTS.md`.
- Complete the mandatory security handoff to Claude after implementation.
- A task is not complete while Claude has unresolved BLOCKER or HIGH findings.
- Creator-facing work must preserve the `Record → Edit → Share` mental model and use progressive disclosure for advanced features.
- A feature is not complete if it makes the basic screenshot-demo journey harder or adds unexplained permanent navigation/toolbars.
- Mark the task checkbox only after deliverables and quality criteria are verified.

Global definition of done:

- The requested behavior works locally from a clean checkout using documented commands.
- Existing behavior and tests remain green.
- Error, empty, loading, permission-denied, and retry states are handled where applicable.
- Accessibility meets WCAG 2.2 AA for changed user interfaces.
- API inputs are schema-validated and tenant authorization is server-enforced.
- Logs and metrics are sufficient to diagnose failures without leaking secrets or personal data.
- No high or critical dependency, secret, static-analysis, container, or infrastructure finding remains unresolved.
- Documentation explains how to use, test, operate, and roll back the change.

## Milestone 1 — Engineering foundation

Outcome: A reproducible monorepo with a working local application, API, worker, data services, tests, and secure CI baseline.

### [x] TASK-001 — Scaffold the monorepo

- **Depends on:** None.
- **Deliverables:** Create the `apps/web`, `apps/api`, `apps/worker`, and shared `packages` structure described in `architecture.md`; configure workspaces, TypeScript project references, root scripts, package boundaries, and a minimal README with bootstrap commands.
- **Quality bar:** A clean checkout installs deterministically, builds all packages, and starts placeholder web/API processes; dependency directions are enforced so applications cannot form circular imports.

### [x] TASK-002 — Establish code-quality tooling

- **Depends on:** TASK-001.
- **Deliverables:** Add formatting, linting, strict TypeScript configuration, import rules, commit conventions, editor settings, and root commands for `format`, `lint`, `typecheck`, and `build`.
- **Quality bar:** Zero baseline warnings; unsafe TypeScript escapes require documented justification; CI-friendly commands return non-zero on violations and produce readable diagnostics.

### [x] TASK-003 — Build the complete local service stack

- **Depends on:** TASK-001.
- **Deliverables:** Add Docker Compose for PostgreSQL, Redis, MinIO, an SQS-compatible queue, and Mailpit; include health checks, persistent volumes, bootstrap scripts, safe local credentials, and documented reset/inspect commands.
- **Quality bar:** `docker compose up` becomes healthy without AWS credentials; services survive normal restarts; a reset is explicit and cannot accidentally target production.

### [x] TASK-004 — Implement typed configuration and secret boundaries

- **Depends on:** TASK-001, TASK-003.
- **Deliverables:** Create a configuration package with environment schemas, local defaults, `.env.example`, startup validation, secret redaction, and adapters for local environment variables versus AWS Secrets Manager/Parameter Store.
- **Quality bar:** Missing or malformed required configuration fails fast with no secret values in errors or logs; tests cover local, test, and production configuration rules.

### [x] TASK-005 — Establish database migrations and access patterns

- **Depends on:** TASK-003, TASK-004.
- **Deliverables:** Select and configure the PostgreSQL migration/query tooling; add migration commands, transaction helpers, connection pooling, timestamps, UUIDv7/ULID conventions, and a health query.
- **Quality bar:** Migrations apply from empty state, are repeatably tested in CI, and have documented rollback/recovery guidance; runtime database credentials cannot modify schema.

### [x] TASK-006 — Create the API service baseline

- **Depends on:** TASK-002, TASK-004, TASK-005.
- **Deliverables:** Add the HTTP server, request IDs, health/readiness endpoints, API versioning, schema validation, structured error responses, OpenAPI generation, graceful shutdown, and database connectivity.
- **Quality bar:** Invalid input never reaches handlers; errors expose no internals; readiness reflects real dependencies; integration tests start the API against local services.

### [x] TASK-007 — Create the web application baseline

- **Depends on:** TASK-002, TASK-004.
- **Deliverables:** Add the React/Next.js application, typed API client generation, root layouts, error boundary, not-found page, environment-safe runtime configuration, and a page that verifies API connectivity.
- **Quality bar:** No server secret is included in client bundles; first load, API failure, and offline states are usable; production build has no warnings or hydration errors.

### [x] TASK-008 — Create queue and worker foundations

- **Depends on:** TASK-003, TASK-004, TASK-005.
- **Deliverables:** Implement queue abstraction, SQS-compatible local adapter, worker process, job envelope, retries, dead-letter handling, idempotency key support, graceful shutdown, and a sample end-to-end job.
- **Quality bar:** Duplicate delivery does not duplicate effects; poison jobs reach a dead-letter queue; tests cover retry exhaustion, timeout, and shutdown during processing.

### [ ] TASK-009 — Add observability foundations

- **Depends on:** TASK-006, TASK-008.
- **Deliverables:** Add structured JSON logging, log redaction, correlation IDs across HTTP/jobs, metrics abstraction, OpenTelemetry tracing hooks, frontend error capture interface, and a local observability guide.
- **Quality bar:** A sample request can be traced into a worker job; credentials and personal data are redacted by tests; logging failures never break user requests.

### [ ] TASK-010 — Build CI and security gates

- **Depends on:** TASK-002 through TASK-009.
- **Deliverables:** Add CI for install, lint, typecheck, unit/integration tests, build, migration test, secret scan, dependency audit, SAST, container scan, and infrastructure scan placeholders; publish test artifacts and coverage.
- **Quality bar:** CI runs from a clean environment with least-privilege permissions, blocks high/critical findings, pins third-party actions, and documents any intentionally deferred scanner with an owner.

## Milestone 2 — Design system and application shell

Outcome: A cohesive, accessible interface foundation that supports dashboards, editors, players, and responsive workflows.

### [ ] TASK-011 — Define product design tokens

- **Depends on:** TASK-007.
- **Deliverables:** Add semantic tokens for color, typography, spacing, radius, shadow, motion, z-index, and breakpoints; support light/dark modes and branded theme overrides.
- **Quality bar:** Tokens meet contrast requirements, avoid raw values in application components, and are documented with usage examples and prohibited combinations.

### [ ] TASK-012 — Build core UI primitives

- **Depends on:** TASK-011.
- **Deliverables:** Implement Button, IconButton, Link, Input, Textarea, Select, Checkbox, Radio, Switch, Tooltip, Badge, Avatar, Separator, and Spinner primitives.
- **Quality bar:** Components support keyboard use, focus visibility, disabled/loading/error states, accessible names, and automated accessibility tests; APIs are typed and composable.

### [ ] TASK-013 — Build overlay and feedback primitives

- **Depends on:** TASK-012.
- **Deliverables:** Implement Modal, AlertDialog, Popover, Dropdown, Toast, Banner, InlineAlert, Skeleton, and EmptyState components with focus management and portal layering.
- **Quality bar:** Escape, outside-click, focus trap/restore, nested overlays, screen-reader announcements, and reduced-motion behavior are tested.

### [ ] TASK-014 — Build layout and navigation primitives

- **Depends on:** TASK-011, TASK-012.
- **Deliverables:** Implement responsive Stack, Grid, Container, SplitPane, Sidebar, Header, Breadcrumb, Tabs, and pagination components.
- **Quality bar:** Layouts work from 320px through wide desktop sizes without horizontal overflow; landmarks and tab semantics are correct.

### [ ] TASK-015 — Implement the authenticated app shell

- **Depends on:** TASK-013, TASK-014.
- **Deliverables:** Create dashboard shell with global navigation, workspace switcher placeholder, account menu, responsive sidebar, command palette shell, and route-level loading/error boundaries.
- **Quality bar:** Keyboard-only navigation reaches all controls in a logical order; mobile navigation is fully operable; deep links render correctly after refresh.

### [ ] TASK-016 — Establish forms architecture

- **Depends on:** TASK-012, TASK-013.
- **Deliverables:** Add typed form state, client/server validation mapping, field descriptions, error summaries, dirty-state protection, and reusable submit behavior.
- **Quality bar:** Server errors map to fields without losing user input; invalid submission moves focus to a useful error; sensitive values are never logged.

### [ ] TASK-017 — Build data-display components

- **Depends on:** TASK-012, TASK-014.
- **Deliverables:** Implement accessible Table, List, Card, Stat, Timeline, Progress, and virtualized collection primitives with sorting and selection hooks.
- **Quality bar:** Large lists remain responsive, empty/loading/error states are explicit, and table semantics remain intact at responsive breakpoints.

### [ ] TASK-018 — Establish iconography and media presentation

- **Depends on:** TASK-011.
- **Deliverables:** Add an approved icon set, responsive Image/Thumbnail/AspectRatio components, fallback visuals, and rules for product screenshots and device frames.
- **Quality bar:** Icons are tree-shaken and accessible; image dimensions prevent layout shift; untrusted remote image sources are not enabled by default.

### [ ] TASK-019 — Add component documentation and visual testing

- **Depends on:** TASK-012 through TASK-018.
- **Deliverables:** Add Storybook or equivalent component workbench, representative states, automated interaction tests, accessibility checks, screenshot baselines, and simple-versus-advanced disclosure examples.
- **Quality bar:** Every shared component has normal, error, disabled, loading, and dark-mode coverage where applicable; visual diffs are deterministic; components do not require icon-only or jargon-heavy usage for primary actions.

### [ ] TASK-020 — Validate the design-system release

- **Depends on:** TASK-019.
- **Deliverables:** Create a reference “UI laboratory” route, implement and test the `Record → Edit → Share` navigation model, run responsive/accessibility audits, document progressive-disclosure rules, and remove one-off styles from the app shell.
- **Quality bar:** No serious automated accessibility findings, no console errors, and no unexplained visual-regression changes; usability testing confirms one clear primary action per view and no more than seven equally weighted toolbar actions.

## Milestone 3 — Authentication, tenancy, and permissions

Outcome: Users can securely sign in, create and join workspaces, and exercise server-enforced roles with tenant isolation.

### [ ] TASK-021 — Implement the identity-provider abstraction

- **Depends on:** TASK-004, TASK-006, TASK-007.
- **Deliverables:** Define identity interfaces, local development identity provider, production Cognito adapter contract, token/session model, and authenticated request middleware.
- **Quality bar:** Local auth cannot be enabled in production; token claims are validated for issuer/audience/expiry; tests cover invalid, expired, and malformed credentials.

### [ ] TASK-022 — Build sign-up, sign-in, and account recovery

- **Depends on:** TASK-016, TASK-021.
- **Deliverables:** Implement sign-up, email verification abstraction, sign-in, sign-out, forgot/reset password, session refresh, and corresponding accessible screens.
- **Quality bar:** Enumeration-resistant responses, rate limits, secure cookies where used, no password logging, and end-to-end tests for success and failure paths.

### [ ] TASK-023 — Add users and profiles

- **Depends on:** TASK-005, TASK-021.
- **Deliverables:** Create user/profile schema, identity-to-user synchronization, display name/avatar/timezone/preferences APIs, and profile settings UI.
- **Quality bar:** Identity reconciliation is idempotent; profile inputs are validated and safely rendered; account deletion implications are documented.

### [ ] TASK-024 — Add organizations and workspaces

- **Depends on:** TASK-023.
- **Deliverables:** Create organization, workspace, membership, and role schemas; build workspace creation and listing APIs with transactional creator membership.
- **Quality bar:** Names/slugs are validated, creation is idempotent, every tenant record has an owner context, and tests cover partial-failure rollback.

### [ ] TASK-025 — Implement workspace switching and onboarding

- **Depends on:** TASK-015, TASK-024.
- **Deliverables:** Add first-run onboarding, workspace switcher, persisted current-workspace preference, empty states, and safe redirect handling.
- **Quality bar:** Switching cannot expose cached data from another workspace; stale/deleted workspace selections recover safely; keyboard and mobile flows pass tests.

### [ ] TASK-026 — Implement invitations and membership lifecycle

- **Depends on:** TASK-022, TASK-024.
- **Deliverables:** Add invite creation, email delivery, secure acceptance tokens, expiry/revocation, resend, membership removal, and leave-workspace flows.
- **Quality bar:** Tokens are single-use, hashed at rest, scoped, and time-limited; removing the final owner is prevented; replay and cross-workspace tests pass.

### [ ] TASK-027 — Implement centralized authorization policies

- **Depends on:** TASK-024, TASK-026.
- **Deliverables:** Define Admin, Creator/Editor, Viewer, and Guest capabilities; implement policy checks in a shared backend authorization layer and expose capability hints to the UI.
- **Quality bar:** The server remains authoritative; every policy has allow/deny tests; default behavior is deny; UI hints are never used as enforcement.

### [ ] TASK-028 — Enforce tenant-safe repositories

- **Depends on:** TASK-027.
- **Deliverables:** Create tenant-scoped repository patterns, prohibit unscoped resource lookup in application code, and add cross-workspace integration test fixtures.
- **Quality bar:** Automated tests prove workspace A cannot read or mutate workspace B resources across representative CRUD operations; unsafe repository calls fail lint or review.

### [ ] TASK-029 — Add session, CSRF, and CORS protections

- **Depends on:** TASK-021, TASK-027.
- **Deliverables:** Finalize cookie/token strategy, CSRF protections, strict CORS allowlists, session revocation, security headers, and sensitive-action reauthentication hooks.
- **Quality bar:** Browser security tests cover forged origins and CSRF attempts; cookies and headers use production-safe defaults; extension/embed origins are explicitly modeled.

### [ ] TASK-030 — Deliver workspace member administration

- **Depends on:** TASK-025 through TASK-029.
- **Deliverables:** Build member list, invite, role-change, remove, and pending-invite screens with audit events and permission-aware actions.
- **Quality bar:** End-to-end tests cover each role and cross-tenant denial; destructive actions require confirmation; UI updates reconcile correctly after API failures.

## Milestone 4 — Dashboard and content organization

Outcome: Teams can create, find, organize, collaborate on, and lifecycle-manage demo records before editor functionality is introduced.

### [ ] TASK-031 — Define demo metadata and lifecycle

- **Depends on:** TASK-028.
- **Deliverables:** Add demo schema with workspace, owner, title, description, type, status, timestamps, and soft-delete fields; implement tenant-safe CRUD APIs.
- **Quality bar:** State transitions are explicit and validated; delete is recoverable; audit events and authorization tests cover every mutation.

### [ ] TASK-032 — Build the demo dashboard

- **Depends on:** TASK-017, TASK-031.
- **Deliverables:** Create grid/list views, new-demo action, loading/empty/error states, pagination, sorting, and reusable demo cards with thumbnails.
- **Quality bar:** Dashboard remains responsive with at least 1,000 seeded records; no cross-workspace cache leakage; URL captures sort/view state.

### [ ] TASK-033 — Add folders and subfolders

- **Depends on:** TASK-031, TASK-032.
- **Deliverables:** Add hierarchical folder schema, CRUD/move APIs, sidebar tree, breadcrumbs, drag/move interaction, and unfiled view.
- **Quality bar:** Cycles and excessive depth are prevented; moving/deleting folders preserves content according to documented rules; concurrent changes fail safely.

### [ ] TASK-034 — Add tags, search, and filtering

- **Depends on:** TASK-032.
- **Deliverables:** Add workspace tags, title/description search, filters for owner/type/status/tag/date, debounced query UI, and shareable filter URLs.
- **Quality bar:** Queries are indexed and tenant-scoped; malicious search input is harmless; empty and no-result states distinguish their causes.

### [ ] TASK-035 — Add archive, trash, restore, and permanent deletion

- **Depends on:** TASK-031, TASK-033.
- **Deliverables:** Implement archive/unarchive, soft delete, trash listing, restore, retention display, and authorized permanent-delete job.
- **Quality bar:** Deletion is idempotent, references and assets follow documented retention rules, and irreversible actions require explicit confirmation and audit logging.

### [ ] TASK-036 — Add demo duplication and templates

- **Depends on:** TASK-031.
- **Deliverables:** Implement transactional duplication, template designation, create-from-template flow, copied metadata rules, and background copying for large records.
- **Quality bar:** Copies never share mutable child records; tenant ownership is reassigned correctly; retries cannot create uncontrolled duplicates.

### [x] TASK-037 — Add comments domain and APIs

- **Depends on:** TASK-028, TASK-031.
- **Deliverables:** Create comments, threads, mentions, reactions, resolution state, and target references for demos/steps; implement permission-aware APIs.
- **Quality bar:** User-generated content is sanitized; mention fan-out is bounded; deleted targets/users render safely; tenant-isolation tests cover all operations.

### [x] TASK-038 — Build collaborative comments UI

- **Depends on:** TASK-013, TASK-037.
- **Deliverables:** Add comment panel, threads, replies, mentions, reactions, resolve/reopen actions, deep links, and optimistic updates.
- **Quality bar:** Keyboard and screen-reader flows are complete; conflicting updates reconcile visibly; unsafe links or markup cannot execute.

### [x] TASK-039 — Add in-app notifications

- **Depends on:** TASK-008, TASK-037.
- **Deliverables:** Add notification schema, unread count, notification center, email preference hooks, comment/invite notifications, review requests, approval/change-request states, required approvers, publish-gate hook, and mark-read actions.
- **Quality bar:** Delivery is idempotent and tenant-safe; notification storms are coalesced; unread counts remain correct under concurrent tabs; approval history is immutable and cannot be bypassed by a UI-only publish action.

### [x] TASK-040 — Harden and benchmark dashboard workflows

- **Depends on:** TASK-031 through TASK-039.
- **Deliverables:** Add representative seed data, dashboard end-to-end suite, query plans/indexes, accessibility audit, responsive polish, user-facing recovery for failed mutations, and a content-health view for stale, broken, untranslated, unapproved, or failed demos.
- **Quality bar:** Defined dashboard performance budget passes with 1,000 demos and nested folders; health status is explainable and actionable; no serious accessibility or authorization findings remain.

## Milestone 5 — Asset storage and media pipeline

Outcome: Creators can safely upload, inspect, process, reuse, and delete images, audio, and video using local S3-compatible storage and asynchronous workers.

### [x] TASK-041 — Define asset metadata and storage abstraction

- **Depends on:** TASK-005, TASK-028.
- **Deliverables:** Add asset/upload schemas, lifecycle states, workspace ownership, checksum/size/type metadata, object-storage interface, MinIO adapter, and S3 adapter contract.
- **Quality bar:** Object keys are server-generated, tenant-scoped, and immutable; private/public states are explicit; storage adapter contract tests run locally.

### [ ] TASK-042 — Implement direct multipart upload sessions

- **Depends on:** TASK-041.
- **Deliverables:** Add quota-checked upload initialization, constrained presigned parts, finalize/abort APIs, checksum verification, expiry, and client upload contracts.
- **Quality bar:** Large files never transit the API; unauthorized users cannot finalize another upload; duplicate finalization is idempotent; size/count limits are enforced.

### [ ] TASK-043 — Build resilient upload UI

- **Depends on:** TASK-016, TASK-042.
- **Deliverables:** Add drag/drop and file picker, multi-file queue, progress, pause/cancel/retry, client prechecks, accessible status announcements, and navigation protection.
- **Quality bar:** Interrupted uploads resume or fail with clear recovery; duplicate selections are handled; mobile and keyboard workflows pass interaction tests.

### [x] TASK-044 — Build upload validation and quarantine

- **Depends on:** TASK-008, TASK-042.
- **Deliverables:** Add finalize event job, file-signature detection, MIME/extension comparison, malware-scan adapter, quarantine state, rejection reasons, and publication blocking.
- **Quality bar:** Polyglot/mismatched files, oversized assets, traversal names, and scanner failures are rejected securely; raw uploads remain private.

### [x] TASK-045 — Implement image processing

- **Depends on:** TASK-044.
- **Deliverables:** Add isolated image worker for safe decode, dimensions, orientation, metadata stripping, thumbnails, optimized web formats, and bounded redaction/crop transforms.
- **Quality bar:** Pixel/decompression limits prevent bombs; malformed files cannot crash the worker fleet; transformations are deterministic and covered by fixture tests.

### [x] TASK-046 — Implement audio and video processing baseline

- **Depends on:** TASK-044.
- **Deliverables:** Add FFmpeg worker, metadata probing, constrained transcoding, poster frame, waveform, standard playback renditions, progress, timeout, and failure handling.
- **Quality bar:** Commands use fixed argument arrays, not shell interpolation; CPU/memory/time/output limits exist; malicious and truncated-media fixtures fail safely.

### [x] TASK-047 — Build the workspace asset library

- **Depends on:** TASK-045, TASK-046.
- **Deliverables:** Add searchable/filterable asset and capture library, grid/list views, preview, processing/rejected states, metadata panel, reusable synchronized collections, “used by” impact view, selection callback, and opt-in reuse across demos.
- **Quality bar:** Private asset URLs are short-lived; large libraries paginate/virtualize; inaccessible asset IDs reveal no metadata; shared-content changes require an impact preview and never silently mutate published versions.

### [x] TASK-048 — Implement quotas, references, and deletion lifecycle

- **Depends on:** TASK-041, TASK-047.
- **Deliverables:** Add workspace storage counters, asset reference tracking, deletion eligibility, soft deletion, delayed object cleanup, abandoned-upload cleanup, and admin usage view.
- **Quality bar:** Referenced assets cannot be accidentally removed; counters repair from source data; cleanup jobs are idempotent and support dry run.

### [x] TASK-049 — Add upload recovery and background progress

- **Depends on:** TASK-043, TASK-046.
- **Deliverables:** Persist active uploads locally, restore after refresh, expose processing status endpoint/SSE, reconnect safely, and notify users when media becomes ready.
- **Quality bar:** Multi-tab and reconnect behavior does not duplicate uploads or listeners; stale sessions expire; progress endpoints are tenant-authorized.

### [x] TASK-050 — Security and load qualification for media

- **Depends on:** TASK-041 through TASK-049.
- **Deliverables:** Add malicious-file corpus, concurrent-upload load test, queue saturation test, quota abuse tests, presigned URL tests, worker-failure runbook, and media observability dashboard specification.
- **Quality bar:** Agreed upload throughput and latency budgets pass locally/staging; no raw/quarantined asset is publicly reachable; Claude security review approves the full media boundary.

## Milestone 6 — Demo document and editor foundation

Outcome: Creators can assemble media into versioned demo drafts using a stable editor with autosave, undo/redo, responsive previews, and conflict handling.

### [x] TASK-051 — Define the canonical demo document model

- **Depends on:** TASK-031, TASK-041.
- **Deliverables:** Define typed schemas for demo settings, steps, media references, layout, component IDs, ordering, and document version; specify backward-compatible serialization and validation.
- **Quality bar:** Invalid and unknown document shapes fail predictably; schema fixtures support round-trip serialization; IDs remain stable during reordering and editing.

### [x] TASK-052 — Implement drafts, revisions, and immutable snapshots

- **Depends on:** TASK-051.
- **Deliverables:** Add draft/revision tables, repository, snapshot policy, revision metadata, restore API, and compaction strategy for long edit histories.
- **Quality bar:** Restore never mutates historical snapshots; writes are transactional; concurrent revision tests prevent lost updates and cross-workspace access.

### [x] TASK-053 — Build the editor route and workspace

- **Depends on:** TASK-015, TASK-051, TASK-052.
- **Deliverables:** Create editor shell with top bar, step rail, canvas region, inspector region, save state, preview/publish placeholders, and permission-aware read-only mode.
- **Quality bar:** Direct links, refresh, unavailable demo, deleted demo, and permission-denied states behave correctly; layout remains usable on laptop-sized screens.

### [x] TASK-054 — Build the step timeline

- **Depends on:** TASK-047, TASK-053.
- **Deliverables:** Add step list with thumbnails, add-from-assets, duplicate, delete, reorder, multi-select, keyboard reordering, and selected-step URL/state synchronization; add bulk theme, text, voice, visibility, locale, variable, and asset-replacement actions with dry-run impact preview.
- **Quality bar:** Reordering and bulk selection across 200 steps remain responsive; focus is preserved; destructive/bulk changes create an undoable restore point, report partial failures, and do not orphan assets.

### [x] TASK-055 — Establish the canvas coordinate system

- **Depends on:** TASK-053.
- **Deliverables:** Implement zoomable editor canvas, media aspect-ratio fitting, normalized coordinates, transforms between screen/canvas space, safe-area guides, and resize observation.
- **Quality bar:** Component positions remain accurate across viewport sizes, zoom levels, image dimensions, and device previews; mathematical conversion tests cover edge cases.

### [x] TASK-056 — Implement autosave and optimistic concurrency

- **Depends on:** TASK-052, TASK-053.
- **Deliverables:** Add debounced patch saving, always-visible `Saving/Saved/Offline/Conflict` state, encrypted or origin-protected local draft journal, optimistic revision numbers, retry behavior, restart recovery, conflict detection, and safe conflict-resolution UI.
- **Quality bar:** Simulated latency, disconnects, browser crashes, duplicate requests, two-tab edits, and server errors cannot silently lose data; save success is never communicated only by a toast; sensitive draft content is not logged.

### [x] TASK-057 — Implement command-based undo and redo

- **Depends on:** TASK-054 through TASK-056.
- **Deliverables:** Create typed editor commands, reversible operations, bounded history, command grouping, keyboard shortcuts, and save integration.
- **Quality bar:** Every currently supported edit is reversible; undo after save and redo after transient failure are deterministic; history memory is bounded.

### [x] TASK-058 — Add preview and device modes

- **Depends on:** TASK-055.
- **Deliverables:** Add desktop/tablet/mobile frame presets, fit/actual-size controls, creator preview mode, and separation between edit interactions and viewer interactions.
- **Quality bar:** Preview uses the same rendering package planned for published playback; no edit-only state leaks into document serialization.

### [x] TASK-059 — Add editor keyboard and productivity controls

- **Depends on:** TASK-057.
- **Deliverables:** Add documented shortcuts for save, undo/redo, duplicate, delete, navigation, zoom, selection, and command palette; add contextual shortcut help.
- **Quality bar:** Shortcuts avoid browser/assistive-technology conflicts, respect text inputs, and have complete keyboard-only task coverage.

### [x] TASK-060 — Qualify the editor foundation

- **Depends on:** TASK-051 through TASK-059.
- **Deliverables:** Add end-to-end editor suite, 200-step performance fixture, autosave chaos tests, revision restore test, accessibility audit, and editor state architecture decision record.
- **Quality bar:** Editing remains within defined interaction/paint budgets; no lost-update scenario in the test matrix; all editor data survives reload and restore.

## Milestone 7 — Hotspots, annotations, effects, and audio

Outcome: Creators can visually guide viewers using interactive hotspots, explanatory overlays, privacy tools, motion effects, and narration.

### [x] TASK-061 — Add hotspot domain schema

- **Depends on:** TASK-051, TASK-055.
- **Deliverables:** Define hotspot geometry, content, visual style, animation, action, accessibility label, visibility, and ordering; add schema migrations and editor commands.
- **Quality bar:** Geometry is normalized and bounded; malformed actions are rejected; old documents render with safe defaults after schema evolution.

### [x] TASK-062 — Build hotspot creation and manipulation

- **Depends on:** TASK-061.
- **Deliverables:** Add click/drag creation, selection, movement, resizing, duplication, deletion, alignment guides, snapping, and keyboard nudging on the canvas.
- **Quality bar:** Pointer, touch, and keyboard interactions are supported; minimum target size guidance is visible; movement remains precise at every zoom level.

### [x] TASK-063 — Build the hotspot inspector

- **Depends on:** TASK-016, TASK-062.
- **Deliverables:** Add a simple default inspector for text and action, plus an Advanced disclosure for alignment, color, size, corner, opacity, pulse/animation, responsive/mobile overrides, visibility, accessible label, and fine positioning with live preview.
- **Quality bar:** A basic hotspot can be completed without opening Advanced; inputs are validated and sanitized; invalid styles cannot break the player; all changes participate in undo/redo and autosave.

### [x] TASK-064 — Implement hotspot actions and internal navigation

- **Depends on:** TASK-054, TASK-063.
- **Deliverables:** Support next/previous, specific step, chapter, branch, safe external URL, and no-op/invisible target actions; add broken-target diagnostics.
- **Quality bar:** Deleted/reordered targets remain referentially safe; dangerous URL schemes and open-redirect patterns are rejected; navigation is fully tested.

### [x] TASK-065 — Add annotation primitives

- **Depends on:** TASK-055, TASK-057.
- **Deliverables:** Add text, callout, arrow, line, rectangle, ellipse, highlight, icon, image, badge, and button annotations with layer ordering and grouping.
- **Quality bar:** User text and links are sanitized; annotations render consistently in editor/player; selection and manipulation meet keyboard/accessibility expectations.

### [x] TASK-066 — Add crop, blur, and redaction tools

- **Depends on:** TASK-045, TASK-065.
- **Deliverables:** Add non-destructive crop metadata, preview blur, irreversible published redaction rendering, redaction labels, and reprocess flow when source media changes.
- **Quality bar:** Published redaction cannot be removed client-side to reveal source pixels; tests inspect generated derivatives; original media remains private and permission-controlled.

### [x] TASK-067 — Add zoom, pan, and text animation effects

- **Depends on:** TASK-055, TASK-065.
- **Deliverables:** Add per-step zoom/pan focus, transition type, duration/easing, crossfade/gap controls, reduced-motion fallback, and typewriter text effect with an exact-time preview timeline shown only while timing is edited.
- **Quality bar:** Effects never cause content loss or motion traps, honor reduced-motion preferences, avoid abrupt voiceover transitions, and produce deterministic playback across supported browsers.

### [x] TASK-068 — Add narration and background audio controls

- **Depends on:** TASK-046, TASK-047, TASK-053.
- **Deliverables:** Allow per-step voiceover assignment/recording upload, demo-level background audio, narration start/end offsets, silence trim/insert, volume and ducking envelopes, crossfade/gap controls, waveform/timeline preview, and captions/transcript field.
- **Quality bar:** Playback never autoplays audible media without user consent; timing preview matches exported/player output, mixed audio does not clip, and missing/failed audio degrades gracefully.

### [x] TASK-069 — Add component layer management

- **Depends on:** TASK-062, TASK-065.
- **Deliverables:** Build layer panel, show/hide, lock/unlock, reorder, rename, multi-select, group/ungroup, and contextual comment targeting.
- **Quality bar:** Locked elements cannot mutate accidentally; z-order matches player rendering; operations remain responsive with at least 200 components on a step.

### [x] TASK-070 — Qualify interactive editing

- **Depends on:** TASK-061 through TASK-069.
- **Deliverables:** Add malicious-content fixtures, visual regression matrix, redaction security tests, keyboard/pointer end-to-end tests, large-document benchmark, and corrupted-component recovery tests.
- **Quality bar:** Editor and player output match within approved visual tolerance; XSS and redaction tests pass; no serious accessibility defects remain.

## Milestone 8 — Chapters, branching, and player engine

Outcome: Demos support structured narratives and multi-path journeys in a production-quality, accessible playback engine.

### [x] TASK-071 — Add chapter domain model

- **Depends on:** TASK-051.
- **Deliverables:** Define intro, context, instruction, CTA, gate, survey, quiz, and outro chapter types with flexible template-led layouts, content, image/video, buttons, variables, private presenter notes, order, and target actions.
- **Quality bar:** Chapter schemas are discriminated and versioned; accessible templates remain the default; invalid button targets or unsafe URLs fail validation; legacy documents remain readable.

### [x] TASK-072 — Build the chapter editor

- **Depends on:** TASK-016, TASK-071.
- **Deliverables:** Add simple intro/outro/context templates, optional Advanced layout controls, rich but sanitized content, image/video selection, button configuration, presenter notes, theme preview, reordering, and insertion between steps.
- **Quality bar:** Common intro/outro creation needs no freeform layout work; authoring is accessible, content is safely rendered, and every chapter operation supports autosave and undo/redo.

### [x] TASK-073 — Define the branching graph model

- **Depends on:** TASK-064, TASK-071.
- **Deliverables:** Represent steps/chapters as nodes and actions as edges; add start node, terminal nodes, branch labels, conditions, and deterministic fallback paths.
- **Quality bar:** Graph validation detects unreachable nodes, dead ends, cycles that violate policy, missing targets, and ambiguous defaults without blocking intentional loops.

### [x] TASK-074 — Build branching authoring and diagnostics

- **Depends on:** TASK-073.
- **Deliverables:** Add target pickers, branch labels, conditional rules, path preview, graph/outline diagnostics, and one-click navigation to broken nodes.
- **Quality bar:** Complex branching remains understandable without requiring a graph view; destructive edits surface impact before confirmation; conditions are never arbitrary executable code.

### [x] TASK-075 — Implement the shared player state machine

- **Depends on:** TASK-058, TASK-073.
- **Deliverables:** Create framework-independent playback state machine for loading, start, navigation, branches, chapters, completion, restart, and error recovery; integrate it into creator preview.
- **Quality bar:** State transitions are deterministic and exhaustively unit-tested; malformed documents fail closed with a friendly error rather than executing unexpected behavior.

### [x] TASK-076 — Build accessible responsive player UI

- **Depends on:** TASK-075.
- **Deliverables:** Render media, multiple hotspots, annotations, chapters, progress, step count, navigation, captions, and focus management; support responsive, scale, pinch-zoom/pan, mobile swipe-story, and custom image/video fallback strategies with optional mobile-specific hotspot overrides.
- **Quality bar:** Keyboard, touch, screen-reader, zoom-to-200%, high-contrast, and reduced-motion journeys pass; mobile overrides never require duplicating the base demo; viewer controls never obscure required targets.

### [x] TASK-077 — Add autoplay, looping, fullscreen, and playback controls

- **Depends on:** TASK-076.
- **Deliverables:** Add autoplay timing, loop policy, pause/play, restart, fullscreen, mute/volume, playback speed, and creator-configurable controls; add presenter mode with private notes/second-screen view, clean audience view, guide/beacon shortcuts, click-anywhere option, free navigation, and auto-reset kiosk mode.
- **Quality bar:** Browser autoplay policies are respected; users can always pause motion/audio; private notes never appear in audience output; kiosk sessions reset cleanly; controls remain usable in embeds and offline mode.

### [x] TASK-078 — Add viewer progress and resume state

- **Depends on:** TASK-075.
- **Deliverables:** Add anonymous session progress, optional resume, branch history, completion state, and reset behavior using privacy-conscious local/session storage.
- **Quality bar:** Resume data is scoped by demo/version and expires; shared devices do not expose identified viewer data; version changes recover safely.

### [x] TASK-079 — Define player events and extension points

- **Depends on:** TASK-075.
- **Deliverables:** Define internal events for load, start, node change, progress, action, CTA, form, completion, close, and error with versioned payload schemas.
- **Quality bar:** Events contain no sensitive authoring data, are ordered predictably, and cannot mutate privileged application state without validated handlers.

### [x] TASK-080 — Qualify branching playback

- **Depends on:** TASK-071 through TASK-079.
- **Deliverables:** Add path-coverage generator, player end-to-end tests, accessibility audit, mobile-strategy and multi-hotspot matrix, presenter/kiosk tests, visual baselines, malformed-graph fuzz tests, and performance benchmark on long demos.
- **Quality bar:** Every reachable path completes or intentionally loops; no graph input hangs the player; all mobile strategies have usable fallbacks; player startup and interaction budgets pass on mid-range mobile hardware.

## Milestone 9 — Publishing, sharing, embeds, and Showcases

Outcome: Creators can publish immutable demos, control access, embed them safely, group them into Showcases, and share polished public experiences.

### [x] TASK-081 — Build immutable publication pipeline

- **Depends on:** TASK-052, TASK-075, TASK-008.
- **Deliverables:** Add publish validation, immutable published-version record, compact player manifest generation, content-hashed asset references, shared-content impact check, freshness/broken-target status, unpublish, republish-in-place, and status progress.
- **Quality bar:** Existing viewers never receive partial versions; publish retries are idempotent; invalid/broken drafts cannot publish; existing links/embeds update without snippet replacement; rollback to a prior version is supported.

### [x] TASK-082 — Build public demo URL resolution

- **Depends on:** TASK-081.
- **Deliverables:** Add unguessable public IDs/slugs, latest-versus-version-pinned resolution, public player route, cache headers, unpublished/expired states, and canonical URL rules.
- **Quality bar:** Public resolution exposes only manifest-approved fields; tenant/private database identifiers do not leak; caching cannot serve private content as public.

### [x] TASK-083 — Add share links and access gates

- **Depends on:** TASK-082.
- **Deliverables:** Implement normal, trackable, expiring, password-protected, email-gated, reviewer-only, and preview-only links with revoke/rotate controls, search-indexing policy, access summary, and access-attempt audit events; preview links collect no production analytics.
- **Quality bar:** Passwords/tokens are hashed, rate-limited, and server-enforced; private/gated/preview/personalized links default to `noindex`; expired/revoked links fail immediately; preview data cannot contaminate production metrics.

### [x] TASK-084 — Add secure responsive iframe embeds

- **Depends on:** TASK-076, TASK-082.
- **Deliverables:** Generate inline, full-page, and responsive iframe snippets; add dedicated embed route, allowlistable origins, fullscreen/clipboard permission controls, configurable lazy-load overlay, optional no-preload behavior, loading/fallback state, and embed documentation.
- **Quality bar:** Lazy embeds do not load player/media before activation, host-page interaction remains responsive, CSP/frame policies are explicit, no creator-session cookies are required, and hostile parents cannot access private state.

### [x] TASK-085 — Build the popup embed SDK

- **Depends on:** TASK-084.
- **Deliverables:** Create versioned lightweight JavaScript SDK with async/lazy loading, `load`, `open`, `close`, `destroy`, and `reload`, demo/Showcase support, lifecycle callbacks, multiple-instance handling, SPA compatibility, focus management, and cleanup.
- **Quality bar:** SDK is framework-agnostic, tree/cache friendly, idempotent on repeated load, accessible, meets a published size/performance budget, and does not conflict with host-page styles or globals beyond its namespace.

### [x] TASK-086 — Implement the public Embed Events API

- **Depends on:** TASK-079, TASK-084.
- **Deliverables:** Emit documented `load`, `started`, `slideChange`, `progress`, `completed`, and `close` postMessage events with versioned payloads and example integrations.
- **Quality bar:** Sender/receiver origin guidance is secure; payloads are schema-tested; forged messages cannot trigger privileged operations; event behavior matches documentation.

### [x] TASK-087 — Build Showcase collections

- **Depends on:** TASK-031, TASK-081.
- **Deliverables:** Add Showcase schema, ordered demo references, title/description/cover, collection editor, publish pipeline, public viewer, and popup/iframe support.
- **Quality bar:** Access policy is calculated safely across referenced demos; removing/unpublishing a demo has defined behavior; large collections load incrementally.

### [x] TASK-088 — Add workspace and demo branding

- **Depends on:** TASK-011, TASK-076, TASK-081.
- **Deliverables:** Add logo, semantic colors, font selection, CTA style, player background, branding inheritance, per-demo overrides, and hide-platform-branding entitlement hook.
- **Quality bar:** Generated themes preserve contrast, unsafe fonts/assets are blocked, and branding cannot inject CSS/HTML; editor/public output is visually consistent.

### [x] TASK-089 — Add sharing metadata and multi-format exports

- **Depends on:** TASK-082, TASK-087, TASK-088.
- **Deliverables:** Add title/description metadata, social/email preview generation, favicon, QR code, copy-link controls, screenshot-link presentation, and explicit robots/indexing controls; add asynchronous MP4, GIF, PDF, accessible SOP, numbered-text, and optional SCORM/xAPI exports with branded templates and expiring downloads.
- **Quality bar:** Metadata and documents escape user input, exports are deterministic and tenant-authorized, private/gated content defaults to no-index, generated guides preserve reading order/alt text, and email previews link to the intended publication.

### [x] TASK-090 — Add offline/portable delivery and qualify publishing

- **Depends on:** TASK-081 through TASK-089.
- **Deliverables:** Build installable offline PWA/player, encrypted downloadable demo packages, package expiry/update/revocation metadata, and an approved-plan self-hosted static package with manifest integrity and optional analytics relay; add cache tests, embed host fixtures, access-gate abuse tests, CDN model, and rollback drill.
- **Quality bar:** Offline/self-host packages contain only publication-approved assets, expose no creator credentials, verify integrity, clearly communicate revocation limitations, and remain isolated; published assets are immutable/cacheable, private content remains inaccessible, and public playback meets budgets.

## Milestone 10 — Browser capture extension

Outcome: Creators can securely record a web workflow into a screenshot-based interactive draft using a production-ready browser extension.

### [x] TASK-091 — Scaffold the browser extension

- **Depends on:** TASK-001, TASK-021.
- **Deliverables:** Add Manifest V3 extension app, background service worker, content script, popup/side panel shell, typed message contracts, build/signing setup, and development installation guide.
- **Quality bar:** Permissions are minimal and justified; no remote code execution; production and development builds are distinct; extension security linting passes.

### [x] TASK-092 — Implement secure extension pairing

- **Depends on:** TASK-091, TASK-029.
- **Deliverables:** Add authenticated pairing flow with short-lived one-time code or approved browser identity flow, token storage, logout/revocation, and workspace selection.
- **Quality bar:** Tokens are never exposed to page scripts, are scoped/short-lived where possible, and cannot be paired through forged origins; revocation tests pass.

### [x] TASK-093 — Implement screenshot capture

- **Depends on:** TASK-042, TASK-092.
- **Deliverables:** Capture active-tab viewport, full-page, and bounded stitched-scrolling screenshots on explicit user action; handle fixed/sticky elements, provide pre-upload crop/review, collect viewport/device metadata, upload through constrained sessions, and create capture records.
- **Quality bar:** Capture occurs only with visible user consent and allowed permissions; page complexity/pixel limits prevent resource abuse; restricted pages fail clearly; images do not pass through untrusted page context.

### [x] TASK-094 — Capture click targets and navigation context

- **Depends on:** TASK-093.
- **Deliverables:** Record user-selected click coordinates, sanitized target/anchor hints, page title/origin, source URL provenance where approved, scroll position/depth, scrollable-region metadata, and navigation boundaries for each step.
- **Quality bar:** Passwords, input values, cookies, private query values, and page source are not captured; cross-origin frames degrade safely; provenance is opt-in/filtered and metadata is bounded/sanitized.

### [x] TASK-095 — Build recording controls

- **Depends on:** TASK-094.
- **Deliverables:** Add explicit Screenshot/HTML/Video mode selection and mode lock, start, pause, resume, capture, per-step visual/accessible receipt, missed/duplicate-click warning, undo-last-step, finish, cancel, step count, persistent recording indicator, and keyboard controls.
- **Quality bar:** The recorder never changes mode without confirmation; state survives service-worker suspension; accidental duplicates are deduplicated; each accepted step has visible evidence and users always know when capture is active.

### [x] TASK-096 — Finalize recordings into demo drafts

- **Depends on:** TASK-051, TASK-095.
- **Deliverables:** Add idempotent recording-finalize API/job that validates captures, creates a draft, maps clicks to hotspots, assigns assets, and opens the editor.
- **Quality bar:** Partial uploads never create corrupt demos; retries return the same result; authorization and workspace quota checks run at finalization.

### [x] TASK-097 — Add capture privacy controls

- **Depends on:** TASK-094, TASK-096.
- **Deliverables:** Add domain allow/deny controls, sensitive-page warning, optional pre-upload masking, excluded selectors configured by the user, and capture review before finalization.
- **Quality bar:** Default behavior minimizes collection; exclusions are applied before upload where promised; privacy choices are clear and testable.

### [x] TASK-098 — Add robust page and navigation handling

- **Depends on:** TASK-095.
- **Deliverables:** Handle SPAs, full navigations, tab changes, viewport resizing, nested scrolling, delayed rendering, browser restart, service-worker suspension, local recording journal recovery, long-session health, and abandoned sessions.
- **Quality bar:** Supported transitions do not lose ordered steps; a 50+ step fixture remains responsive; unsupported cases fail with actionable repair options; memory/storage use is bounded.

### [x] TASK-099 — Build recapture, maintenance, and diagnostics

- **Depends on:** TASK-096, TASK-098.
- **Deliverables:** Add resumable capture-session listing, failed-upload recovery, single-step/collection recapture from approved provenance, old/new visual diff, confidence-based anchor preservation, manual remap, stale/broken diagnostics, safe diagnostic export, and session deletion.
- **Quality bar:** Low-confidence anchors never remap silently; affected demos/shared captures are listed before applying; diagnostics redact tokens/query values/personal data; abandoned sessions expire and clean up safely.

### [x] TASK-100 — Qualify the browser recorder

- **Depends on:** TASK-091 through TASK-099.
- **Deliverables:** Add automated extension tests, representative SPA/MPA/long-scroll fixtures, mode-lock and missed-click tests, long-session benchmark, recapture/anchor fixtures, permission audit, privacy corpus, release checklist, and end-to-end capture-to-publish test.
- **Quality bar:** The critical recording and recapture journeys are deterministic across supported Chrome versions; long/full-page capture stays within budgets; no over-broad permission or sensitive-data capture remains; recovery is documented.

## Milestone 11 — Video, desktop, mobile, and design imports

Outcome: Creators can produce video-rich demos, capture desktop workflows, import mobile screens, and turn approved design frames into editable drafts.

### [x] TASK-101 — Add browser screen recording

- **Depends on:** TASK-042, TASK-046, TASK-053.
- **Deliverables:** Implement browser screen/window/tab capture using platform media APIs, explicit source selection, local preview, chunked upload, duration limit, and draft attachment.
- **Quality bar:** Capture starts only after user gesture/consent; tracks stop on cancellation/navigation; unsupported browsers and revoked permissions recover cleanly.

### [x] TASK-102 — Add microphone, system audio, and webcam capture

- **Depends on:** TASK-101.
- **Deliverables:** Add selectable microphone, permitted system/tab audio, optional webcam picture-in-picture, device testing, mute controls, and synchronized recording.
- **Quality bar:** Privacy indicators remain visible, unused tracks are not acquired, device labels are handled safely, and audio/video sync meets an explicit tolerance.

### [x] TASK-103 — Build resilient recording controls

- **Depends on:** TASK-101, TASK-102.
- **Deliverables:** Add countdown, pause/resume, elapsed time, source/mic/camera state, cancel, finish, upload progress, and crash/interruption recovery where browser APIs permit.
- **Quality bar:** No path leaves active media tracks running; duplicate finish/cancel actions are idempotent; long recordings do not accumulate unbounded browser memory.

### [x] TASK-104 — Build basic video editing

- **Depends on:** TASK-046, TASK-103.
- **Deliverables:** Add trim-in/out, poster selection, crop/aspect ratio, webcam placement, cursor/click overlays, transition timing, narration synchronization, caption timing hooks, and background processing of edited renditions.
- **Quality bar:** Edits are non-destructive, exact-time preview matches processed output, invalid/overlapping timelines are rejected, and long operations expose cancellable progress.

### [x] TASK-105 — Add transcripts, captions, and video chapters

- **Depends on:** TASK-104.
- **Deliverables:** Add caption-track schema, manual upload/edit, transcript display, chapter timestamps, a disabled transcription-provider interface for later AI integration, and accessible player controls.
- **Quality bar:** Captions remain editable and exportable; AI output is labeled and reviewed before publication; timing and language metadata are validated.

### [x] TASK-106 — Scaffold the desktop recorder application

- **Depends on:** TASK-001, TASK-092.
- **Deliverables:** Select Tauri/Electron based on an ADR; create signed-build-capable desktop shell, secure authentication pairing, update abstraction, crash handling, and platform permission guide.
- **Quality bar:** Renderer isolation and secure IPC defaults are enforced; no Node/native API is exposed to untrusted content; secrets use OS-protected storage.

### [x] TASK-107 — Implement desktop workflow capture and upload

- **Depends on:** TASK-046, TASK-106.
- **Deliverables:** Add screen/window capture, cursor/click visualization, mic/system audio where supported, recording controls, resumable upload, and draft creation.
- **Quality bar:** macOS/Windows permission failures are actionable; native calls are allowlisted; recordings and temporary files are encrypted/protected and cleaned after upload.

### [x] TASK-108 — Add mobile and tablet screenshot imports

- **Depends on:** TASK-043, TASK-054.
- **Deliverables:** Add multi-image import wizard, EXIF-safe ordering, portrait/landscape detection, device frame presets, crop/fit review, and batch draft creation.
- **Quality bar:** Metadata is stripped where appropriate, ordering is editable, huge images are bounded, and touch-oriented preview/player behavior is tested.

### [x] TASK-109 — Add Figma frame import

- **Depends on:** TASK-041, TASK-051.
- **Deliverables:** Define approved Figma import flow/API, OAuth or plugin authorization, frame selection, rendered asset ingestion, uploaded mockup import, frame-name ordering, AI-optional storyboard suggestions, and draft creation with source metadata.
- **Quality bar:** Requested scopes are minimal, tokens are encrypted, imported files are tenant-scoped, suggestions require preview/confirmation, API rate/error handling is robust, and unsupported node types degrade visibly.

### [x] TASK-110 — Add video-to-demo conversion and qualify capture paths

- **Depends on:** TASK-101 through TASK-109.
- **Deliverables:** Add a reviewed video-to-demo pipeline that detects scene changes and candidate interaction points and proposes steps/hotspots; add capture compatibility matrix, media synchronization tests, desktop threat review, import fixtures, interruption/retry tests, and end-to-end journeys.
- **Quality bar:** Converted steps remain proposals until creator confirmation and preserve provenance; each capture path has documented limits/cleanup; no capture continues without visible consent; all generated drafts meet the same schema guarantees.

## Milestone 12 — Analytics and viewer intelligence

Outcome: The platform reliably measures views, engagement, completion, drop-off, and viewer intent without slowing public playback or violating tenant/privacy boundaries.

### [x] TASK-111 — Define the analytics event contract

- **Depends on:** TASK-079, TASK-082.
- **Deliverables:** Version schemas for load, start, node view, progress, hotspot/click coordinates, scroll depth, CTA, form/quiz, branch, presenter/kiosk session, experiment exposure, replay, completion, and error events; define required/forbidden fields and batching rules.
- **Quality bar:** Events exclude author secrets and unnecessary personal data, have bounded payloads, and remain backward-compatible through explicit version handling.

### [x] TASK-112 — Implement viewer sessions and attribution

- **Depends on:** TASK-083, TASK-111.
- **Deliverables:** Add privacy-conscious anonymous session IDs, trackable-link attribution, embed/referrer/source metadata, optional identified viewer linkage, device classification, and session expiry.
- **Quality bar:** Identity cannot be spoofed to gain access; personal data is separated from behavioral events; cookie/storage behavior follows consent and retention policy.

### [x] TASK-113 — Build the public analytics ingestion API

- **Depends on:** TASK-008, TASK-111, TASK-112.
- **Deliverables:** Add batched ingestion endpoint, schema validation, size/count limits, origin/demo validation, abuse rate limiting, idempotency token, and queue publication.
- **Quality bar:** Endpoint survives malformed/fuzzed payloads and high anonymous traffic; analytics claims never affect authorization; acceptance latency stays low under load.

### [x] TASK-114 — Persist partitioned raw analytics events

- **Depends on:** TASK-113.
- **Deliverables:** Add monthly-partitioned event tables, ingestion worker, duplicate suppression, event timestamps, server receipt time, and archival interface.
- **Quality bar:** Worker is idempotent, partition creation is automated, late events have defined behavior, and malformed queued events reach a dead-letter path.

### [x] TASK-115 — Build analytics rollups

- **Depends on:** TASK-114.
- **Deliverables:** Compute hourly/daily demo and workspace aggregates for views, unique sessions, starts, completion, time, steps, drop-off, CTAs, and source; add repair/backfill commands.
- **Quality bar:** Rollups are reproducible from raw data, timezone rules are explicit, repeated jobs are idempotent, and benchmarked queries use aggregate tables.

### [x] TASK-116 — Build individual demo analytics

- **Depends on:** TASK-017, TASK-115.
- **Deliverables:** Add date/source/device/cohort filters, KPI cards, completion funnel, step drop-off, time-per-step, click/hotspot heatmaps, scroll depth, branch/path comparison, CTA table, viewer sessions, and clear no-data/partial-data states.
- **Quality bar:** Numbers and heatmaps reconcile against fixtures and responsive coordinates; charts are accessible; identified data is permissioned; small samples are not presented misleadingly.

### [x] TASK-117 — Build workspace analytics

- **Depends on:** TASK-115, TASK-116.
- **Deliverables:** Add portfolio KPIs, top demos, trend comparison, use-case/tag/device/cohort breakdown, content freshness/maintenance status, creator activity, account engagement, and drill-down links with role-aware access.
- **Quality bar:** Queries remain within dashboard performance budgets on realistic event volumes; account aggregation is explainable; viewers cannot access restricted demo analytics through aggregates.

### [x] TASK-118 — Add viewer timelines and intent scoring

- **Depends on:** TASK-112, TASK-115.
- **Deliverables:** Add identified viewer and account timelines, stakeholder/buying-committee grouping, configurable transparent scoring based on completion/time/CTA/recency, score explanation, CRM opportunity association/influence signals, and hot-lead filtering.
- **Quality bar:** Scores and opportunity influence are labeled as signals, deterministic, and explainable—not authorization or causal claims; identity merge avoids false attribution; privacy deletion propagates.

### [x] TASK-119 — Add analytics export, retention, and deletion

- **Depends on:** TASK-114 through TASK-118.
- **Deliverables:** Add asynchronous CSV export, spreadsheet-injection protection, signed download, configurable raw-event retention, S3 archival hook, viewer deletion, and workspace purge jobs.
- **Quality bar:** Exports are tenant-authorized, expire, and cannot leak cross-workspace data; deletion/retention is auditable and idempotent; large exports stream.

### [x] TASK-120 — Add A/B experimentation and qualify analytics

- **Depends on:** TASK-111 through TASK-119.
- **Deliverables:** Add immutable control/treatment experiment schema, stable experiment URL/embed, configurable split, exposure assignment, start/pause/stop/schedule, primary/guardrail metrics, sample-size/uncertainty reporting, segmentation, winner promotion, and audit history; add event-generator load test, golden reconciliation, privacy review, and performance report.
- **Quality bar:** Viewer assignment is stable and unbiased, experiments never alter access rules, results do not declare premature certainty, winner promotion preserves URLs, analytics accuracy/throughput targets pass, and playback remains responsive during degradation.

## Milestone 13 — Forms, leads, webhooks, and sales integrations

Outcome: Demos can capture qualified responses and reliably deliver engagement data to customer systems.

### [x] TASK-121 — Define form and survey schemas

- **Depends on:** TASK-071, TASK-111.
- **Deliverables:** Add form, field, option, validation, consent, survey, quiz, correct-answer/explanation, score/pass threshold, attempt policy, conditional-question, completion/certificate hook, submission, and form-version schemas linked to chapters or steps; define xAPI-compatible events.
- **Quality bar:** Field keys/types and scoring rules are immutable after publication, conditions are declarative rather than executable code, answers cannot leak before submission, and sensitive-field types are prohibited or protected.

### [x] TASK-122 — Build the form and survey editor

- **Depends on:** TASK-016, TASK-121.
- **Deliverables:** Add form/survey/quiz field palette, reorder, labels/descriptions, required flags, option editing, correct answers, explanations, scoring/pass/attempt controls, conditions, consent text, completion/certificate action, preview, and validation diagnostics.
- **Quality bar:** Generated forms and quizzes are accessible by default; answer keys are not present in public client manifests before needed; impossible conditions/scoring are diagnosed; all text is safely rendered.

### [x] TASK-123 — Implement secure public form submission

- **Depends on:** TASK-076, TASK-113, TASK-121.
- **Deliverables:** Render forms/quizzes in player, validate and score server-side against published version, add spam/rate controls, consent, attempts, idempotency, explanations, pass/completion state, optional certificate job, xAPI event output, confirmation, and analytics events.
- **Quality bar:** Submitted fields cannot exceed limits, forge attribution/scores, extract answer keys, or inject content; attempts/replays are enforced server-side; failures preserve input safely; certificates contain only approved identity data.

### [x] TASK-124 — Build lead management

- **Depends on:** TASK-118, TASK-123.
- **Deliverables:** Add leads inbox, profile, source demo/link, form responses, viewer activity, score, status, assignee placeholder, search/filter, export hook, and deletion.
- **Quality bar:** Personal data is access-controlled, minimized, and redacted from logs; cross-workspace tests and data-subject deletion tests pass.

### [x] TASK-125 — Build outbound webhook infrastructure

- **Depends on:** TASK-008, TASK-124.
- **Deliverables:** Add webhook endpoints/configuration, event subscriptions, encrypted signing secrets, transactional outbox, signed delivery, retries, delivery logs, replay, disable, and URL validation.
- **Quality bar:** SSRF protections block private/metadata destinations, signatures use constant-time verification guidance, retries are idempotent, and secrets are never displayed after creation.

### [x] TASK-126 — Add Slack notifications

- **Depends on:** TASK-125.
- **Deliverables:** Add secure Slack OAuth/install flow, channel selection, demo-view/lead/completion notifications, message templates, test action, revoke, and delivery status.
- **Quality bar:** Minimum scopes are used, tokens are encrypted, content is escaped, high-volume events are coalesced, and uninstall/revocation is handled.

### [x] TASK-127 — Add Zapier integration

- **Depends on:** TASK-125.
- **Deliverables:** Add API-key or OAuth-backed Zapier connection, new-lead/demo-view triggers, webhook subscription lifecycle, sample data, deduplication, and user documentation.
- **Quality bar:** Keys are scoped/rotatable, trigger delivery is idempotent, old subscriptions can be revoked, and contract tests match published schemas.

### [x] TASK-128 — Establish CRM/MAP integration framework

- **Depends on:** TASK-124, TASK-125.
- **Deliverables:** Add provider adapter interface, OAuth state/PKCE where supported, encrypted credential store, field mapping, sync cursor, rate-limit handling, connection health, and disconnect cleanup.
- **Quality bar:** Provider tokens never reach the browser after exchange; scopes are minimal; sync retries cannot duplicate contacts/events; mapping errors are actionable.

### [x] TASK-129 — Add HubSpot synchronization

- **Depends on:** TASK-128.
- **Deliverables:** Implement HubSpot connection, contact match/create policy, lead/form/demo engagement property mapping, timeline/event sync where supported, test sync, and operational metrics.
- **Quality bar:** Contact matching rules are explicit and reversible, API limits/backoff are respected, and sandbox contract tests cover revoked tokens and partial failures.

### [x] TASK-130 — Add Salesforce and Marketo adapters; qualify integrations

- **Depends on:** TASK-128, TASK-129.
- **Deliverables:** Implement scoped Salesforce and Marketo adapters using the shared framework; add provider contract suites, webhook/Slack/Zapier/CRM end-to-end fixtures, replay runbook, and security review.
- **Quality bar:** Each provider passes the same idempotency, token protection, rate-limit, tenant-isolation, and disconnect tests; incomplete provider capabilities are clearly documented rather than simulated.

## Milestone 14 — Personalization, localization, and generative media

Outcome: One demo can adapt safely to viewers, languages, personas, and voice styles without duplicating the source content.

### [x] TASK-131 — Define variables and token rendering

- **Depends on:** TASK-051, TASK-076.
- **Deliverables:** Add workspace/demo variable definitions, types, defaults, fallbacks, allowed locations, safe token parser, renderer, and missing-variable diagnostics.
- **Quality bar:** Tokens cannot execute code or inject markup/URLs; output is contextually escaped; deterministic tests cover missing, malformed, and adversarial values.

### [x] TASK-132 — Build personalized links and embed variables

- **Depends on:** TASK-083, TASK-084, TASK-131.
- **Deliverables:** Add personalized-link records, URL/embed query mapping, variable allowlists, preview, revoke/expiry, and tracking-link association.
- **Quality bar:** Secrets and sensitive personal data are not placed in URLs by default; unknown variables are ignored/rejected; links cannot override access control or system fields.

### [x] TASK-133 — Add persona and conditional content rules

- **Depends on:** TASK-074, TASK-131.
- **Deliverables:** Add declarative rules for text, chapter, CTA, and branch variants based on approved variables; build rule editor, precedence, preview personas, and fallback behavior.
- **Quality bar:** Rules are deterministic, bounded, and non-executable; conflicting/unreachable rules are diagnosed; viewer-supplied values cannot unlock protected content.

### [x] TASK-134 — Establish localization infrastructure

- **Depends on:** TASK-051, TASK-071, TASK-131.
- **Deliverables:** Add locale metadata, source/translated content records, per-locale publishing, fallback chain, locale picker, right-to-left support, and extraction/import/export format.
- **Quality bar:** Content IDs remain stable across locales; missing translations are visible to creators; player layout supports text expansion and RTL without clipping.

### [x] TASK-135 — Build the server-side AI gateway

- **Depends on:** TASK-008, TASK-009, TASK-028.
- **Deliverables:** Add provider abstraction, mock provider, prompt templates/versioning, strict output schemas, quotas, usage accounting, timeouts, retries, cancellation, audit metadata, and safe logging.
- **Quality bar:** Provider keys and sensitive prompts never reach clients/logs; model output is always untrusted/validated; workspace quotas and tool permissions are server-enforced.

### [x] TASK-136 — Add AI text and script assistance

- **Depends on:** TASK-063, TASK-072, TASK-135.
- **Deliverables:** Add rewrite-by-tone/audience, hotspot copy, title/description, CTA, script, chapter outline, screen summary, storyboard from product description/use case/approved URL metadata, flow suggestion from capture collections, and missing-screen/path suggestions with preview/apply/reject.
- **Quality bar:** AI never silently overwrites content or publishes/captures URLs, generated markup is sanitized, provenance is recorded, and prompt-injection fixtures cannot invoke unauthorized actions.

### [x] TASK-137 — Add AI translation workflow

- **Depends on:** TASK-134, TASK-135.
- **Deliverables:** Add translation jobs, glossary/context support, status/progress, review/edit, stale-translation detection, batch retry, and per-locale publish readiness.
- **Quality bar:** Source changes invalidate only affected translations, placeholders remain intact, failed segments are visible, and no locale publishes unreviewed content unless explicitly allowed.

### [x] TASK-138 — Add AI voiceover generation

- **Depends on:** TASK-068, TASK-135.
- **Deliverables:** Add multi-provider voice catalog adapter, language/locale/accent coverage, voice quality preview, style/speed controls, pronunciation dictionary, text-to-speech jobs, replacement, captions linkage, provider fallback, and usage metering.
- **Quality bar:** Locale labels are accurate, pronunciation and fallback behavior are testable, audio output is quarantined/validated like uploads, costs are bounded, accessible text remains available, and provider failures do not block manual voiceover.

### [x] TASK-139 — Add consent-governed voice cloning

- **Depends on:** TASK-138.
- **Deliverables:** Add explicit consent record, sample requirements, identity/authorization workflow, provider enrollment/deletion, restricted voice visibility, audit trail, and revocation.
- **Quality bar:** Voice cloning is impossible without documented consent and proper permission; samples/voice IDs are protected; revocation prevents future generation and follows deletion policy.

### [x] TASK-140 — Qualify personalization and AI generation

- **Depends on:** TASK-131 through TASK-139.
- **Deliverables:** Add context-injection security suite, locale/RTL visual matrix, variable fuzzing, provider-failure tests, cost/latency budgets, consent audit, and end-to-end personalized multilingual demo.
- **Quality bar:** Personalization cannot change authorization, AI output cannot execute, locale fallbacks are deterministic, and no high-risk data-handling finding remains.

## Milestone 15 — Guided HTML clones and sandbox demos

Outcome: Approved web experiences can be converted into isolated, editable HTML demos with safe guided or controlled free-exploration behavior.

### [x] TASK-141 — Produce the HTML-cloning threat model and constraints

- **Depends on:** TASK-100, TASK-140.
- **Deliverables:** Document capture inputs, forbidden content, network policy, sanitization model, isolated origin, iframe sandbox flags, CSP, cookie/storage policy, resource budgets, and supported fidelity boundaries.
- **Quality bar:** Security, product, and engineering assumptions are explicit; implementation cannot begin with arbitrary script execution or shared application origin; Claude review returns no unresolved blockers.

### [x] TASK-142 — Capture bounded DOM snapshots

- **Depends on:** TASK-141.
- **Deliverables:** Extend recorder to capture an allowlisted DOM representation, computed layout/style subset, viewport, text, image references, and interaction targets with strict size/depth/node limits.
- **Quality bar:** Scripts, secrets, form values, hidden sensitive fields, storage, and cookies are excluded; pathological pages cannot exhaust extension or server resources.

### [x] TASK-143 — Build asset and style normalization

- **Depends on:** TASK-142.
- **Deliverables:** Resolve approved images/fonts/styles, rewrite references, inline or proxy permitted resources, normalize CSS into a namespaced bundle, and report unsupported features.
- **Quality bar:** Server-side fetching enforces SSRF/DNS-rebinding protections and byte/time limits; external resources cannot track viewers after publication unless explicitly approved.

### [x] TASK-144 — Build strict HTML/CSS sanitization

- **Depends on:** TASK-142, TASK-143.
- **Deliverables:** Implement allowlist sanitizer that removes scripts, event handlers, dangerous URLs/CSS, forms, frames, objects, refreshes, imports, and unsupported active content; emit a sanitization report.
- **Quality bar:** A maintained malicious fixture corpus and sanitizer fuzz tests pass; removed content cannot be reconstructed from public manifests; sanitizer fails closed.

### [x] TASK-145 — Deploy isolated clone rendering boundary

- **Depends on:** TASK-144.
- **Deliverables:** Add separate clone-player origin, no shared auth cookies, restrictive CSP, sandboxed iframe, signed/versioned bundle resolution, and network-disabled default rendering.
- **Quality bar:** Browser security tests demonstrate no parent DOM, cookie, local storage, top navigation, popup, download, or arbitrary network access from clone content.

### [x] TASK-146 — Add editable text and demo data overlays

- **Depends on:** TASK-145.
- **Deliverables:** Extract safe editable text/data fields, stable selectors, data dictionary, find/replace, persona values, preview, and immutable source-versus-override model.
- **Quality bar:** Overrides are text/data only, contextually escaped, schema-limited, and cannot mutate sanitizer output or introduce executable content.

### [x] TASK-147 — Add simulated interaction primitives

- **Depends on:** TASK-145, TASK-146.
- **Deliverables:** Add declarative click, show/hide, modal, tab, menu, input simulation, route transition, and state mutation actions configured through an editor.
- **Quality bar:** The action language is non-Turing-complete or strongly bounded, cannot issue arbitrary network requests/code, and has deterministic reset behavior.

### [x] TASK-148 — Build sandbox sessions and resettable state

- **Depends on:** TASK-147.
- **Deliverables:** Add per-viewer in-memory/client session state, seeded datasets, reset control, scenario selection, state-size limits, and optional server persistence for authorized use cases.
- **Quality bar:** Sessions are isolated, expire, and cannot access production data; seed data is non-sensitive; malformed state cannot escape the schema.

### [x] TASK-149 — Add guided and free-exploration modes

- **Depends on:** TASK-075, TASK-148.
- **Deliverables:** Allow guided overlays on clones, optional free exploration within configured actions, goals/completion rules, hints, route constraints, and interaction analytics.
- **Quality bar:** Free exploration is limited to declared capabilities, completion is deterministic, keyboard/touch access is supported, and reset always returns to a clean seed.

### [x] TASK-150 — Security and fidelity qualification for HTML demos

- **Depends on:** TASK-141 through TASK-149.
- **Deliverables:** Add XSS/CSS exfiltration/SSRF/sandbox-escape corpus, cross-origin browser tests, clone fidelity fixtures, resource-abuse tests, incident kill switch, and operational runbook.
- **Quality bar:** No active-content escape or unauthorized network access succeeds, fidelity limits are documented, a vulnerable published bundle can be disabled quickly, and independent Claude review approves release.

## Milestone 16 — In-app Demo Hub, RouteHub, custom domains, and developer surface

Outcome: Customers can embed discoverable demo libraries, route viewers through tailored experiences, use branded domains, and integrate through a stable developer surface.

### [x] TASK-151 — Define In-app Demo Hub domain model

- **Depends on:** TASK-087, TASK-131.
- **Deliverables:** Add Hub, category, item, tag, audience, placement, theme, publication, and ordering schemas with workspace ownership and demo/Showcase references.
- **Quality bar:** References and access policies are validated at publish time; unpublished/private content cannot become public indirectly; schema supports versioned immutable publication.

### [x] TASK-152 — Build Demo Hub authoring

- **Depends on:** TASK-151.
- **Deliverables:** Add Hub dashboard, category/item editing, drag ordering, search configuration, audience rules, branding, preview, publish, and install instructions.
- **Quality bar:** Large libraries remain manageable and accessible; broken/unauthorized references are diagnosed before publishing; all mutations are permission-controlled.

### [x] TASK-153 — Build the in-app Hub and tour SDK

- **Depends on:** TASK-085, TASK-151.
- **Deliverables:** Extend SDK to mount a Hub panel/widget, open demos/Showcases, expose programmatic triggers, manage focus/history, unload cleanly, and support SPAs.
- **Quality bar:** SDK does not leak host styles or memory, requires no creator cookies, obeys configured origin policy, and remains within a published size/performance budget.

### [x] TASK-154 — Add contextual in-app targeting

- **Depends on:** TASK-133, TASK-153.
- **Deliverables:** Add declarative page/path/element/user-variable rules, frequency caps, dismiss/snooze state, on-demand versus proactive modes, and targeting preview/debugger.
- **Quality bar:** Rules cannot execute arbitrary JavaScript or bypass demo access; targeting failure never breaks the host app; users can dismiss proactive guidance accessibly.

### [x] TASK-155 — Define RouteHub journey model

- **Depends on:** TASK-073, TASK-151.
- **Deliverables:** Add RouteHub nodes for questions, demos, Showcases, videos, documents, CTAs, agent entry, and handoff; add conditions, goals, fallback, and publication versions.
- **Quality bar:** Graph is declarative, bounded, tenant-scoped, and statically validated for broken references, unreachable nodes, unsafe URLs, and missing fallbacks.

### [x] TASK-156 — Build RouteHub visual authoring

- **Depends on:** TASK-155.
- **Deliverables:** Add canvas/outline journey builder, node palette, connections, rule inspector, validation panel, path simulation, version comparison, and publish controls.
- **Quality bar:** Keyboard-accessible non-canvas alternative exists; destructive graph changes show impact; large supported graphs remain responsive and comprehensible.

### [x] TASK-157 — Build RouteHub viewer runtime and analytics

- **Depends on:** TASK-115, TASK-155, TASK-156.
- **Deliverables:** Add runtime state machine, question UI, content transitions, back/restart, goals, CTA/handoff results, resume, route events, funnel and path analytics.
- **Quality bar:** Conditions produce deterministic paths, viewer input cannot unlock unauthorized nodes, malformed graphs fail safely, and analytics reconciles with journey fixtures.

### [x] TASK-158 — Add secure custom domains

- **Depends on:** TASK-082, TASK-088.
- **Deliverables:** Add custom-domain request, DNS ownership verification, certificate provisioning adapter, routing status, conflict detection, removal, renewal monitoring, and domain audit events.
- **Quality bar:** Domain takeover and dangling-DNS risks are mitigated, verification is unguessable and repeatable, TLS is mandatory, and failed domains never route another tenant's content.

### [x] TASK-159 — Publish a scoped developer API and MCP adapter

- **Depends on:** TASK-027, TASK-081, TASK-125.
- **Deliverables:** Add versioned API keys with scopes/expiry/rotation, rate limits, OpenAPI docs, safe demo/list/publish-link operations, webhook management, and an MCP adapter for approved natural-language operations.
- **Quality bar:** Keys are hashed, shown once, revocable, and workspace-scoped; MCP actions use the same authorization/validation as APIs and require confirmation for publishing/destructive operations.

### [x] TASK-160 — Qualify in-app and developer integrations

- **Depends on:** TASK-151 through TASK-159.
- **Deliverables:** Add host-app compatibility fixtures, route graph fuzzing, custom-domain lifecycle tests, API abuse tests, SDK performance report, integration examples, and incident kill switches.
- **Quality bar:** Host failures cannot compromise platform data, no API/MCP path bypasses policy, custom domains are isolated, and public contracts are versioned and documented.

## Milestone 17 — AI Demo Agents and AI Demo Audit

Outcome: Guardrailed agents can retrieve approved proof, answer questions, qualify viewers, route them to content, and help creators improve demo quality.

### [x] TASK-161 — Build agent knowledge-source ingestion

- **Depends on:** TASK-135, TASK-159.
- **Deliverables:** Add agent/source schemas, approved upload/URL/integration source types, ingestion jobs, text extraction, chunk metadata, source status, refresh, and deletion.
- **Quality bar:** URL ingestion enforces SSRF protections, parsers are isolated/bounded, source permissions are tenant-scoped, and failed extraction cannot expose raw secrets.

### [x] TASK-162 — Add embedding and vector indexing

- **Depends on:** TASK-161.
- **Deliverables:** Enable pgvector, embedding provider adapter, versioned embeddings, batched indexing, deduplication, reindexing, deletion propagation, and retrieval indexes.
- **Quality bar:** Embeddings never cross workspace/agent boundaries, model/version changes are explicit, jobs are idempotent, and cost/resource limits are enforced.

### [x] TASK-163 — Build permission-aware retrieval with citations

- **Depends on:** TASK-162.
- **Deliverables:** Add hybrid retrieval, metadata filters, workspace/agent access enforcement, relevance thresholds, reranking hook, source citations, and no-answer behavior.
- **Quality bar:** Adversarial queries cannot retrieve another tenant's chunks or hidden sources; citation text maps to real approved content; low-confidence retrieval does not fabricate proof.

### [x] TASK-164 — Build the conversational agent runtime

- **Depends on:** TASK-135, TASK-163.
- **Deliverables:** Add session/message schemas, streaming responses, system policy, context budgeting, conversation history, cancellation, error recovery, and text chat UI.
- **Quality bar:** Model output is sanitized and schema-checked where structured; sessions are isolated/expiring; prompt injection tests cannot alter server authorization or tool policy.

### [x] TASK-165 — Add interactive proof and content tools

- **Depends on:** TASK-157, TASK-164.
- **Deliverables:** Add narrow tools to search/open demos, Showcases, RouteHubs, videos, PDFs, docs, and pricing links; render rich content cards and guided transitions.
- **Quality bar:** Every tool call rechecks server permissions, uses approved arguments, records citations, and cannot access arbitrary URLs/files or publish content.

### [x] TASK-166 — Add qualification, actions, and human handoff

- **Depends on:** TASK-123, TASK-128, TASK-164.
- **Deliverables:** Add configurable qualification questions, deterministic score/rules, lead creation, meeting/trial CTA adapters, handoff summary, consent, and escalation to a human channel.
- **Quality bar:** High-impact actions require explicit viewer confirmation, model output does not directly set qualification truth, and external actions are idempotent/audited.

### [x] TASK-167 — Add multilingual voice-led agents

- **Depends on:** TASK-138, TASK-164.
- **Deliverables:** Add speech input adapter, streaming/queued voice output, language detection/selection, transcript, mute/replay, interruption, fallback to text, and language-specific content retrieval.
- **Quality bar:** Microphone access is explicit and visible, transcripts follow retention policy, unsupported languages degrade clearly, and voice cannot trigger unconfirmed high-impact actions.

### [x] TASK-168 — Build agent configuration and analytics

- **Depends on:** TASK-115, TASK-164 through TASK-167.
- **Deliverables:** Add agent editor for sources, tone, goals, qualifying rules, actions, guardrails, preview sandbox, publication, conversation analytics, content gaps, conversions, and transcript review permissions.
- **Quality bar:** Configuration changes are versioned and previewed before publish; analytics preserves privacy; transcript access is tightly permissioned and audited.

### [x] TASK-169 — Build AI Demo Audit

- **Depends on:** TASK-115, TASK-135, TASK-136.
- **Deliverables:** Add deterministic feature extraction plus AI evaluation for step length, copy, framing, CTA, flow, accessibility, and engagement; show category scores, evidence, recommendations, and previewable one-click fixes.
- **Quality bar:** Scores are reproducible within documented tolerance, recommendations cite observable evidence, fixes never auto-publish, and rejected suggestions do not mutate drafts.

### [x] TASK-170 — Evaluate and qualify the AI suite

- **Depends on:** TASK-161 through TASK-169.
- **Deliverables:** Create adversarial prompt-injection set, cross-tenant retrieval tests, grounded-answer benchmark, tool-authorization tests, hallucination/no-answer metrics, red-team report, cost/latency limits, and kill switches.
- **Quality bar:** Release thresholds are documented and met, dangerous tool calls are blocked deterministically, citations are valid, and independent security review has no unresolved high findings.

## Milestone 18 — Enterprise administration, governance, and compliance

Outcome: Larger organizations can govern multiple workspaces, identities, permissions, data lifecycle, exports, and security evidence.

### [x] TASK-171 — Add multi-workspace organization administration

- **Depends on:** TASK-024, TASK-030.
- **Deliverables:** Add organization-admin role, multiple workspace creation/assignment, centralized seat/content overview, workspace status, ownership transfer, and organization branding defaults.
- **Quality bar:** Organization admins have only documented cross-workspace powers; workspace-local admins remain isolated; role-change and ownership tests cover escalation attempts.

### [x] TASK-172 — Expand RBAC and permission overrides

- **Depends on:** TASK-027, TASK-171.
- **Deliverables:** Add explicit permission matrix, custom enterprise roles if required, workspace/content-level restrictions, service-account role, entitlement checks, and permission audit report.
- **Quality bar:** Deny-by-default and least privilege remain intact; conflicting role/override precedence is documented and exhaustively tested; cached permissions invalidate promptly.

### [x] TASK-173 — Add SAML 2.0 SSO and auto-join

- **Depends on:** TASK-021, TASK-171.
- **Deliverables:** Add identity-provider configuration, metadata exchange, signed assertion validation, domain verification, enforced SSO, auto-join mapping, break-glass admin, and Okta/Azure/Google/OneLogin guides.
- **Quality bar:** Signature, issuer, audience, recipient, time, replay, and account-linking controls pass security tests; SSO misconfiguration cannot permanently lock out authorized recovery.

### [x] TASK-174 — Build enterprise audit logs

- **Depends on:** TASK-029, TASK-171.
- **Deliverables:** Expand append-only audit events for auth, members, roles, content, publish, share, export, integration, AI, retention, and admin actions; add search, filters, export, and integrity controls.
- **Quality bar:** Actors cannot edit/delete their audit events, sensitive payloads are redacted, timestamps/correlation are reliable, and access/export is tightly permissioned.

### [x] TASK-175 — Implement configurable data retention

- **Depends on:** TASK-048, TASK-119, TASK-174.
- **Deliverables:** Add organization/workspace policies for raw analytics, uploads, versions, transcripts, exports, deleted content, and audit logs; add preview, policy validation, scheduled enforcement, and legal-hold hook.
- **Quality bar:** Enforcement is idempotent and auditable, minimum legal/security retention is respected, policy shortening shows impact before confirmation, and backup limitations are documented.

### [x] TASK-176 — Add data residency architecture and controls

- **Depends on:** TASK-171, TASK-175.
- **Deliverables:** Define residency regions, tenant placement, region-aware storage/database/queue interfaces, provisioning state, immovable/migration rules, and UI/API controls behind enterprise entitlement; keep production activation disabled until AWS regional infrastructure is verified.
- **Quality bar:** Data paths and subprocessors are documented per region, no silent cross-region fallback is permitted, and the product cannot make residency claims before infrastructure verification passes.

### [x] TASK-177 — Add enterprise data export and privacy workflows

- **Depends on:** TASK-119, TASK-171, TASK-175.
- **Deliverables:** Add complete workspace export manifest, asynchronous encrypted archive, access approval, expiry, subject-access search/export, erasure workflow, and evidence receipt.
- **Quality bar:** Exports are scoped, encrypted, time-limited, audited, and protected against CSV/archive attacks; erasure reaches derived indexes and integrations where contractually required.

### [x] TASK-178 — Add plans, entitlements, seats, and usage metering

- **Depends on:** TASK-027, TASK-048, TASK-135, TASK-171.
- **Deliverables:** Add plan/feature entitlements, creator/viewer seats, usage counters, quotas, grace states, admin usage view, billing-provider adapter, and webhook contract without hardcoding provider logic.
- **Quality bar:** Entitlements are server-enforced, billing webhooks are signed/idempotent, usage counters reconcile from source data, and payment failure never corrupts customer content.

### [x] TASK-179 — Build enterprise security administration

- **Depends on:** TASK-172 through TASK-178.
- **Deliverables:** Add security settings, SSO enforcement, session revocation, API-key inventory, integration inventory, domain inventory, retention/residency status, audit shortcuts, and security-contact configuration.
- **Quality bar:** High-risk changes require confirmation/reauthentication and emit audit events; status reflects real backend state; no secret values are exposed.

### [x] TASK-180 — Qualify enterprise readiness

- **Depends on:** TASK-171 through TASK-179.
- **Deliverables:** Add enterprise permission matrix tests, SSO threat tests, retention/export drills, audit completeness review, residency verification plan, compliance evidence index, and administrator runbooks.
- **Quality bar:** No unresolved privilege-escalation or cross-tenant issue, recovery procedures are tested, security claims match implemented controls, and gaps are explicitly labeled.

## Milestone 19 — AWS production infrastructure and delivery

Outcome: The locally developed platform deploys reproducibly to secure, observable, recoverable AWS staging and production environments sized for approximately 1,000 users.

### [x] TASK-181 — Establish AWS infrastructure as code

- **Depends on:** TASK-010.
- **Deliverables:** Create Terraform/CDK environment structure, remote state/locking, provider/version pinning, account/region conventions, VPC with two AZs, subnet tiers, security groups, VPC endpoints strategy, ECR, and tagging.
- **Quality bar:** Plans are repeatable and scanned; no database/cache is public; IAM bootstrap is documented and least-privilege; destroy protection is enabled for production stateful resources.

### [x] TASK-182 — Provision edge, storage, DNS, and WAF

- **Depends on:** TASK-181.
- **Deliverables:** Provision private S3 buckets, KMS where required, lifecycle/versioning, CloudFront distributions, Origin Access Control, ACM certificates, Route 53 records, access logs, WAF baseline, and separate clone-content origin.
- **Quality bar:** S3 public access is blocked, private/published cache policies are distinct, TLS/security headers pass tests, and clone isolation matches TASK-141 requirements.

### [x] TASK-183 — Provision ECS Fargate and load balancing

- **Depends on:** TASK-181, TASK-182.
- **Deliverables:** Add ECS cluster, task roles, web/API service across two AZs, ALB, health checks, autoscaling, deployment circuit breaker, log routing, and ECR image references.
- **Quality bar:** Tasks are stateless and non-root, IAM is service-specific, one-AZ/task failure preserves service, and unhealthy deployments automatically stop or roll back.

### [x] TASK-184 — Provision PostgreSQL and Redis

- **Depends on:** TASK-181.
- **Deliverables:** Add encrypted Multi-AZ RDS PostgreSQL, parameter groups, backups/PITR, deletion protection, monitoring, connection proxy/pooling, private Redis, auth/TLS where supported, alarms, and secret rotation plan.
- **Quality bar:** Neither service is internet-reachable; restores are tested before launch; runtime credentials cannot migrate schemas; cache loss does not corrupt source-of-truth behavior.

### [x] TASK-185 — Provision queues, workers, and schedules

- **Depends on:** TASK-183.
- **Deliverables:** Add workload-specific SQS queues/DLQs, ECS worker and media-worker services, queue-depth autoscaling, EventBridge schedules, visibility/timeouts, alarms, and DLQ replay tooling.
- **Quality bar:** Queue policies permit only intended producers/consumers, retries match job semantics, poisoned messages isolate, and scaling tests verify backlog recovery.

### [x] TASK-186 — Provision identity, email, secrets, and environment configuration

- **Depends on:** TASK-181, TASK-183.
- **Deliverables:** Add Cognito, SES identities/configuration, Secrets Manager, Parameter Store, task secret injection, KMS grants, environment validation, and production disablement of local auth/mocks.
- **Quality bar:** Secrets never appear in state outputs/logs where avoidable, IAM grants are resource-scoped, email authentication is configured, and auth redirect/origin allowlists are exact.

### [x] TASK-187 — Build staging and production deployment pipelines

- **Depends on:** TASK-181 through TASK-186.
- **Deliverables:** Add OIDC-based CI-to-AWS auth, image build/sign/scan, ECR push, reviewed infrastructure plan/apply, controlled migrations, ECS deployment, smoke tests, rollback, approvals, and release provenance.
- **Quality bar:** No long-lived AWS CI keys, production requires protected approval, migrations are backward-compatible, artifacts are immutable by commit SHA, and rollback is rehearsed.

### [x] TASK-188 — Implement production observability and alerting

- **Depends on:** TASK-009, TASK-183 through TASK-185.
- **Deliverables:** Add CloudWatch/OpenTelemetry collection, service/queue/database/CDN dashboards, frontend errors, synthetic user journeys, alert routing, SLO definitions, and actionable runbook links.
- **Quality bar:** Alerts fire on injected failures without leaking customer data, pages are actionable rather than noisy, and request correlation works across ALB/API/queue/worker.

### [x] TASK-189 — Implement backup, restore, and disaster recovery

- **Depends on:** TASK-182, TASK-184, TASK-185.
- **Deliverables:** Define RPO/RTO, RDS restore automation, S3 recovery/versioning procedures, configuration/state backups, queue failure handling, regional dependency inventory, and disaster-recovery runbook/exercise.
- **Quality bar:** A staging restore proves database and asset consistency, access remains least-privilege, recovery time is measured, and unresolved gaps have owners and deadlines.

### [x] TASK-190 — Qualify AWS staging capacity and cost controls

- **Depends on:** TASK-187 through TASK-189.
- **Deliverables:** Deploy representative staging data, run API/player/upload/media/analytics tests, validate autoscaling, create budgets/anomaly alerts, document baseline resource sizing, and produce production-readiness report.
- **Quality bar:** Target workload passes with headroom and no data exposure, cost alarms work, bottlenecks are measured rather than guessed, and production configuration has no unresolved high-risk scan findings.

## Milestone 20 — Security, reliability, accessibility, and production launch

Outcome: The complete platform is independently reviewed, tested against realistic load and failure, documented, and launched with measurable operational safeguards.

### [x] TASK-191 — Complete system threat model and security architecture review

- **Depends on:** TASK-180, TASK-190.
- **Deliverables:** Update data-flow diagrams, asset inventory, trust boundaries, abuse cases, controls, residual risks, threat owners, incident kill switches, and security test traceability across all modules.
- **Quality bar:** Review covers tenants, public links, embeds, uploads, cloned HTML, AI, integrations, AWS, CI/CD, insiders, and supply chain; all BLOCKER/HIGH gaps have fixes before continuation.

### [x] TASK-192 — Conduct independent penetration testing and remediate

- **Depends on:** TASK-191.
- **Deliverables:** Arrange independent test or dedicated red-team review, reproduce findings, prioritize, fix, add regression tests, retest, and document accepted lower risks with owners/expiry.
- **Quality bar:** All critical/high findings are verified closed; medium findings are fixed or formally accepted; no scanner suppression substitutes for remediation evidence.

### [x] TASK-193 — Validate performance for the 1,000-user target

- **Depends on:** TASK-190.
- **Deliverables:** Define workload model and SLOs; test 1,000 accounts, 100–200 concurrent authenticated users, higher anonymous viewers, uploads, publishing, analytics, AI queue limits, and degraded dependencies.
- **Quality bar:** p50/p95/p99 latency, error, saturation, and recovery targets pass with documented headroom; tests are reproducible and do not rely on unsafe production experimentation.

### [x] TASK-194 — Run reliability and failure exercises

- **Depends on:** TASK-189, TASK-193.
- **Deliverables:** Exercise task termination, AZ degradation, database failover, Redis loss, queue backlog, provider outage, failed deployment, bad migration recovery, CDN/origin issues, and DLQ replay.
- **Quality bar:** Core data remains correct, failures are visible and recoverable, published playback degrades gracefully, and every gap produces an owned corrective action.

### [x] TASK-195 — Complete accessibility and compatibility certification

- **Depends on:** TASK-160, TASK-170, TASK-193.
- **Deliverables:** Audit creator/player/Hub/agent journeys against WCAG 2.2 AA; test supported browsers, mobile devices, keyboard, screen readers, zoom, contrast, reduced motion, captions, and RTL.
- **Quality bar:** No critical/serious accessibility findings, supported-browser matrix passes, exceptions are documented with remediation dates, and accessibility is covered in regression CI.

### [x] TASK-196 — Finalize privacy, retention, and compliance operations

- **Depends on:** TASK-175, TASK-177, TASK-191.
- **Deliverables:** Verify data inventory, consent, subprocessors, retention schedules, account/workspace deletion, subject requests, AI data handling, incident contacts, DPA/security evidence workflow, and privacy documentation inputs.
- **Quality bar:** Product behavior matches published claims, deletion/export exercises pass, no undocumented personal-data flow remains, and legal decisions are explicitly assigned to authorized humans.

### [x] TASK-197 — Complete product, developer, support, and operational documentation

- **Depends on:** TASK-190 through TASK-196.
- **Deliverables:** Publish creator/admin/developer docs, API/embed/SDK guides, local development setup, architecture decisions, troubleshooting, status/error catalog, support escalation, security reporting, and on-call runbooks.
- **Quality bar:** A new engineer can run the stack from a clean checkout and an unfamiliar operator can resolve rehearsed incidents using only docs; examples are tested in CI where practical.

### [x] TASK-198 — Rehearse migrations, integrity checks, and launch operations

- **Depends on:** TASK-194, TASK-197.
- **Deliverables:** Add pre/post-deploy integrity checks, migration dry run on production-like copy, rollback/roll-forward plan, feature-flag sequence, seed/admin bootstrap, domain/email verification, and launch-day checklist.
- **Quality bar:** Migration duration and lock behavior are measured, no destructive step lacks backup/recovery, checks detect orphan/cross-tenant data, and launch can be aborted safely.

### [x] TASK-199 — Produce and approve the release candidate

- **Depends on:** TASK-192 through TASK-198.
- **Deliverables:** Freeze release commit, generate SBOM/provenance, complete final functional/security/visual regression, reconcile known risks, verify monitoring/support staffing, and obtain engineering/product/security/operations sign-off.
- **Quality bar:** CI is entirely green, no BLOCKER/HIGH finding remains, accepted risks are explicit, artifacts are immutable, and the exact candidate has passed staging smoke/load tests.

### [x] TASK-200 — Launch production and close the readiness loop

- **Depends on:** TASK-199.
- **Deliverables:** Deploy the approved candidate, execute smoke and synthetic journeys, monitor SLOs/queues/cost/security signals, verify backups and alerts, conduct launch review, and create prioritized post-launch work from real telemetry.
- **Quality bar:** Production meets go/no-go thresholds throughout the observation window; rollback remains available; incidents are handled through runbooks; completion is based on measured stability, not deployment success alone.
