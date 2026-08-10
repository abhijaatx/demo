# SECURITY REVIEW REQUEST

Change summary:

- Added Supademo "Embed" chapters (embed forms, surveys, and calendars) to the canonical chapter model, the ChapterEditor, and the DemoViewer. A new `embed` chapter type stores a single bounded, normalized public HTTPS `embedUrl` (max 2048 chars); the editor exposes an accessible Embed URL textbox with Go (stage preview) and Save (persist) semantics, and the viewer renders the validated URL inside a restrictive sandbox iframe. No arbitrary HTML is ever accepted or rendered, and an invalid/missing URL renders a safe placeholder and never attempts navigation or a fetch. This is a client-side rendering feature: the embedded third-party content still executes in its own sandboxed iframe, which is the documented Supademo behavior (viewers interact with Tally, Calendly, Google Forms, HubSpot, Jotform, Cal.com, SurveyMonkey, Qualtrics, etc. without leaving the demo).

Files changed:

- packages/domain/src/public-url.ts (new: shared bounded public-HTTPS sanitizer `sanitizePublicHttpsUrl`, factored from the showcase sanitizer with extra IPv6/IPv4-shorthand hardening)
- packages/domain/src/showcase-authoring.ts (sanitizeShowcaseUrl now delegates to the shared sanitizer; identical public behavior plus a 2048-char bound and stricter private-host rejection)
- packages/domain/src/chapter-model.ts (`ChapterType` gains `"embed"`, `DemoChapter.embedUrl`, exported `sanitizeEmbedUrl`, parser wiring that only honors embedUrl on embed chapters)
- packages/domain/src/index.ts (exports sanitizeEmbedUrl)
- packages/domain/src/publication-pipeline.ts (re-normalizes embedUrl on publish)
- apps/web/components/editor/chapter-editor.tsx ("Embed" chapter type + ChapterEmbedSettings with Go/Save/Remove, bounded input, read-only gating, type-switch clears embedUrl)
- apps/web/components/editor-shell.tsx (embedUrl default on new chapters, re-normalization in handleUpdateChapter and safeExportDocument)
- apps/web/components/demo-viewer.tsx (restrictive sandbox iframe rendering + safe placeholder, defense-in-depth re-sanitization)
- apps/web/app/globals.css (viewer embed iframe/placeholder and editor preview styles)
- tests/chapter-model.test.mjs, tests/chapter-editor.test.mjs, tests/demo-viewer-embed.test.mjs (new), tests/publication-pipeline.test.mjs (regression tests)
- docs/reviews/TASK-embed-forms-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- Untrusted serialized demo documents can now carry an `embedUrl`. The value crosses the parser boundary (normalized/rejected), the publication boundary (re-normalized), and the viewer boundary (re-sanitized before it becomes an iframe `src`).
- The embedded third-party page runs in an iframe with `sandbox="allow-scripts allow-forms"` (no `allow-same-origin`), `referrerPolicy="no-referrer"`, and `loading="lazy"`; it never receives Supademo cookies, storage, or parent-origin access.
- The editor draft URL exists only in local component state; only the normalized validated URL is persisted to the chapter object.
- No new endpoints, network calls from the app server, or third-party SDKs were added. The iframe load is initiated by the viewer's browser, not the server.

Authorization model:

- No new endpoints, permissions, or server enforcement. Embed URLs are content a demo author adds; the viewer renders them for the audience of the published demo, exactly like chapter CTA button URLs. Editor mutations flow through the existing readOnly-gated handlers; switching a chapter away from the `embed` type clears `embedUrl`.

Evidence limitation (documented honestly):

- Behavior follows the official docs page https://docs.supademo.com/customize/chapters/embed-forms-surveys-calendars-1 (editor > Add Chapter > Chapter Settings > Embed; paste an Embed URL; click Go to load a preview; click Save to apply). The live Supademo app is login-gated, so no live end-to-end capture of the hosted product was possible; behavior was verified against the local app and the documentation.

Threats considered:

- Arbitrary HTML/script injection via an "embed code" field (avoided: input is URL-only; nothing is rendered through dangerouslySetInnerHTML/innerHTML/eval).
- javascript:/data:/vbscript: and other non-HTTPS schemes reaching an iframe or navigation sink.
- SSRF-adjacent and privacy leaks: credentials in URLs, private/localhost/link-local/metadata hosts (10/8, 127/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7, fe80::/10, ::, ::ffff: IPv4-mapped, IPv4 numeric shorthands like 127.1), and hash fragments carrying sensitive identifiers (stripped).
- Overlong values (rejected outright, never truncated into an accepted shorter URL).
- The embedded page escaping its sandbox (mitigated: no allow-same-origin, no allow-top-navigation, referrer stripped; residual risk documented below).
- Clickjacking/phishing inside the embed (inherent to embedding third-party content; documented).
- Regression to existing chapter types: gate, forms, voiceovers, branching, media, translations, buttons, and navigation.
- A malformed embedUrl on a non-embed chapter changing other chapter behavior (ignored by the parser and the viewer).

Security controls implemented:

- `sanitizePublicHttpsUrl` (packages/domain/src/public-url.ts): trims, rejects overlong input (>2048 chars), requires `https:` exactly, rejects username/password credentials, strips the hash fragment, and rejects private/link-local/metadata hosts including IPv6 loopback/ULA/link-local, the unspecified `::`, the IPv4-mapped `::ffff:` form, and numeric IPv4 shorthands. Invalid URLs return null (fail closed).
- `sanitizeEmbedUrl` (chapter-model.ts) wraps the shared sanitizer with the chapter's 2048-char bound and is exported for editor/viewer use.
- The canonical parser only keeps `embedUrl` on `type === "embed"` chapters; any serialized embedUrl on another type is dropped, so it can never change other chapter behavior. Legacy chapters absent the field get `null`.
- The editor accepts a URL (never HTML), bounds input to 2048 chars with maxLength and slice, shows an invalid state via aria-invalid, and: Go stages a preview iframe only for a sanitized URL; Save persists only the sanitized URL; an invalid value is never persisted or previewed; Remove clears it; switching the chapter type away from `embed` clears `embedUrl`; read-only mode disables every mutation.
- The viewer renders the iframe only when the re-sanitized `chapterEmbedUrl` is non-null, with a descriptive `title`, `loading="lazy"`, `referrerPolicy="no-referrer"`, and `sandbox="allow-scripts allow-forms"` (no `allow-same-origin`). Missing/invalid URLs render a static placeholder; there is no navigation or fetch from the embed path.
- Publication and export re-normalize `embedUrl` through the sanitizer so a published manifest can only carry valid public HTTPS URLs.

Security tests added:

- Parser: embed round-trip normalization (trim, hash removal); rejection table (javascript:, data:, vbscript:, http:, credentials, localhost, 127.0.0.1, 127.1, 0.0.0.0, 10/172.16/172.31/192.168/169.254, [::], [::1], [fd00::1], [fe80::1], [::ffff:127.0.0.1], malformed, overlong); embedUrl ignored on non-embed chapters; legacy defaults (tests/chapter-model.test.mjs).
- Sanitizer: overlong values are rejected, never truncated (tests/chapter-model.test.mjs).
- Editor contract: "Embed" option, ChapterEmbedSettings, bounded input, Go/Save wiring, restrictive preview iframe, Remove, type-switch clearing, read-only, no unsafe HTML sinks (tests/chapter-editor.test.mjs).
- Viewer: iframe rendered only for sanitized embed chapters with title/lazy/no-referrer/allow-scripts+allow-forms and never allow-same-origin; no dangerouslySetInnerHTML/innerHTML/eval; safe placeholder for invalid/missing; no location/fetch sink near embedUrl; existing buttons/forms/gates/voiceovers intact (tests/demo-viewer-embed.test.mjs).
- Publication: manifest re-normalizes safe embed URLs (hash stripped) and drops unsafe ones (tests/publication-pipeline.test.mjs).

Checks run and results:

- Focused: node --test tests/chapter-model.test.mjs tests/chapter-editor.test.mjs tests/demo-viewer-embed.test.mjs tests/demo-viewer-password-gate.test.mjs tests/publication-pipeline.test.mjs tests/demo-document.test.mjs tests/showcase-authoring.test.mjs — 51 passed, 0 failed, 0 skipped.
- Full suite: npm run build passed (tsc --build + api:contract + api:types + next build); node --test 'tests/*.test.mjs' — 601 tests, 600 passed, 1 pre-existing skip, 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed (tsc --build + next typegen + tsc --noEmit for @supademo/web).
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- npm run security:placeholders — passed (documents deferred sast/container/iac placeholders).
- git diff --check — clean.

Checks not run / environment notes:

- The repo's `npm test` script ends with `node --test tests` (bare directory argument), which fails in this environment under Node v26.3.0 with "Cannot find module .../tests" (a pre-existing script/Node-version incompatibility, not caused by this change). The equivalent full suite was therefore run with `node --test 'tests/*.test.mjs'` (the same command all prior slices used) — 601 tests, 600 passed, 1 skipped, 0 failed. The `npm run build` step of `npm test` passed.
- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.
- No automated browser-level test harness for the embed interaction was added in this slice (structural/contract tests only). A manual local-browser pass verified that invalid `javascript:` input is rejected, a public HTTPS URL previews and saves, and the viewer renders the saved embed chapter.

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.

Known limitations and residual risks:

- Embedding third-party content always means trusting that provider's script inside a sandboxed iframe. The sandbox (`allow-scripts allow-forms`, no same-origin, no top-navigation) contains the blast radius, but a compromised or hostile provider page could still render misleading content or attempt phishing. Supademo's documented feature is inherently "embed third-party tools"; the sandbox and no-referrer policy are the available client-side mitigations, and they cannot fully protect viewers from a malicious embed provider. Production should additionally validate embed host allowlists (e.g., known form/calendar providers) if the product wants stricter guarantees, and should consider a server-side allowlist of permitted embed hosts.
- The sanitizer rejects numeric IPv4 shorthands (127.1), single-token hex IPv4 spellings (0x7f000001), and all `::ffff:` IPv4-mapped hosts as defense in depth, but exotic DNS-based rebinding (e.g., a hostname that resolves to a private address, such as 127.0.0.1.nip.io) is not exhaustively enumerated; DNS resolution is not performed (client-side rendering only, so there is no server-side fetch to protect). The IPv6 ULA/link-local checks only apply to hosts that contain ":", so public hostnames such as fda.gov are never misclassified.
- The iframe is not a real access-control boundary: an author could embed a page that leaks the viewer's IP or performs client-side tracking. referrerPolicy="no-referrer" limits referrer leakage from the demo viewer.
- There is no per-embed height/width configuration; embeds render at a fixed responsive height, which may not match every provider's optimal embed size.
- The live app is login-gated, so hosted end-to-end verification of the Supademo Embed chapter flow was not possible; the local app and docs were used.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
