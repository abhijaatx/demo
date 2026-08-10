# SECURITY REVIEW REQUEST

Change summary:

- Added a local Demo Hub authoring workbench covering categories, searchable Supademo/Showcase content, appearance, launcher settings, and install-code preview.
- Added hub route and editor/workspace entry points.

Files changed:

- apps/web/components/demo-hub-workbench.tsx
- apps/web/app/demo-hub/page.tsx
- apps/web/components/workspace-reference-surface.tsx
- apps/web/components/editor-shell.tsx
- tests/demo-hub-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Hub names, category names, catalog searches, allowed domains, footer links, and uploaded local image objects are untrusted browser inputs.
- In production, hub content and SDK configuration cross the authenticated workspace, public embed, and third-party host boundaries.

Authorization model:

- The current surface is a local preview only. Production create/edit/publish/install operations must require workspace authorization, scope every hub/category/content lookup by workspace ID, and authorize allowed domains and asset access on the server.

Threats considered:

- Cross-workspace content leakage, malicious domain allowlists, open redirects, XSS through hub labels/footer URLs, unsafe image uploads, SDK abuse, forged embed events, and unauthorized publishing.

Security controls implemented:

- Hub/category/search text is length-bounded and rendered through React text/value bindings.
- Allowed domains are normalized against a strict hostname character allowlist and capped at ten entries.
- Footer links are passed through validateSafeUrl before external anchors; generated SDK source and hub IDs are fixed/domain-controlled.
- Image previews require image MIME and a 2 MB client limit, use object URLs, and revoke object URLs during cleanup.
- No unsafe HTML or dynamic code execution is used; install code is displayed as read-only text.

Security tests added:

- tests/demo-hub-workbench.test.mjs checks authoring/publish helpers, all three tabs, SDK options/toggle, allowed-domain/default-index controls, file bounds/object URL cleanup, route links, and unsafe sinks.

Checks run and results:

- npm run verify — passed.
- Targeted workbench tests — to be run with the full serial suite before commit.
- Browser interaction verification — pending for category, appearance, and install flows.

Checks not run:

- Native image file chooser/upload and real third-party embed installation are unavailable in the in-app browser.
- Claude security review is unavailable in this environment; an independent reviewer must inspect the final diff before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Client allowlist checks are advisory only; production must validate host origins server-side and in the SDK, enforce CSP/sandbox/postMessage origin checks, scan stored assets, authorize publication, and rate-limit public widget traffic.
- The preview uses static catalog data and does not exercise production storage, analytics, or multi-tenant persistence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
