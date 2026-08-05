# SECURITY REVIEW REQUEST

Change summary:

- Added a local branding workbench for watermark settings, logo/favicon identity, share-page CTA text/links/colors, and a live share-page preview.
- Added a route and editor entry point.

Files changed:

- apps/web/components/branding-workbench.tsx
- apps/web/app/branding/page.tsx
- apps/web/components/editor-shell.tsx
- tests/branding-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Workspace administrators would configure branding that is rendered on shared/public demo pages.
- Browser-entered URLs, color values, copy, and image files are untrusted; production persistence and published assets cross the workspace/public viewer boundary.

Authorization model:

- The current surface is a local preview only. Production saves must require an authenticated workspace administrator, scope settings by workspace ID, and authorize paid-plan watermark/branding capabilities server-side.

Threats considered:

- Stored/reflected XSS through CTA/watermark links or copy, open redirects, malicious uploads, cross-tenant theme reads, unauthorized branding changes, and secret/PII leakage in previews or logs.

Security controls implemented:

- External links must pass validateSafeUrl and an explicit HTTP(S) check before rendering.
- Share CTA text is bounded at 50 characters; URL fields are bounded at 500; colors and fonts use existing allowlist sanitizers.
- Image previews accept image MIME types below 2 MB, use object URLs, and revoke them during cleanup.
- React text/value bindings are used throughout; no unsafe HTML or dynamic code execution is present.
- Preview is explicitly labeled local and contains no credential or personal data.

Security tests added:

- tests/branding-workbench.test.mjs checks tabs, CTA length, URL/color/font sanitizers, file bounds/object URL cleanup, production boundary notice, and unsafe sinks.

Checks run and results:

- npm run verify — passed.
- Targeted workbench tests — to be run with the full serial suite before commit.
- Browser interaction verification — pending for all tabs and invalid-link error handling.

Checks not run:

- Native file chooser/upload cannot be exercised in the in-app browser.
- Claude security review is unavailable in this environment; an independent reviewer must inspect the final diff before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production must validate file signatures/dimensions, scan uploads, store them privately with tenant-scoped keys, enforce CSP and image policies, persist settings through authorized APIs, audit changes, and escape/sanitize values again at publish/render boundaries.
- The existing branding theme model preserves logoUrl as a string; production storage/rendering must reject unsafe schemes and untrusted origins before persistence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
