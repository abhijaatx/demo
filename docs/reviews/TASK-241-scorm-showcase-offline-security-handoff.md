# Security review request — TASK-241 SCORM, showcase, and offline workflows

## Change summary

- Added an iframe-to-SCORM 1.2 generator that validates public HTTPS sources, emits a bounded launch package, and reports completion to an LMS API.
- Added Showcase authoring with bounded sections/resources, public-link validation, local draft persistence, publish status, and a local share viewer.
- Added offline demo downloads, a bounded portable ZIP/player, and an Offline Demos page that presents a validated local document.
- Fixed controlled Showcase inputs so React deferred state updates do not read a nulled event target.
- Hardened the shared stored-ZIP writer against traversal, malformed names, oversized entries, and oversized packages.

## Files changed

- packages/domain/src/scorm-package.ts
- packages/domain/src/showcase-authoring.ts
- packages/domain/src/index.ts
- apps/web/components/scorm-generator-workbench.tsx
- apps/web/components/showcase-editor.tsx
- apps/web/components/workspace-showcase-viewer.tsx
- apps/web/components/workspace-reference-surface.tsx
- apps/web/components/offline-player.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/marketing-tool-detail.tsx
- apps/web/src/lib/offline-export.ts
- apps/web/app/showcase/page.tsx
- apps/web/app/offline/page.tsx
- apps/web/app/globals.css
- tests/scorm-package.test.mjs
- tests/showcase-authoring.test.mjs
- tests/offline-export.test.mjs
- tests/editor-sharing.test.mjs

## Trust boundaries and sensitive data affected

- Creator-supplied URLs, iframe markup, titles, descriptions, identifiers, demo documents, and resource metadata are parsed in the browser and written to generated artifacts or local storage.
- SCORM launch packages load a creator-selected third-party HTTPS origin inside a sandboxed iframe and receive cross-window progress messages.
- Offline packages contain validated demo documents and may reference remote media; the browser stores them under origin-scoped local-storage keys.
- Showcase records and share links are currently local-browser MVP data, not server-backed tenant records.

## Authorization model

- SCORM generation, Showcase authoring, and offline download controls are exposed from the authenticated-looking local workspace UI but currently have no new server endpoint or server-side authorization check.
- Existing editor read-only/publish guards remain in force for editor mutations.
- Offline and Showcase records are scoped to the current browser origin; this is not a substitute for production workspace authorization, publication policy, tenant scoping, or access revocation.
- A production implementation must persist these records server-side and enforce workspace membership and public-link policy on every read/write/publish operation.

## Threats considered

- SSRF-like private-network and credential-bearing URL inputs, dangerous schemes, malformed iframe markup, and open redirects.
- Stored/reflected XSS through titles, descriptions, identifiers, generated HTML, XML, static player text, and cross-origin postMessage data.
- Sandbox escapes, forged progress/completion messages, untrusted embeds, and top-navigation/pop-up abuse.
- ZIP path traversal, malformed filenames, oversized entries/packages, decompression/resource exhaustion, and unsafe offline media.
- Local-storage tampering, oversized records, cross-origin leakage, and stale/invalid persisted documents.
- Cross-tenant access and unauthenticated publication risk when browser-only MVP storage is replaced by a backend.

## Security controls implemented

- SCORM and Showcase URLs require HTTPS, reject credentials and localhost/private/link-local address ranges, remove URL fragments, and normalize Supademo /demo/ links to /embed/.
- SCORM titles, identifiers, and URL attributes are escaped for XML/HTML; completion messages require the expected iframe source, exact origin, and data.source equal to Supademo.
- Generated SCORM content uses an iframe sandbox without allow-same-origin, omits creator-controlled scripts, and has bounded title, identifier, aspect-ratio, height, timeout, and active-time settings.
- Showcase parsing caps sections/items and text lengths, sanitizes all resource URLs, and renders persisted content through React text nodes and safe links.
- Showcase share identifiers are allowlisted and bounded; malformed/missing records produce a generic unavailable state without rendering raw input.
- Offline records are parsed through the domain demo schema, capped at 25 records and 5 MB per document, and stored under origin-scoped keys.
- Offline ZIP content is static, uses textContent/DOM construction instead of innerHTML or dynamic code execution, omits credentials, and restricts remote media to HTTPS.
- The common ZIP writer rejects absolute/backslash/traversal/control-character names, empty packages, oversized entries, and packages over its total bound.
- Controlled Showcase fields snapshot DOM values before deferred state updates; a regression test covers the previously observed runtime crash.

## Security tests added

- tests/scorm-package.test.mjs covers iframe extraction, Supademo normalization, dangerous/private/credentialed URL rejection, escaping, message-origin checks, ZIP validity, and ZIP traversal/size bounds.
- tests/showcase-authoring.test.mjs covers URL policy, content bounds, explicit publishing, and the controlled-input regression guard.
- tests/offline-export.test.mjs covers local-storage bounds, static-player safety, and the offline-only viewer boundary.
- tests/editor-sharing.test.mjs covers the Share panel's offline/export/present surfaces.
- Browser checks exercised Showcase create/resource/publish/share viewing and editor Share → Download → Offline Demos → Present.

## Checks run and results

- npm run format — passed.
- npm run typecheck — passed.
- npm run verify — passed.
- npm run build — passed.
- node --test tests — passed (488 passed, 1 skipped, 0 failed).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- git diff --check — passed.

## Checks not run

- Claude security review is not available in this environment; an independent review remains required before production release.
- No production backend, IAM, object-storage, media-worker, or deployment changes were made, so infrastructure checks for those surfaces were not applicable to this local MVP batch.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Showcase and offline data are browser-local and therefore not collaborative, durable, or suitable for production tenant sharing. The local share URL works only in the browser origin that created it.
- SCORM packages intentionally load the original remote demo URL at learner time; availability, CSP, third-party cookies, and LMS hosting policies can affect playback.
- SCORM completion is advisory client-side behavior until the LMS validates the package and the server validates any viewer events.
- Offline ZIPs do not bundle remote media; a network-independent package with media would require a server-side fetch/scan pipeline with strict SSRF and resource controls.
- Production promotion requires server-side authentication, tenant checks, rate limits, audit logging, encrypted persistence, public-link revocation, upload/media controls, and a fresh independent security review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
