SECURITY REVIEW REQUEST

Change summary:

- Added an exports workbench covering Copy Steps (HTML, plain text, and Markdown), visual guide output (HTML/PNG with browser Print-to-PDF guidance), MP4/GIF video controls, and a SCORM 1.2 package generator.
- Added the `/exports` route and editor entry point.

Files changed:

- apps/web/components/export-workbench.tsx
- apps/web/app/exports/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/export-workbench.test.mjs

Trust boundaries and sensitive data affected:

- The route uses fixed illustrative demo documents and browser-local file generation. No production demo, viewer, or storage data is fetched.
- User-entered SCORM source URLs, titles, identifiers, and export settings are untrusted browser input.

Authorization model:

- The local preview has no server persistence or authorization. Production exports must authorize the active workspace and demo for read/export access, enforce quotas, and audit downloads server-side.

Threats considered:

- SSRF through SCORM source URLs, XSS through copied step content, path traversal or zip bombs in generated packages, media resource exhaustion, formula injection in exported text, and accidental leakage of viewer or workspace data.

Security controls implemented:

- Existing domain export primitives normalize and bound step content, media URLs, SCORM sources, and ZIP entries; private-network and non-HTTPS SCORM destinations are rejected.
- Export labels, course metadata, source text, and media settings are bounded by allowlists and length/step limits.
- Preview HTML is kept in a read-only textarea; no `innerHTML`, eval, shell, network fetch, or user-controlled script execution is introduced.
- The SCORM package is generated from fixed files with a sandboxed iframe launch page and no credentials.

Security tests added:

- tests/export-workbench.test.mjs covers all four export paths, bounded settings, unsafe-sink checks, and the local trust-boundary disclaimer.
- Existing domain tests cover SCORM SSRF rejection, ZIP traversal/duplicate/size limits, safe SOP exports, and sanitization.

Checks run and results:

- npm run verify — passed.
- npm test — production build passed; one existing 5,000-item performance test was timing-sensitive under concurrent load (516 passed, 1 failed, 1 skipped on the first run). `node --test --test-concurrency=1 tests` passed with 517 passed and 1 skipped.
- npm run build — passed as part of npm test; `/exports`, `/analytics-dashboard`, and `/account-analytics` generated as static routes.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — exercised Copy Steps, PDF/PNG, MP4/GIF, and SCORM tabs and confirmed the bounded controls and local-only disclaimer.

Checks not run:

- No production object storage, video encoder, LMS, or authorization endpoint was contacted; native download/media behavior is not fully exercisable in the in-app browser.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local screen does not persist export jobs, enforce production workspace permissions, or provide server-side download audit records. Production media rendering requires isolated workers and resource quotas, and SCORM launch URLs must remain explicitly authorized and tenant-safe.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
